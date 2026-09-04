# CampusOS

CampusOS is a student-focused campus data manager and tool-enabled AI assistant. It keeps schedules, rooms, events, announcements, and assignments in one persistent backend, and lets the AI read and act on the latest state.

## Features

- Full add, edit, and delete support for all five campus resources
- Room booking/cancellation with overlap validation
- Event registration/cancellation with duplicate and capacity validation
- Persistent backend seeded from the official JSON files on first run
- AI tool calling for live lookups, availability checks, bookings, and registrations
- Responsive React interface

## Requirements

- Node.js 18+
- Python 3.10+
- An OpenRouter API key and a tool-capable model

## Setup

### 1. Backend API

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:3000`. On first start it creates `backend/database/campusos-store.json` from the official files in `data/`.

### 2. AI agent

Create `backend/agent/.env`:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=inclusionai/ling-3.0-flash-fin:free
BACKEND_API_URL=http://localhost:3000/api
AGENT_PORT=8001
```

Then run:

```bash
cd backend/agent
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

The agent service runs at `http://localhost:8001`. The Express API proxies `/api/agent/chat` to it.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Health checks

- Backend: `http://localhost:3000/health`
- Agent: `http://localhost:8001/health`
- Sample data: `http://localhost:3000/api/schedules`

## Architecture

```text
React frontend -> Express API -> persistent JSON store
                         |
                         +-> Python AI agent -> Express API tools
```

Both the dashboard and AI agent use the same Express API, so changes made through CRUD operations become immediately available to the agent.

## API

- `/api/schedules`
- `/api/rooms`
- `/api/events`
- `/api/announcements`
- `/api/assignments`
- `/api/agent/chat`

Resource endpoints support `GET`, `POST`, `PUT /:id`, and `DELETE /:id`. Rooms also support booking routes, and events support registration routes.

## Demo queries

- When is my next class?
- What assignments do I have due this week?
- Which labs have a projector and fit at least 30 people?
- Book Room 7A02 tomorrow from 3 PM to 5 PM.
- Register me for Guest Lecture: Deep Learning in Medical Imaging.

See `PROBLEM_STATEMENT.md`, `schema/schema.md`, and `sample_queries/sample_queries.md` for the official challenge details.
