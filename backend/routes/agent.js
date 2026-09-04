const express = require('express');
const router = express.Router();
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

router.post('/chat', async (req, res) => {
  const { message, context = {} } = req.body;
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message text is required.' });
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: payload.detail || payload.error || 'AI agent request failed.' });
    return res.json(payload);
  } catch {
    return res.status(503).json({ error: 'Agent service is unreachable. Start the Python service on port 8001.' });
  }
});
module.exports = router;
