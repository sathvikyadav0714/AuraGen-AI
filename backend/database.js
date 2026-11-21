
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "auragen.db");
const db = new DatabaseSync(dbPath);

// Create sessions table if it does not exist
db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        form_data TEXT NOT NULL DEFAULT '{}',
        cognitive_load_score REAL NOT NULL DEFAULT 0,
        interaction_history TEXT NOT NULL DEFAULT '[]',
        generation_triggered INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )
`);

module.exports = db;
