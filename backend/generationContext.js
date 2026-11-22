const FRICTION_EVENTS = new Set([
    "rage_click",
    "hesitation",
    "validation_error",
    "failed_interaction"
]);

function buildGenerationContext(session) {
    if (!session || typeof session !== "object") {
        throw new Error("Valid session is required");
    }

    const history = Array.isArray(session.interactionHistory)
        ? session.interactionHistory
        : [];

    const frictionEvents = history.filter(event =>
        FRICTION_EVENTS.has(event.eventType)
    );

    const latestFieldEvent = [...frictionEvents]
        .reverse()
        .find(event =>
            typeof event.field === "string" &&
            event.field.trim() !== ""
        );

    const problematicField = latestFieldEvent
        ? latestFieldEvent.field.trim()
        : "unknown";

    const recentEvents = frictionEvents.slice(-5);

    const frictionDetails = recentEvents.length > 0
        ? recentEvents.map(event => {
            const field = event.field
                ? ` on field '${event.field}'`
                : "";

            return `${event.eventType}${field}`;
        }).join("; ")
        : "Generation requested without recorded friction events.";

    return {
        cognitiveLoadScore: Number.isFinite(session.cognitiveLoadScore)
            ? session.cognitiveLoadScore
            : 0,

        problematicField,

        frictionDetails,

        formData:
            session.formData &&
            typeof session.formData === "object" &&
            !Array.isArray(session.formData)
                ? session.formData
                : {}
    };
}

module.exports = { buildGenerationContext };