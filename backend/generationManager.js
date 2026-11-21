
const { randomUUID } = require("crypto");

const generations = new Map();

function createGeneration(sessionId) {
    const generationId = randomUUID();

    const generation = {
        generationId,
        sessionId,
        status: "pending",
        createdAt: new Date().toISOString(),
        completedAt: null,
        error: null
    };

    generations.set(generationId, generation);

    return generation;
}

function getGeneration(generationId) {
    return generations.get(generationId);
}

function updateGeneration(generationId, status, error = null) {
    const generation = generations.get(generationId);

    if (!generation) return null;

    generation.status = status;
    generation.error = error;

    if (status === "completed" || status === "failed") {
        generation.completedAt = new Date().toISOString();
    }

    return generation;
}

module.exports = {
    createGeneration,
    getGeneration,
    updateGeneration
};
