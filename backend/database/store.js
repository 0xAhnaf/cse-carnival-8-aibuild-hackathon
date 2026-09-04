const fs = require('fs');
const path = require('path');

const RESOURCE_NAMES = ['schedules', 'rooms', 'events', 'announcements', 'assignments'];
const REQUIRED_FIELDS = {
  schedules: ['course', 'title', 'day', 'start_time', 'end_time', 'room', 'instructor', 'section'],
  rooms: ['room_number', 'type', 'capacity', 'equipment', 'floor', 'status'],
  events: ['name', 'description', 'date', 'start_time', 'end_time', 'end_date', 'venue', 'organizer', 'capacity', 'status'],
  announcements: ['title', 'body', 'date', 'priority', 'posted_by', 'expires'],
  assignments: ['course', 'course_title', 'title', 'description', 'assigned_date', 'deadline', 'submission_platform', 'status', 'marks']
};
const ID_PREFIXES = { schedules: 'sch', rooms: 'room', events: 'evt', announcements: 'ann', assignments: 'asgn' };
const STORE_PATH = process.env.DATA_STORE_PATH
  ? path.resolve(process.cwd(), process.env.DATA_STORE_PATH)
  : path.join(__dirname, 'campusos-store.json');
const SEED_DIRECTORY = path.join(__dirname, '..', '..', 'data');

const clone = (value) => JSON.parse(JSON.stringify(value));
function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}
function loadSeedData() {
  return Object.fromEntries(RESOURCE_NAMES.map((resource) => {
    const records = JSON.parse(fs.readFileSync(path.join(SEED_DIRECTORY, `${resource}.json`), 'utf8'));
    return [resource, records];
  }));
}
function writeData(data) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) writeData(loadSeedData());
}
function readData() {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  for (const resource of RESOURCE_NAMES) if (!Array.isArray(data[resource])) data[resource] = [];
  return data;
}
function mutate(callback) {
  const data = readData();
  const result = callback(data);
  writeData(data);
  return clone(result);
}
function assertResource(resource) {
  if (!RESOURCE_NAMES.includes(resource)) throw createError(`Unknown resource: ${resource}`, 404);
}
function assertRequired(resource, record) {
  const missing = REQUIRED_FIELDS[resource].filter((field) => {
    const value = record[field];
    return value === undefined || value === null || value === '';
  });
  if (missing.length) throw createError(`Missing required fields: ${missing.join(', ')}`);
}
function validateRecord(resource, record) {
  assertRequired(resource, record);
  if (resource === 'schedules' && record.start_time >= record.end_time) throw createError('Schedule end time must be after start time.');
  if (resource === 'rooms') {
    if (!Array.isArray(record.equipment)) throw createError('Equipment must be an array.');
    if (Number(record.capacity) < 1) throw createError('Room capacity must be at least 1.');
  }
  if (resource === 'events') {
    if (record.date > record.end_date) throw createError('Event end date cannot be before start date.');
    if (record.date === record.end_date && record.start_time >= record.end_time) throw createError('Event end time must be after start time.');
    if (Number(record.capacity) < 1) throw createError('Event capacity must be at least 1.');
  }
  if (resource === 'announcements' && record.date > record.expires) throw createError('Announcement expiry cannot be before its posted date.');
  if (resource === 'assignments' && record.assigned_date > record.deadline) throw createError('Assignment deadline cannot be before its assigned date.');
}
function normalizeRecord(resource, record) {
  const normalized = { ...record };
  if (resource === 'rooms') {
    normalized.capacity = Number(normalized.capacity);
    normalized.floor = Number(normalized.floor);
    normalized.equipment = Array.isArray(normalized.equipment) ? normalized.equipment : [];
    normalized.bookings = Array.isArray(normalized.bookings) ? normalized.bookings : [];
  }
  if (resource === 'events') {
    normalized.capacity = Number(normalized.capacity);
    normalized.registered = Number(normalized.registered || 0);
    normalized.registrations = Array.isArray(normalized.registrations) ? normalized.registrations : [];
  }
  if (resource === 'assignments') normalized.marks = Number(normalized.marks);
  return normalized;
}
const makeId = (resource) => `${ID_PREFIXES[resource]}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
function list(resource) {
  assertResource(resource);
  return clone(readData()[resource]);
}
function create(resource, payload) {
  assertResource(resource);
  return mutate((data) => {
    const record = normalizeRecord(resource, {
      ...payload,
      id: payload.id || makeId(resource),
      ...(resource === 'rooms' ? { bookings: payload.bookings || [] } : {}),
      ...(resource === 'events' ? { registered: payload.registered || 0, registrations: payload.registrations || [] } : {})
    });
    validateRecord(resource, record);
    if (data[resource].some((item) => item.id === record.id)) throw createError('A record with this ID already exists.', 409);
    data[resource].push(record);
    return record;
  });
}
function update(resource, id, payload) {
  assertResource(resource);
  return mutate((data) => {
    const index = data[resource].findIndex((record) => record.id === id);
    if (index < 0) throw createError('Record not found.', 404);
    const record = normalizeRecord(resource, { ...data[resource][index], ...payload, id });
    validateRecord(resource, record);
    data[resource][index] = record;
    return record;
  });
}
function remove(resource, id) {
  assertResource(resource);
  return mutate((data) => {
    const index = data[resource].findIndex((record) => record.id === id);
    if (index < 0) throw createError('Record not found.', 404);
    return data[resource].splice(index, 1)[0];
  });
}
function bookRoom(roomId, payload) {
  return mutate((data) => {
    const room = data.rooms.find((item) => item.id === roomId);
    if (!room) throw createError('Room not found.', 404);
    if (room.status !== 'available') throw createError('This room is unavailable.', 409);
    const required = ['booked_by', 'date', 'start_time', 'end_time', 'purpose'];
    const missing = required.filter((field) => !payload[field]);
    if (missing.length) throw createError(`Missing required fields: ${missing.join(', ')}`);
    if (payload.start_time >= payload.end_time) throw createError('Booking end time must be after start time.');
    room.bookings = Array.isArray(room.bookings) ? room.bookings : [];
    const overlapping = room.bookings.some((booking) => booking.date === payload.date && booking.start_time < payload.end_time && booking.end_time > payload.start_time);
    if (overlapping) throw createError('Room is already booked during that time.', 409);
    const booking = {
      booking_id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      booked_by: payload.booked_by,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      purpose: payload.purpose
    };
    room.bookings.push(booking);
    return booking;
  });
}
function cancelRoomBooking(roomId, bookingId) {
  return mutate((data) => {
    const room = data.rooms.find((item) => item.id === roomId);
    if (!room) throw createError('Room not found.', 404);
    room.bookings = Array.isArray(room.bookings) ? room.bookings : [];
    const index = room.bookings.findIndex((booking) => booking.booking_id === bookingId);
    if (index < 0) throw createError('Booking not found.', 404);
    return room.bookings.splice(index, 1)[0];
  });
}
function registerForEvent(eventId, payload) {
  return mutate((data) => {
    const event = data.events.find((item) => item.id === eventId);
    if (!event) throw createError('Event not found.', 404);
    if (['full', 'cancelled', 'completed'].includes(event.status)) throw createError(`Registration is closed for this ${event.status} event.`, 409);
    if (!payload.student_id || !payload.name) throw createError('Student ID and name are required.');
    if (Number(event.registered) >= Number(event.capacity)) throw createError('Event has reached full capacity.', 409);
    event.registrations = Array.isArray(event.registrations) ? event.registrations : [];
    if (event.registrations.some((student) => student.student_id === payload.student_id)) throw createError('This student is already registered.', 409);
    const registration = { student_id: payload.student_id, name: payload.name };
    event.registrations.push(registration);
    event.registered = Number(event.registered || 0) + 1;
    if (event.registered >= event.capacity) event.status = 'full';
    return registration;
  });
}
function cancelEventRegistration(eventId, studentId) {
  return mutate((data) => {
    const event = data.events.find((item) => item.id === eventId);
    if (!event) throw createError('Event not found.', 404);
    event.registrations = Array.isArray(event.registrations) ? event.registrations : [];
    const index = event.registrations.findIndex((student) => student.student_id === studentId);
    if (index < 0) throw createError('Registration not found.', 404);
    const registration = event.registrations.splice(index, 1)[0];
    event.registered = Math.max(0, Number(event.registered || 0) - 1);
    if (event.status === 'full' && event.registered < event.capacity) event.status = 'upcoming';
    return registration;
  });
}

ensureStore();
module.exports = { STORE_PATH, list, create, update, remove, bookRoom, cancelRoomBooking, registerForEvent, cancelEventRegistration };
