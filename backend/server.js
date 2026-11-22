
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");

const {
    initializeWebSocket,
    broadcastToSession
} = require("./websocketServer");

const { getGeneration } = require("./generationManager");
const { requestGeneration } = require("./generationController");
const { evaluateFriction } = require("./frictionMonitor");

const {
    createSession,
    getSession,
    addTelemetryEvent,
    updateFormData,
    updateGenerationTriggered
} = require("./sessionManager");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Validate session ID format
function validateSessionId(req, res, next) {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(req.params.sessionId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID format"
        });
    }

    next();
}

// Validate financial form data
function validateFormData(formData) {
    if (
        !formData ||
        typeof formData !== "object" ||
        Array.isArray(formData)
    ) {
        return "Form data must be a valid object";
    }

    const entries = Object.entries(formData);

    if (entries.length === 0) {
        return "Form data cannot be empty";
    }

    if (entries.length > 50) {
        return "Maximum 50 form fields are allowed";
    }

    const forbiddenKeys = [
        "__proto__",
        "prototype",
        "constructor"
    ];

    for (const [key, value] of entries) {
        if (
            !key.trim() ||
            key.length > 100 ||
            forbiddenKeys.includes(key)
        ) {
            return "Invalid form field name";
        }

        if (typeof value === "string" && value.length > 5000) {
            return `Form field '${key}' exceeds the maximum length`;
        }

        if (
            typeof value === "number" &&
            !Number.isFinite(value)
        ) {
            return `Form field '${key}' must contain a valid number`;
        }

        if (value !== null && typeof value === "object") {
            return `Form field '${key}' cannot contain nested objects or arrays`;
        }

        if (
            !["string", "number", "boolean"].includes(typeof value) &&
            value !== null
        ) {
            return `Invalid value for form field '${key}'`;
        }
    }

    return null;
}

// Health Check API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AuraGen Backend is running!",
        status: "Healthy"
    });
});

// Create session
app.post("/api/sessions", (req, res) => {
    const session = createSession();

    res.status(201).json({
        success: true,
        message: "Session created successfully",
        data: session
    });
});

// Retrieve session
app.get("/api/sessions/:sessionId", validateSessionId, (req, res) => {
    const session = getSession(req.params.sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            message: "Session not found"
        });
    }

    res.status(200).json({
        success: true,
        data: session
    });
});

// Receive telemetry events
app.post(
    "/api/sessions/:sessionId/telemetry",
    validateSessionId,
    (req, res) => {
        const { eventType, field, cognitiveLoadScore } = req.body || {};

        const allowedEvents = [
            "rage_click",
            "hesitation",
            "validation_error",
            "failed_interaction",
            "mouse_movement"
        ];

        if (!allowedEvents.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid telemetry event type"
            });
        }

        if (
            cognitiveLoadScore !== undefined &&
            (
                typeof cognitiveLoadScore !== "number" ||
                !Number.isFinite(cognitiveLoadScore) ||
                cognitiveLoadScore < 0 ||
                cognitiveLoadScore > 100
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Cognitive load score must be between 0 and 100"
            });
        }

        if (field !== undefined && typeof field !== "string") {
            return res.status(400).json({
                success: false,
                message: "Field must be a string"
            });
        }

        const session = getSession(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const event = addTelemetryEvent(
            req.params.sessionId,
            { eventType, field, cognitiveLoadScore }
        );

        const updatedSession = getSession(req.params.sessionId);
        const frictionStatus = evaluateFriction(updatedSession);

        updateGenerationTriggered(
            req.params.sessionId,
            updatedSession.generationTriggered
        );

        broadcastToSession(req.params.sessionId, {
            type: "telemetry_update",
            data: {
                event,
                cognitiveLoadScore: updatedSession.cognitiveLoadScore,
                friction: frictionStatus
            }
        });

        return res.status(201).json({
            success: true,
            message: "Telemetry event recorded successfully",
            data: {
                event,
                cognitiveLoadScore: updatedSession.cognitiveLoadScore,
                friction: frictionStatus
            }
        });
    }
);

// Telemetry summary
app.get(
    "/api/sessions/:sessionId/telemetry/summary",
    validateSessionId,
    (req, res) => {
        const session = getSession(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const events = session.interactionHistory;

        const summary = {
            totalEvents: events.length,
            rageClicks: events.filter(e => e.eventType === "rage_click").length,
            hesitations: events.filter(e => e.eventType === "hesitation").length,
            validationErrors: events.filter(e => e.eventType === "validation_error").length,
            cognitiveLoadScore: session.cognitiveLoadScore
        };

        res.status(200).json({
            success: true,
            message: "Telemetry summary retrieved successfully",
            data: summary
        });
    }
);

// Save or update form data
app.patch(
    "/api/sessions/:sessionId/form",
    validateSessionId,
    (req, res) => {
        const formData = req.body;
        const validationError = validateFormData(formData);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const updatedData = updateFormData(
            req.params.sessionId,
            formData
        );

        if (!updatedData) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Form data saved successfully",
            data: updatedData
        });
    }
);

// Retrieve form data
app.get(
    "/api/sessions/:sessionId/form",
    validateSessionId,
    (req, res) => {
        const session = getSession(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        res.status(200).json({
            success: true,
            data: session.formData
        });
    }
);

// Request AI generation
app.post(
    "/api/sessions/:sessionId/generate",
    validateSessionId,
    (req, res) => {
        const session = getSession(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        requestGeneration(req, res);
    }
);

// Retrieve generation status
app.get("/api/generations/:generationId", (req, res) => {
    const generation = getGeneration(req.params.generationId);

    if (!generation) {
        return res.status(404).json({
            success: false,
            message: "Generation not found"
        });
    }

    res.status(200).json({
        success: true,
        data: generation
    });
});

// Centralized error handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request payload is too large"
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    console.error("API Error:", err.message);

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// Start server
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);

    initializeWebSocket(server);

    server.listen(PORT, () => {
        console.log(`AuraGen server running on port ${PORT}`);
        console.log("WebSocket server is ready");
    });
}

module.exports = app;
