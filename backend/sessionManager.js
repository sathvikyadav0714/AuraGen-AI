
const { randomUUID } = require("crypto");

const sessions = new Map();

function createSession() {
    const sessionId = randomUUID();

    const session = {
        sessionId: sessionId,
        formData: {},
        cognitiveLoadScore: 0,
        interactionHistory: [],
        createdAt: new Date()
    };

    sessions.set(sessionId, session);

    return session;
}

function getSession(sessionId) {
    return sessions.get(sessionId);
}

module.exports = {
    createSession,
    getSession
};
