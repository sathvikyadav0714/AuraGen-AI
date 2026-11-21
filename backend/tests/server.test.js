
process.env.DB_PATH = ":memory:";

const request = require("supertest");
const app = require("../server");
const { updateGeneration } = require("../generationManager");

describe("AuraGen Backend API Tests", () => {

    // Test 1: Health check
    test("GET /api/health should return healthy status", async () => {
        const response = await request(app).get("/api/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe("Healthy");
    });

    // Helper: Create a test session
    async function createTestSession() {
        const response = await request(app).post("/api/sessions");

        expect(response.statusCode).toBe(201);

        return response.body.data.sessionId;
    }

    // Test 2: Create session
    test("POST /api/sessions should create a session", async () => {
        const response = await request(app).post("/api/sessions");

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sessionId).toBeDefined();
    });

    // Test 3: Retrieve session
    test("GET /api/sessions/:sessionId should retrieve a session", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .get(`/api/sessions/${sessionId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.sessionId).toBe(sessionId);
    });

    // Test 4: Invalid session
    test("GET /api/sessions/:sessionId should return 404 for invalid session", async () => {
        const response = await request(app)
            .get("/api/sessions/invalid-session-id");

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    // Test 5: Save and retrieve form data
    test("PATCH and GET form APIs should save and retrieve form data", async () => {
        const sessionId = await createTestSession();

        const formData = {
            name: "Test User",
            occupation: "Student"
        };

        const saveResponse = await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send(formData);

        expect(saveResponse.statusCode).toBe(200);
        expect(saveResponse.body.data.name).toBe("Test User");

        const getResponse = await request(app)
            .get(`/api/sessions/${sessionId}/form`);

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body.data.occupation).toBe("Student");
    });

    // Test 6: Reject invalid telemetry
    test("POST telemetry should reject invalid event types", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .post(`/api/sessions/${sessionId}/telemetry`)
            .send({
                eventType: "invalid_event",
                cognitiveLoadScore: 50
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 7: Record valid telemetry
    test("POST telemetry should record valid events", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .post(`/api/sessions/${sessionId}/telemetry`)
            .send({
                eventType: "rage_click",
                field: "annualIncome",
                cognitiveLoadScore: 85
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.cognitiveLoadScore).toBe(85);
    });

    // Test 8: Retrieve telemetry summary
    test("GET telemetry summary should return event counts", async () => {
        const sessionId = await createTestSession();

        await request(app)
            .post(`/api/sessions/${sessionId}/telemetry`)
            .send({
                eventType: "rage_click",
                cognitiveLoadScore: 85
            });

        const response = await request(app)
            .get(`/api/sessions/${sessionId}/telemetry/summary`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.totalEvents).toBe(1);
        expect(response.body.data.rageClicks).toBe(1);
    });

    // Test 9: Create AI generation request
    test("POST generate should create a pending generation", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        expect(response.statusCode).toBe(202);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("pending");
        expect(response.body.data.generationId).toBeDefined();
    });

    // Test 10: Prevent duplicate generation
    test("POST generate should reject duplicate requests", async () => {
        const sessionId = await createTestSession();

        const firstResponse = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        const secondResponse = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        expect(firstResponse.statusCode).toBe(202);
        expect(secondResponse.statusCode).toBe(409);
        expect(secondResponse.body.message).toBe(
            "Generation already in progress"
        );
    });

    // Test 11: Retrieve generation status
    test("GET generation should return its status", async () => {
        const sessionId = await createTestSession();

        const createResponse = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        const generationId = createResponse.body.data.generationId;

        const response = await request(app)
            .get(`/api/generations/${generationId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.status).toBe("pending");
    });

    // Test 12: Update generation status
    test("Generation manager should handle completed and failed states", async () => {
        const sessionId1 = await createTestSession();
        const sessionId2 = await createTestSession();

        const first = await request(app)
            .post(`/api/sessions/${sessionId1}/generate`);

        const second = await request(app)
            .post(`/api/sessions/${sessionId2}/generate`);

        const completed = updateGeneration(
            first.body.data.generationId,
            "completed"
        );

        const failed = updateGeneration(
            second.body.data.generationId,
            "failed",
            "Test generation error"
        );

        expect(completed.status).toBe("completed");
        expect(completed.completedAt).not.toBeNull();

        expect(failed.status).toBe("failed");
        expect(failed.error).toBe("Test generation error");
        expect(failed.completedAt).not.toBeNull();
    });

});
