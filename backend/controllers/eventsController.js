const db = require('../database/db');
const { validateEventRegistration } = require('../services/validators');

exports.getAll = (req, res) => {
  const items = db.prepare('SELECT * FROM events').all();
  res.json(items);
};

exports.create = (req, res) => {
  const { id, title, description, date, time, location, capacity } = req.body;
  const newId = id || `evt_${Date.now()}`;

  db.prepare(`
    INSERT INTO events (id, title, description, date, time, location, capacity, registered_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(newId, title, description, date, time, location, capacity);

  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(newId));
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, location, capacity } = req.body;

  const result = db.prepare(`
    UPDATE events 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        location = COALESCE(?, location),
        capacity = COALESCE(?, capacity)
    WHERE id = ?
  `).run(title, description, date, time, location, capacity, id);

  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(id));
};

exports.remove = (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true, message: 'Event deleted successfully' });
};

exports.register = (req, res) => {
  const { id: eventId } = req.params;
  const { student_id, user_id } = req.body;
  const userId = student_id || user_id;

  const validation = validateEventRegistration(eventId, userId);
  if (!validation.valid) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const regId = `reg_${Date.now()}`;
  
  const registerTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO event_registrations (id, event_id, user_id)
      VALUES (?, ?, ?)
    `).run(regId, eventId, userId);

    db.prepare(`
      UPDATE events SET registered_count = registered_count + 1 WHERE id = ?
    `).run(eventId);
  });

  registerTx();
  res.status(201).json({ id: regId, event_id: eventId, user_id: userId });
};

exports.cancelRegistration = (req, res) => {
  const { eventId, studentId } = req.params;

  const cancelTx = db.transaction(() => {
    const result = db.prepare(`
      DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?
    `).run(eventId, studentId);

    if (result.changes > 0) {
      db.prepare(`
        UPDATE events SET registered_count = MAX(0, registered_count - 1) WHERE id = ?
      `).run(eventId);
      return true;
    }
    return false;
  });

  const success = cancelTx();
  if (!success) return res.status(404).json({ error: 'Registration not found' });

  res.json({ success: true, message: 'Registration canceled successfully' });
};