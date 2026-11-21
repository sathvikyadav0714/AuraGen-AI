
const { WebSocketServer } = require("ws");
const { getSession } = require("./sessionManager");

const clients = new Map();

function initializeWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (socket, request) => {
        const url = new URL(request.url, "http://localhost");
        const sessionId = url.searchParams.get("sessionId");

        const session = getSession(sessionId);

        if (!session) {
            socket.send(JSON.stringify({
                type: "error",
                message: "Invalid session"
            }));

            socket.close(1008, "Invalid session");
            return;
        }

        if (!clients.has(sessionId)) {
            clients.set(sessionId, new Set());
        }

        clients.get(sessionId).add(socket);

        socket.send(JSON.stringify({
            type: "connection_established",
            sessionId,
            cognitiveLoadScore: session.cognitiveLoadScore
        }));

        socket.on("close", () => {
            const sessionClients = clients.get(sessionId);

            if (sessionClients) {
                sessionClients.delete(socket);

                if (sessionClients.size === 0) {
                    clients.delete(sessionId);
                }
            }
        });

        socket.on("error", (error) => {
            console.error("WebSocket error:", error.message);
        });
    });

    return wss;
}

function broadcastToSession(sessionId, message) {
    const sessionClients = clients.get(sessionId);

    if (!sessionClients) return;

    const payload = JSON.stringify(message);

    for (const client of sessionClients) {
        if (client.readyState === 1) {
            client.send(payload);
        }
    }
}

module.exports = {
    initializeWebSocket,
    broadcastToSession
};
