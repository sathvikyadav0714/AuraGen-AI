const {
    createGeneration,
    getGeneration,
    getGenerationContext
} = require("./generationManager");

const { getSession } = require("./sessionManager");
const { buildGenerationContext } = require("./generationContext");

const activeGenerations = new Map();

function requestGeneration(req, res) {
    const { sessionId } = req.params;

    const session = getSession(sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            message: "Session not found"
        });
    }

    const existingId = activeGenerations.get(sessionId);

    if (existingId) {
        const existing = getGeneration(existingId);

        if (existing && existing.status === "pending") {
            return res.status(409).json({
                success: false,
                message: "Generation already in progress",
                data: existing
            });
        }
    }

    let context;

    try {
        context = buildGenerationContext(session);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    const generation = createGeneration(sessionId, context);

    activeGenerations.set(sessionId, generation.generationId);

    return res.status(202).json({
        success: true,
        message: "AI generation request accepted",
        data: generation,
        contextReady: true
    });
}

module.exports = {
    requestGeneration
};