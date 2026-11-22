
process.env.DB_PATH = ":memory:";

const request = require("supertest");
const app = require("../server");
const { updateGeneration } = require("../generationManager");

describe("AuraGen Backend API Tests", () => {

    async function createTestSession() {
        const response = await request(app).post("/api/sessions");

        expect(response.statusCode).toBe(201);

        return response.body.data.sessionId;
    }

    // Test 1: Health check
    test("GET /api/health should return healthy status", async () => {
        const response = await request(app).get("/api/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe("Healthy");
    });

    // Test 2: Create session
    test("POST /api/sessions should create a session", async () => {
        const response = await request(app).post("/api/sessions");

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sessionId).toBeDefined();
    });

    // Test 3: Retrieve session
    test("GET session should retrieve an existing session", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .get(`/api/sessions/${sessionId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.sessionId).toBe(sessionId);
    });

    // Test 4: Reject malformed UUID
    test("GET session should reject malformed session IDs", async () => {
        const response = await request(app)
            .get("/api/sessions/invalid-session-id");

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 5: Nonexistent valid UUID
    test("GET session should return 404 for nonexistent UUID", async () => {
        const response = await request(app)
            .get("/api/sessions/123e4567-e89b-42d3-a456-426614174000");

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    // Test 6: Save and retrieve form data
    test("PATCH and GET form APIs should save and retrieve form data", async () => {
        const sessionId = await createTestSession();

        const saveResponse = await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send({
                name: "Test User",
                occupation: "Student"
            });

        expect(saveResponse.statusCode).toBe(200);
        expect(saveResponse.body.data.name).toBe("Test User");

        const getResponse = await request(app)
            .get(`/api/sessions/${sessionId}/form`);

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body.data.occupation).toBe("Student");
    });

    // Test 7: Reject empty form data
    test("PATCH form should reject empty form data", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 8: Reject invalid telemetry
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

    // Test 9: Record valid telemetry
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

    // Test 10: Telemetry summary
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

    // Test 11: Reject malformed telemetry session ID
    test("POST telemetry should reject malformed session IDs", async () => {
        const response = await request(app)
            .post("/api/sessions/invalid-id/telemetry")
            .send({
                eventType: "rage_click",
                cognitiveLoadScore: 50
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 12: Create AI generation request
    test("POST generate should create a pending generation", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        expect(response.statusCode).toBe(202);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("pending");
        expect(response.body.data.generationId).toBeDefined();
    });

    // Test 13: Prevent duplicate generation
    test("POST generate should reject duplicate requests", async () => {
        const sessionId = await createTestSession();

        const firstResponse = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        const secondResponse = await request(app)
            .post(`/api/sessions/${sessionId}/generate`);

        expect(firstResponse.statusCode).toBe(202);
        expect(secondResponse.statusCode).toBe(409);
    });

    // Test 14: Retrieve generation status
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

    // Test 15: Update generation status
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

    // Test 16: Reject malformed JSON
    test("API should reject malformed JSON", async () => {
        const response = await request(app)
            .post("/api/sessions")
            .set("Content-Type", "application/json")
            .send('{"name":');

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Invalid JSON request body");
    });

    // Test 17: Reject oversized payload
    test("API should reject payloads larger than 100KB", async () => {
        const response = await request(app)
            .post("/api/sessions")
            .send({
                data: "x".repeat(110 * 1024)
            });

        expect(response.statusCode).toBe(413);
        expect(response.body.message).toBe("Request payload is too large");
    });

    // Test 18: Reject nested form data
    test("PATCH form should reject nested objects", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send({
                name: "Test User",
                details: {
                    income: 50000
                }
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 19: Reject excessively long form values
    test("PATCH form should reject values longer than 5000 characters", async () => {
        const sessionId = await createTestSession();

        const response = await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send({
                name: "x".repeat(5001)
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 20: Preserve previously saved form fields
    test("PATCH form should preserve previously saved fields", async () => {
        const sessionId = await createTestSession();

        await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send({
                name: "Sathvik",
                occupation: "Student"
            });

        const response = await request(app)
            .patch(`/api/sessions/${sessionId}/form`)
            .send({
                occupation: "Developer"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe("Sathvik");
        expect(response.body.data.occupation).toBe("Developer");
    });

});
