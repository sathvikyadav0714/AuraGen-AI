const {
    createGeneration,
    getGeneration,
    getGenerationContext,
    updateGeneration
} = require("./generationManager");

const { getSession } = require("./sessionManager");
const { buildGenerationContext } = require("./generationContext");
const { broadcastToSession } = require("./websocketServer");

const activeGenerations = new Map();

async function executeGeneration(generationId, sessionId) {
    try {
        const context = getGenerationContext(generationId);

        if (!context) {
            throw new Error("Generation context not found");
        }

        // Load the ES module from the AI folder.
        const { generateUI } = await import("../ai/llmService.js");

        const aiResult = await generateUI(context);

        if (!aiResult.success) {
            const error = aiResult.error || {};
            const message = error.message || "AI generation failed";

            const failedGeneration = updateGeneration(
                generationId,
                "failed",
                message
            );

            broadcastToSession(sessionId, {
                type: "generation_failed",
                data: {
                    generationId,
                    error,
                    generation: failedGeneration
                }
            });

            return;
        }

        const completedGeneration = updateGeneration(
            generationId,
            "completed",
            null,
            aiResult.data
        );

        broadcastToSession(sessionId, {
            type: "ui_generated",
            data: {
                generationId,
                sessionId,
                ui: aiResult.data,
                generation: completedGeneration
            }
        });

    } catch (error) {
        console.error("Generation execution failed:", error.message);

        const failedGeneration = updateGeneration(
            generationId,
            "failed",
            error.message
        );

        broadcastToSession(sessionId, {
            type: "generation_failed",
            data: {
                generationId,
                error: {
                    code: "GENERATION_FAILED",
                    message: error.message
                },
                generation: failedGeneration
            }
        });

    } finally {
        if (activeGenerations.get(sessionId) === generationId) {
            activeGenerations.delete(sessionId);
        }
    }
}

function startGeneration(sessionId) {
    const session = getSession(sessionId);

    if (!session) {
        return {
            success: false,
            statusCode: 404,
            message: "Session not found"
        };
    }

    const existingId = activeGenerations.get(sessionId);

    if (existingId) {
        const existing = getGeneration(existingId);

        if (existing && existing.status === "pending") {
            return {
                success: false,
                statusCode: 409,
                message: "Generation already in progress",
                data: existing
            };
        }

        activeGenerations.delete(sessionId);
    }

    let context;

    try {
        context = buildGenerationContext(session);
    } catch (error) {
        return {
            success: false,
            statusCode: 400,
            message: error.message
        };
    }

    const generation = createGeneration(sessionId, context);

    activeGenerations.set(sessionId, generation.generationId);

    broadcastToSession(sessionId, {
        type: "generation_started",
        data: generation
    });

    // Keep unit tests independent of real Groq API calls.
    if (process.env.NODE_ENV !== "test") {
        setImmediate(() => {
            executeGeneration(generation.generationId, sessionId);
        });
    }

    return {
        success: true,
        generation,
        contextReady: true
    };
}

function requestGeneration(req, res) {
    const result = startGeneration(req.params.sessionId);

    if (!result.success) {
        return res.status(result.statusCode).json({
            success: false,
            message: result.message,
            ...(result.data ? { data: result.data } : {})
        });
    }

    return res.status(202).json({
        success: true,
        message: "AI generation request accepted",
        data: result.generation,
        contextReady: result.contextReady
    });
}

module.exports = {
    requestGeneration,
    startGeneration
};