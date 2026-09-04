const db = require('../database/db');

exports.getAll = (req, res) => {
  const items = db.prepare('SELECT * FROM schedules').all();
  res.json(items);
};

exports.create = (req, res) => {
  const { id, course_code, title, day, time_slot, room, instructor } = req.body;
  const newId = id || `sched_${Date.now()}`;
  
  db.prepare(`
    INSERT INTO schedules (id, course_code, title, day, time_slot, room, instructor)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(newId, course_code, title, day, time_slot, room, instructor);

  const created = db.prepare('SELECT * FROM schedules WHERE id = ?').get(newId);
  res.status(201).json(created);
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { course_code, title, day, time_slot, room, instructor } = req.body;

  const result = db.prepare(`
    UPDATE schedules 
    SET course_code = COALESCE(?, course_code),
        title = COALESCE(?, title),
        day = COALESCE(?, day),
        time_slot = COALESCE(?, time_slot),
        room = COALESCE(?, room),
        instructor = COALESCE(?, instructor)
    WHERE id = ?
  `).run(course_code, title, day, time_slot, room, instructor, id);

  if (result.changes === 0) return res.status(404).json({ error: 'Schedule not found' });
  res.json(db.prepare('SELECT * FROM schedules WHERE id = ?').get(id));
};

exports.remove = (req, res) => {
  const result = db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Schedule not found' });
  res.json({ success: true, message: 'Schedule deleted successfully' });
};