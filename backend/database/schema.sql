-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- 1. Schedules
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    day TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    room TEXT NOT NULL,
    instructor TEXT NOT NULL
);

-- 2. Rooms & Bookings
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT NOT NULL UNIQUE,
    building TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    features TEXT -- Stored as comma-separated values or JSON array string
);

CREATE TABLE IF NOT EXISTS room_bookings (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    booked_by TEXT NOT NULL,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    time_slot TEXT NOT NULL,
    purpose TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 3. Events & Registrations
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    registered_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id) -- Prevents duplicate registrations at DB level
);

-- 4. Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date_posted TEXT NOT NULL, -- Format: YYYY-MM-DD
    category TEXT NOT NULL
);

-- 5. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    description TEXT,
    status TEXT DEFAULT 'Pending' -- Pending, Submitted, Overdue
);

-- Indexes for performance (crucial for live AI agent queries)
CREATE INDEX IF NOT EXISTS idx_room_bookings_lookup ON room_bookings(room_id, date, time_slot);
CREATE INDEX IF NOT EXISTS idx_event_regs_lookup ON event_registrations(event_id, user_id);