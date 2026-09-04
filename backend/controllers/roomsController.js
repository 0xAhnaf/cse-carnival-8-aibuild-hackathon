const db = require('../database/db');
const { validateRoomBooking } = require('../services/validators');

exports.getAll = (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms').all().map(room => ({
    ...room,
    features: room.features ? JSON.parse(room.features) : []
  }));
  res.json(rooms);
};

exports.create = (req, res) => {
  const { id, room_number, building, capacity, features } = req.body;
  const newId = id || `room_${Date.now()}`;
  const featuresStr = Array.isArray(features) ? JSON.stringify(features) : JSON.stringify([]);

  db.prepare(`
    INSERT INTO rooms (id, room_number, building, capacity, features)
    VALUES (?, ?, ?, ?, ?)
  `).run(newId, room_number, building, capacity, featuresStr);

  const created = db.prepare('SELECT * FROM rooms WHERE id = ?').get(newId);
  res.status(201).json({ ...created, features: JSON.parse(created.features) });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { room_number, building, capacity, features } = req.body;
  const featuresStr = features ? JSON.stringify(features) : null;

  const result = db.prepare(`
    UPDATE rooms 
    SET room_number = COALESCE(?, room_number),
        building = COALESCE(?, building),
        capacity = COALESCE(?, capacity),
        features = COALESCE(?, features)
    WHERE id = ?
  `).run(room_number, building, capacity, featuresStr, id);

  if (result.changes === 0) return res.status(404).json({ error: 'Room not found' });
  const updated = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  res.json({ ...updated, features: JSON.parse(updated.features) });
};

exports.remove = (req, res) => {
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Room not found' });
  res.json({ success: true, message: 'Room deleted successfully' });
};

exports.bookRoom = (req, res) => {
  const { id: roomId } = req.params;
  const { booked_by, date, time_slot, purpose } = req.body;

  const validation = validateRoomBooking(roomId, date, time_slot);
  if (!validation.valid) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const bookingId = `bk_${Date.now()}`;
  db.prepare(`
    INSERT INTO room_bookings (id, room_id, booked_by, date, time_slot, purpose)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(bookingId, roomId, booked_by, date, time_slot, purpose || '');

  const booking = db.prepare('SELECT * FROM room_bookings WHERE id = ?').get(bookingId);
  res.status(201).json(booking);
};

exports.cancelBooking = (req, res) => {
  const { roomId, bookingId } = req.params;
  const result = db.prepare('DELETE FROM room_bookings WHERE id = ? AND room_id = ?').run(bookingId, roomId);

  if (result.changes === 0) return res.status(404).json({ error: 'Booking not found for this room' });
  res.json({ success: true, message: 'Booking canceled successfully' });
};