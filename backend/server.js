require('dotenv').config();
const express = require('express');
const cors = require('cors');
const store = require('./database/store');

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (req, res) => res.json({ status: 'ok', storage: 'persistent-json', timestamp: new Date().toISOString() }));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/events', require('./routes/events'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/agent', require('./routes/agent'));
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.listen(PORT, () => {
  console.log(`CampusOS backend: http://localhost:${PORT}`);
  console.log(`Persistent store: ${store.STORE_PATH}`);
});
