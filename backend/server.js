
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
    getGeneration,
    updateGeneration
} = require("./generationManager");

const { requestGeneration } = require("./generationController");

const { evaluateFriction } = require("./frictionMonitor");

const {
    createSession,
    getSession,
    addTelemetryEvent,
    updateFormData
} = require("./sessionManager");

const app = express();

app.use(cors());
app.use(express.json());

// Health Check API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AuraGen Backend is running!",
        status: "Healthy"
    });
});

// Create a new user session
app.post("/api/sessions", (req, res) => {
    const session = createSession();

    res.status(201).json({
        success: true,
        message: "Session created successfully",
        data: session
    });
});

// Get an existing user session
app.get("/api/sessions/:sessionId", (req, res) => {
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

// Receive user telemetry events
app.post("/api/sessions/:sessionId/telemetry", (req, res) => {

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

    const frictionStatus = evaluateFriction(session);

    res.status(201).json({
        success: true,
        message: "Telemetry event recorded successfully",
        data: {
            event,
            cognitiveLoadScore: session.cognitiveLoadScore,
            friction: frictionStatus
        }
    });
});

// Get telemetry summary for a user session
app.get("/api/sessions/:sessionId/telemetry/summary", (req, res) => {

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
});


// Save or update user form data
app.patch("/api/sessions/:sessionId/form", (req, res) => {
    const formData = req.body;

    if (
        !formData ||
        typeof formData !== "object" ||
        Array.isArray(formData) ||
        Object.keys(formData).length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid form data is required"
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
});

// Retrieve saved user form data
app.get("/api/sessions/:sessionId/form", (req, res) => {
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
});

// Request AI generation
app.post("/api/sessions/:sessionId/generate", (req, res, next) => {
    const session = getSession(req.params.sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            message: "Session not found"
        });
    }

    requestGeneration(req, res);
});

// Get generation status
app.get("/api/generations/:generationId", (req, res) => {
    const generation = getGeneration(req.params.generationId);

    if (!generation) {
        return res.status(404).json({
            success: false,
            message: "Generation not found"
        });
    }

    res.json({
        success: true,
        data: generation
    });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`AuraGen server running on port ${PORT}`);
});
