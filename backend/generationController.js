
const {
    createGeneration,
    getGeneration
} = require("./generationManager");

const activeGenerations = new Map();

function requestGeneration(req, res) {
    const { sessionId } = req.params;

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

    const generation = createGeneration(sessionId);

    activeGenerations.set(sessionId, generation.generationId);

    res.status(202).json({
        success: true,
        message: "AI generation request accepted",
        data: generation
    });
}

module.exports = { requestGeneration };
