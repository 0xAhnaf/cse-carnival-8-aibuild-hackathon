import os
import re
from datetime import datetime
from typing import Optional

import requests
from langchain_core.tools import tool
from pydantic import BaseModel, Field

API_BASE_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000/api").rstrip("/")


def normalize_search_text(value: str):
    words = re.findall(r"[a-z0-9]+", value.lower())
    ignored = {"a", "an", "and", "for", "in", "of", "on", "the", "to"}
    return " ".join(word for word in words if word not in ignored)


def find_event_matches(events, event_name_or_id: str):
    query = event_name_or_id.strip().lower()
    exact_id = [event for event in events if event["id"].lower() == query]
    if exact_id:
        return exact_id
    normalized_query = normalize_search_text(event_name_or_id)
    if not normalized_query:
        return []
    return [
        event for event in events
        if normalized_query in normalize_search_text(event["name"])
        or normalize_search_text(event["name"]) in normalized_query
    ]


def api_request(method: str, path: str, payload=None):
    response = requests.request(method, f"{API_BASE_URL}{path}", json=payload, timeout=10)
    try:
        data = response.json()
    except ValueError:
        data = {"error": response.text or "Invalid backend response."}
    if not response.ok:
        raise RuntimeError(data.get("error") or data.get("message") or "Backend request failed.")
    return data


@tool
def get_current_datetime():
    """Get the current local day, date, and time for today, tomorrow, and next-class questions."""
    now = datetime.now().astimezone()
    return {"weekday": now.strftime("%A"), "date": now.strftime("%Y-%m-%d"), "time": now.strftime("%H:%M"), "timezone": str(now.tzinfo)}


@tool
def get_schedules(day: Optional[str] = None, course: Optional[str] = None):
    """Read live class schedules, optionally filtered by weekday and course code/title."""
    records = api_request("GET", "/schedules")
    if day:
        records = [item for item in records if item["day"].lower() == day.lower()]
    if course:
        query = course.lower()
        records = [item for item in records if query in item["course"].lower() or query in item["title"].lower()]
    return records


@tool
def get_assignments(course: Optional[str] = None, status: Optional[str] = None, due_from: Optional[str] = None, due_to: Optional[str] = None):
    """Read live assignments. Date filters are inclusive and use YYYY-MM-DD."""
    records = api_request("GET", "/assignments")
    if course:
        records = [item for item in records if course.lower() in item["course"].lower()]
    if status:
        records = [item for item in records if item["status"].lower() == status.lower()]
    if due_from:
        records = [item for item in records if item["deadline"] >= due_from]
    if due_to:
        records = [item for item in records if item["deadline"] <= due_to]
    return records


@tool
def get_announcements(priority: Optional[str] = None, active_on: Optional[str] = None):
    """Read live announcements, optionally filtering priority and notices active on a YYYY-MM-DD date."""
    records = api_request("GET", "/announcements")
    if priority:
        records = [item for item in records if item["priority"].lower() == priority.lower()]
    if active_on:
        records = [item for item in records if item["date"] <= active_on <= item["expires"]]
    return records


@tool
def get_rooms(min_capacity: Optional[int] = None, equipment_needed: Optional[str] = None, date: Optional[str] = None, start_time: Optional[str] = None, end_time: Optional[str] = None):
    """Find live rooms by capacity/equipment and optionally verify a complete date/time window."""
    rooms = [room for room in api_request("GET", "/rooms") if room["status"] == "available"]
    if min_capacity is not None:
        rooms = [room for room in rooms if int(room["capacity"]) >= min_capacity]
    if equipment_needed:
        needed = equipment_needed.lower()
        rooms = [room for room in rooms if any(needed in item.lower() for item in room["equipment"])]
    if date and start_time and end_time:
        rooms = [room for room in rooms if not any(
            booking["date"] == date and booking["start_time"] < end_time and booking["end_time"] > start_time
            for booking in room.get("bookings", [])
        )]
    return rooms


class BookRoomInput(BaseModel):
    room_number: str = Field(description="Exact room code, for example 7A02")
    booked_by: str = Field(description="Student/person/organization name or ID")
    date: str = Field(description="Booking date in YYYY-MM-DD")
    start_time: str = Field(description="Start time in HH:MM")
    end_time: str = Field(description="End time in HH:MM")
    purpose: str = Field(description="Reason for booking")


@tool("book_room", args_schema=BookRoomInput)
def book_room(room_number: str, booked_by: str, date: str, start_time: str, end_time: str, purpose: str):
    """Book an exact room after the user supplies all required details."""
    rooms = api_request("GET", "/rooms")
    room = next((item for item in rooms if item["room_number"].lower() == room_number.lower()), None)
    if not room:
        return {"success": False, "error": f"Room {room_number} does not exist."}
    booking = api_request("POST", f"/rooms/{room['id']}/bookings", {
        "booked_by": booked_by, "date": date, "start_time": start_time,
        "end_time": end_time, "purpose": purpose,
    })
    return {"success": True, "room": room_number, "booking": booking}


@tool
def cancel_room_booking(room_number: str, booking_id: str):
    """Cancel a room booking using an exact room number and booking ID."""
    rooms = api_request("GET", "/rooms")
    room = next((item for item in rooms if item["room_number"].lower() == room_number.lower()), None)
    if not room:
        return {"success": False, "error": f"Room {room_number} does not exist."}
    api_request("DELETE", f"/rooms/{room['id']}/bookings/{booking_id}")
    return {"success": True, "message": f"Booking {booking_id} was cancelled."}


@tool
def get_events(date: Optional[str] = None, status: Optional[str] = None, name: Optional[str] = None):
    """Read live campus events, optionally filtered by date, status, or a flexible partial name."""
    records = api_request("GET", "/events")
    if date:
        records = [item for item in records if item["date"] <= date <= item["end_date"]]
    if status:
        records = [item for item in records if item["status"].lower() == status.lower()]
    if name:
        records = find_event_matches(records, name)
    return records


@tool
def register_for_event(event_name_or_id: str, student_id: str, student_name: str):
    """Register a student for one uniquely matched event after identity and event are confirmed. Partial names are accepted."""
    events = api_request("GET", "/events")
    matches = find_event_matches(events, event_name_or_id)
    if len(matches) != 1:
        return {"success": False, "error": "Event was not uniquely identified.", "matches": [{"id": item["id"], "name": item["name"]} for item in matches]}
    event = matches[0]
    registration = api_request("POST", f"/events/{event['id']}/registrations", {"student_id": student_id, "name": student_name})
    return {"success": True, "event": event["name"], "registration": registration}


@tool
def cancel_event_registration(event_name_or_id: str, student_id: str):
    """Cancel a student's registration for one uniquely matched event. Partial names are accepted."""
    events = api_request("GET", "/events")
    matches = find_event_matches(events, event_name_or_id)
    if len(matches) != 1:
        return {"success": False, "error": "Event was not uniquely identified."}
    event = matches[0]
    api_request("DELETE", f"/events/{event['id']}/registrations/{student_id}")
    return {"success": True, "message": f"Registration for {event['name']} was cancelled."}


ALL_TOOLS = [get_current_datetime, get_schedules, get_assignments, get_announcements, get_rooms, book_room, cancel_room_booking, get_events, register_for_event, cancel_event_registration]
