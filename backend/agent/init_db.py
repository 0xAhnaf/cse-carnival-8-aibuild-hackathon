import os
import json
import sqlite3

DB_PATH = "../database/campusos.db"
DATA_DIR = "../../data"

# Ensure target database folder exists
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Schedules
cursor.execute("""
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    course TEXT,
    title TEXT,
    day TEXT,
    start_time TEXT,
    end_time TEXT,
    room TEXT,
    instructor TEXT,
    section TEXT
)
""")
with open(f"{DATA_DIR}/schedules.json") as f:
    for item in json.load(f):
        cursor.execute("INSERT OR REPLACE INTO schedules VALUES (?,?,?,?,?,?,?,?,?)",
                       (item['id'], item['course'], item['title'], item['day'], 
                        item['start_time'], item['end_time'], item['room'], 
                        item['instructor'], item['section']))

# 2. Rooms & Bookings
cursor.execute("""
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT,
    type TEXT,
    capacity INTEGER,
    equipment TEXT,
    floor INTEGER,
    status TEXT
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT,
    room_number TEXT,
    booked_by TEXT,
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    purpose TEXT
)
""")
with open(f"{DATA_DIR}/rooms.json") as f:
    for item in json.load(f):
        equipment_str = ", ".join(item.get("equipment", []))
        cursor.execute("INSERT OR REPLACE INTO rooms VALUES (?,?,?,?,?,?,?)",
                       (item['id'], item['room_number'], item['type'], item['capacity'], 
                        equipment_str, item['floor'], item['status']))
        for bk in item.get("bookings", []):
            cursor.execute("""
            INSERT INTO bookings (booking_id, room_number, booked_by, date, start_time, end_time, purpose)
            VALUES (?,?,?,?,?,?,?)""",
            (bk['booking_id'], item['room_number'], bk['booked_by'], bk['date'], bk['start_time'], bk['end_time'], bk['purpose']))

# 3. Events & Registrations
cursor.execute("""
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    end_date TEXT,
    venue TEXT,
    organizer TEXT,
    capacity INTEGER,
    registered INTEGER,
    status TEXT
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT,
    student_id TEXT,
    name TEXT
)
""")
with open(f"{DATA_DIR}/events.json") as f:
    for item in json.load(f):
        cursor.execute("INSERT OR REPLACE INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                       (item['id'], item['name'], item['description'], item['date'], 
                        item['start_time'], item['end_time'], item['end_date'], item['venue'], 
                        item['organizer'], item['capacity'], item['registered'], item['status']))

# 4. Announcements
cursor.execute("""
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT,
    body TEXT,
    date TEXT,
    priority TEXT,
    posted_by TEXT,
    expires TEXT
)
""")
with open(f"{DATA_DIR}/announcements.json") as f:
    for item in json.load(f):
        cursor.execute("INSERT OR REPLACE INTO announcements VALUES (?,?,?,?,?,?,?)",
                       (item['id'], item['title'], item['body'], item['date'], 
                        item['priority'], item['posted_by'], item['expires']))

# 5. Assignments
cursor.execute("""
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    course TEXT,
    course_title TEXT,
    title TEXT,
    description TEXT,
    assigned_date TEXT,
    deadline TEXT,
    submission_platform TEXT,
    status TEXT,
    marks INTEGER
)
""")
with open(f"{DATA_DIR}/assignments.json") as f:
    for item in json.load(f):
        cursor.execute("INSERT OR REPLACE INTO assignments VALUES (?,?,?,?,?,?,?,?,?,?)",
                       (item['id'], item['course'], item['course_title'], item['title'], 
                        item['description'], item['assigned_date'], item['deadline'], 
                        item['submission_platform'], item['status'], item['marks']))

conn.commit()
conn.close()
print("Database successfully seeded at backend/database/campusos.db")