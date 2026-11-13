
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createSession, getSession } = require("./sessionManager");

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


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`AuraGen server running on port ${PORT}`);
});
