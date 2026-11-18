
const { randomUUID } = require("crypto");

const sessions = new Map();

function createSession() {
    const sessionId = randomUUID();

    const session = {
        sessionId: sessionId,
        formData: {},
        cognitiveLoadScore: 0,
        interactionHistory: [],
        generationTriggered: false,
        createdAt: new Date()
    };

    sessions.set(sessionId, session);

    return session;
}

function getSession(sessionId) {
    return sessions.get(sessionId);
}

function updateFormData(sessionId, newFormData) {
    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    session.formData = {
        ...session.formData,
        ...newFormData
    };

    return session.formData;
}

// Add telemetry event to a user session
function addTelemetryEvent(sessionId, event) {
    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    const telemetryEvent = {
        ...event,
        timestamp: new Date().toISOString()
    };

    session.interactionHistory.push(telemetryEvent);

    if (event.cognitiveLoadScore !== undefined) {
        session.cognitiveLoadScore = event.cognitiveLoadScore;
    }

    return telemetryEvent;
}

module.exports = {
    createSession,
    getSession,
    addTelemetryEvent,
    updateFormData
};
