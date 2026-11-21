
process.env.DB_PATH = ":memory:";

const http = require("http");
const WebSocket = require("ws");
const request = require("supertest");

const app = require("../server");
const { createSession } = require("../sessionManager");
const { initializeWebSocket, broadcastToSession } =
    require("../websocketServer");

let server;
let wss;
let baseUrl;

const clients = new Set();

function connectClient(sessionId) {
    const socket = new WebSocket(
        `${baseUrl}?sessionId=${sessionId}`
    );

    clients.add(socket);

    return socket;
}

function waitForMessage(socket) {
    return new Promise((resolve, reject) => {
        socket.once("message", (data) => {
            resolve(JSON.parse(data.toString()));
        });

        socket.once("error", reject);
    });
}

beforeAll(async () => {
    server = http.createServer(app);
    wss = initializeWebSocket(server);

    await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
    });

    const port = server.address().port;
    baseUrl = `ws://127.0.0.1:${port}`;
});

afterEach(async () => {
    for (const socket of clients) {
        if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        ) {
            socket.terminate();
        }
    }

    clients.clear();
});

afterAll(async () => {
    for (const socket of wss.clients) {
        socket.terminate();
    }

    await new Promise((resolve) => {
        wss.close(() => resolve());
    });

    await new Promise((resolve) => {
        server.close(() => resolve());
    });
});

describe("AuraGen WebSocket Tests", () => {

    // Test 1: Valid connection
    test("should establish a WebSocket connection", async () => {
        const session = createSession();
        const socket = connectClient(session.sessionId);

        const messagePromise = waitForMessage(socket);

        await new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        });

        const message = await messagePromise;

        expect(message.type).toBe("connection_established");
        expect(message.sessionId).toBe(session.sessionId);
    });

    // Test 2: Initial session data
    test("should send initial cognitive load score", async () => {
        const session = createSession();
        const socket = connectClient(session.sessionId);

        const messagePromise = waitForMessage(socket);

        await new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        });

        const message = await messagePromise;

        expect(message.cognitiveLoadScore).toBe(0);
    });

    // Test 3: Invalid session rejection
    test("should reject an invalid session", async () => {
        const socket = connectClient("invalid-session");

        const messagePromise = waitForMessage(socket);

        await new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        });

        const message = await messagePromise;

        expect(message.type).toBe("error");
        expect(message.message).toBe("Invalid session");

        const closeCode = await new Promise((resolve) => {
            socket.once("close", (code) => resolve(code));
        });

        expect(closeCode).toBe(1008);
    });

    // Test 4: Real-time broadcasting
    test("should broadcast messages to a session client", async () => {
        const session = createSession();
        const socket = connectClient(session.sessionId);

        const initialMessage = waitForMessage(socket);

        await new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        });

        await initialMessage;

        const updatePromise = waitForMessage(socket);

        broadcastToSession(session.sessionId, {
            type: "telemetry_update",
            data: {
                cognitiveLoadScore: 85
            }
        });

        const update = await updatePromise;

        expect(update.type).toBe("telemetry_update");
        expect(update.data.cognitiveLoadScore).toBe(85);
    });

    // Test 5: Disconnection handling
    test("should handle client disconnection", async () => {
        const session = createSession();
        const socket = connectClient(session.sessionId);

        const messagePromise = waitForMessage(socket);

        await new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        });

        await messagePromise;

        const closed = new Promise((resolve) => {
            socket.once("close", resolve);
        });

        socket.close();

        await closed;

        expect(socket.readyState).toBe(WebSocket.CLOSED);

        expect(() => {
            broadcastToSession(session.sessionId, {
                type: "telemetry_update"
            });
        }).not.toThrow();
    });

});
