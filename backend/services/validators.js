const db = require('../database/db');

/**
 * Validates room booking availability.
 * Checks if the specified room exists and ensures no overlap for room_id + date + time_slot.
 */
function validateRoomBooking(roomId, date, timeSlot) {
  // 1. Check if the room exists
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return { valid: false, status: 404, error: 'Room not found.' };
  }

  // 2. Check for double booking / overlapping time slot
  const existingBooking = db
    .prepare(
      'SELECT * FROM room_bookings WHERE room_id = ? AND date = ? AND time_slot = ?'
    )
    .get(roomId, date, timeSlot);

  if (existingBooking) {
    return {
      valid: false,
      status: 409,
      error: `Room ${room.room_number} is already booked for ${timeSlot} on ${date}.`
    };
  }

  return { valid: true, room };
}

/**
 * Validates event registration constraints.
 * Ensures event exists, capacity isn't exceeded, and user isn't already registered.
 */
function validateEventRegistration(eventId, userId) {
  // 1. Check if event exists
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) {
    return { valid: false, status: 404, error: 'Event not found.' };
  }

  // 2. Check for duplicate registration
  const existingRegistration = db
    .prepare(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?'
    )
    .get(eventId, userId);

  if (existingRegistration) {
    return {
      valid: false,
      status: 409,
      error: `User '${userId}' is already registered for this event.`
    };
  }

  // 3. Check event capacity limits
  if (event.registered_count >= event.capacity) {
    return {
      valid: false,
      status: 400,
      error: `Event '${event.title}' has reached maximum capacity (${event.capacity}).`
    };
  }

  return { valid: true, event };
}

module.exports = {
  validateRoomBooking,
  validateEventRegistration
};