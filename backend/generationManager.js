const { randomUUID } = require("crypto");

const generations = new Map();
const generationContexts = new Map();

function createGeneration(sessionId, context = null) {
    const generationId = randomUUID();

    const generation = {
        generationId,
        sessionId,
        status: "pending",
        result: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        error: null
    };

    generations.set(generationId, generation);

    if (context) {
        generationContexts.set(generationId, context);
    }

    return generation;
}

function getGeneration(generationId) {
    return generations.get(generationId) || null;
}

function getGenerationContext(generationId) {
    return generationContexts.get(generationId) || null;
}

function updateGeneration(
    generationId,
    status,
    error = null,
    result = null
) {
    const generation = generations.get(generationId);

    if (!generation) return null;

    const allowedStatuses = ["pending", "completed", "failed"];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid generation status");
    }

    generation.status = status;
    generation.error = error;

    if (result !== null) {
        generation.result = result;
    }

    if (status === "completed" || status === "failed") {
        generation.completedAt = new Date().toISOString();
    }

    return generation;
}

module.exports = {
    createGeneration,
    getGeneration,
    getGenerationContext,
    updateGeneration
};