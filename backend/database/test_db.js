const db = require('./db');

// Query sqlite_master to verify tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log('Tables initialized in database:', tables.map(t => t.name));