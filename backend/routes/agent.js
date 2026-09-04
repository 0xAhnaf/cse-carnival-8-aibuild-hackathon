const express = require("express");
const router = express.Router();

// Fetch Python service URL from environment or default to local port 8001
const AGENT_SERVICE_URL =
  process.env.AGENT_SERVICE_URL || "http://localhost:8001";

/**
 * POST /api/agent/chat
 * Proxies user messages from Frontend -> Express -> Python Agent Service
 */
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message text is required." });
    }

    // Forward request to the Python FastAPI microservice
    const response = await fetch(`${AGENT_SERVICE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.detail || "Failed to reach AI Agent microservice.",
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Error proxying to AI Agent:", error.message);
    return res.status(500).json({
      error:
        "Agent service is currently unreachable. Make sure python main.py is running on port 8001.",
    });
  }
});

module.exports = router;
