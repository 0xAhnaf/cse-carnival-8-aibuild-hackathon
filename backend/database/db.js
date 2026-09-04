const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 1. Establish SQLite DB instance
const dbPath = path.join(__dirname, 'campusos.db');
const db = new Database(dbPath);

// 2. Enable Write-Ahead Logging (WAL) for faster concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 3. Initialize schema on boot
function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Execute the schema batch
  db.exec(schemaSql);
}

// Run schema setup
initDatabase();

module.exports = db;