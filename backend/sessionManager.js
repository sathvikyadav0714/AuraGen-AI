
const { randomUUID } = require("crypto");
const db = require("./database");

const insertSession = db.prepare(`
    INSERT INTO sessions (
        session_id,
        form_data,
        cognitive_load_score,
        interaction_history,
        generation_triggered,
        created_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
`);

const selectSession = db.prepare(`
    SELECT * FROM sessions WHERE session_id = ?
`);

const updateSession = db.prepare(`
    UPDATE sessions
    SET form_data = ?,
        cognitive_load_score = ?,
        interaction_history = ?,
        generation_triggered = ?
    WHERE session_id = ?
`);

function formatSession(row) {
    if (!row) return null;

    return {
        sessionId: row.session_id,
        formData: JSON.parse(row.form_data),
        cognitiveLoadScore: row.cognitive_load_score,
        interactionHistory: JSON.parse(row.interaction_history),
        generationTriggered: Boolean(row.generation_triggered),
        createdAt: row.created_at
    };
}

function createSession() {
    const session = {
        sessionId: randomUUID(),
        formData: {},
        cognitiveLoadScore: 0,
        interactionHistory: [],
        generationTriggered: false,
        createdAt: new Date().toISOString()
    };

    insertSession.run(
        session.sessionId,
        JSON.stringify(session.formData),
        session.cognitiveLoadScore,
        JSON.stringify(session.interactionHistory),
        0,
        session.createdAt
    );

    return session;
}

function getSession(sessionId) {
    const row = selectSession.get(sessionId);
    return formatSession(row);
}

function saveSession(session) {
    updateSession.run(
        JSON.stringify(session.formData),
        session.cognitiveLoadScore,
        JSON.stringify(session.interactionHistory),
        session.generationTriggered ? 1 : 0,
        session.sessionId
    );
}

function updateFormData(sessionId, newFormData) {
    const session = getSession(sessionId);

    if (!session) return null;

    session.formData = {
        ...session.formData,
        ...newFormData
    };

    saveSession(session);

    return session.formData;
}

function addTelemetryEvent(sessionId, event) {
    const session = getSession(sessionId);

    if (!session) return null;

    const telemetryEvent = {
        ...event,
        timestamp: new Date().toISOString()
    };

    session.interactionHistory.push(telemetryEvent);

    if (event.cognitiveLoadScore !== undefined) {
        session.cognitiveLoadScore = event.cognitiveLoadScore;
    }

    saveSession(session);

    return telemetryEvent;
}

function updateGenerationTriggered(sessionId, value) {
    const session = getSession(sessionId);

    if (!session) return null;

    session.generationTriggered = value;
    saveSession(session);

    return session;
}

module.exports = {
    createSession,
    getSession,
    addTelemetryEvent,
    updateFormData,
    updateGenerationTriggered
};
