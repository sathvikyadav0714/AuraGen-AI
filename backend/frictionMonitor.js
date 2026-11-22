
const HIGH_FRICTION_THRESHOLD = 70;

function evaluateFriction(session) {
    const score = session.cognitiveLoadScore;

    const isHighFriction = score >= HIGH_FRICTION_THRESHOLD;

    let shouldTriggerGeneration = false;

    if (isHighFriction && !session.generationTriggered) {
        session.generationTriggered = true;
        shouldTriggerGeneration = true;
    }

    if (!isHighFriction) {
        session.generationTriggered = false;
    }

    return {
        threshold: HIGH_FRICTION_THRESHOLD,
        isHighFriction,
        shouldTriggerGeneration
    };
}

module.exports = { evaluateFriction };
