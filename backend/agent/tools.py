import json
from typing import Optional, List
from langchain_core.tools import tool
from pydantic.v1 import BaseModel, Field
from database import execute_query, execute_write

@tool
def get_schedules(day: Optional[str] = None, course: Optional[str] = None):
    """Fetch class schedules. Optionally filter by day (e.g. 'Sunday') or course code (e.g. 'CSE 4113')."""
    query = "SELECT * FROM schedules WHERE 1=1"
    params = []
    if day:
        query += " AND LOWER(day) = LOWER(?)"
        params.append(day)
    if course:
        query += " AND LOWER(course) LIKE LOWER(?)"
        params.append(f"%{course}%")
    return execute_query(query, tuple(params))

@tool
def get_assignments(course: Optional[str] = None, status: Optional[str] = None):
    """Fetch assignments and deadlines. Optionally filter by course code or status ('pending', 'submitted')."""
    query = "SELECT * FROM assignments WHERE 1=1"
    params = []
    if course:
        query += " AND LOWER(course) LIKE LOWER(?)"
        params.append(f"%{course}%")
    if status:
        query += " AND LOWER(status) = LOWER(?)"
        params.append(status)
    return execute_query(query, tuple(params))

@tool
def get_announcements(priority: Optional[str] = None):
    """Fetch announcements posted on the campus board."""
    query = "SELECT * FROM announcements WHERE 1=1"
    params = []
    if priority:
        query += " AND LOWER(priority) = LOWER(?)"
        params.append(priority)
    query += " ORDER BY date DESC"
    return execute_query(query, tuple(params))

@tool
def get_rooms(min_capacity: Optional[int] = None, equipment_needed: Optional[str] = None):
    """Fetch campus rooms. Can filter by minimum capacity or specific equipment required (e.g. 'projector', 'AC')."""
    query = "SELECT * FROM rooms WHERE status = 'available'"
    params = []
    if min_capacity:
        query += " AND capacity >= ?"
        params.append(min_capacity)
    
    rooms = execute_query(query, tuple(params))
    
    if equipment_needed:
        filtered = []
        for room in rooms:
            eq = room.get("equipment", "")
            if equipment_needed.lower() in str(eq).lower():
                filtered.append(room)
        return filtered
    return rooms

class BookRoomInput(BaseModel):
    room_number: str = Field(description="Room code e.g. '7A03'")
    booked_by: str = Field(description="Name or ID of person booking")
    date: str = Field(description="Date in YYYY-MM-DD format")
    start_time: str = Field(description="24h start time HH:MM")
    end_time: str = Field(description="24h end time HH:MM")
    purpose: str = Field(description="Reason for booking")

@tool("book_room", args_schema=BookRoomInput)
def book_room(room_number: str, booked_by: str, date: str, start_time: str, end_time: str, purpose: str):
    """Book a specific room for a given date and time range."""
    # Check room exists
    rooms = execute_query("SELECT * FROM rooms WHERE room_number = ?", (room_number,))
    if not rooms:
        return f"Error: Room {room_number} does not exist."
    
    # Check booking overlap
    existing = execute_query(
        "SELECT * FROM bookings WHERE room_number = ? AND date = ? AND ((start_time < ? AND end_time > ?))",
        (room_number, date, end_time, start_time)
    )
    if existing:
        return f"Error: Room {room_number} is already booked on {date} during {start_time}-{end_time}."

    # Perform insertion into bookings table
    try:
        execute_write(
            "INSERT INTO bookings (room_number, booked_by, date, start_time, end_time, purpose) VALUES (?, ?, ?, ?, ?, ?)",
            (room_number, booked_by, date, start_time, end_time, purpose)
        )
        return f"Success: Room {room_number} booked for {booked_by} on {date} from {start_time} to {end_time}."
    except Exception as e:
        return f"Error executing booking: {str(e)}"

@tool
def get_events(date: Optional[str] = None):
    """Fetch upcoming or ongoing campus events."""
    query = "SELECT * FROM events WHERE status != 'cancelled'"
    params = []
    if date:
        query += " AND date = ?"
        params.append(date)
    return execute_query(query, tuple(params))

@tool
def register_for_event(event_id: str, student_id: str, student_name: str):
    """Register a student for a specific campus event."""
    events = execute_query("SELECT * FROM events WHERE id = ?", (event_id,))
    if not events:
        return f"Error: Event {event_id} not found."
    
    event = events[0]
    if event["registered"] >= event["capacity"]:
        return f"Error: Event '{event['name']}' is full."

    try:
        execute_write(
            "INSERT INTO event_registrations (event_id, student_id, name) VALUES (?, ?, ?)",
            (event_id, student_id, student_name)
        )
        execute_write(
            "UPDATE events SET registered = registered + 1 WHERE id = ?",
            (event_id,)
        )
        return f"Success: Registered {student_name} ({student_id}) for '{event['name']}'."
    except Exception as e:
        return f"Error registering for event: {str(e)}"

ALL_TOOLS = [
    get_schedules, 
    get_assignments, 
    get_announcements, 
    get_rooms, 
    book_room, 
    get_events, 
    register_for_event
]