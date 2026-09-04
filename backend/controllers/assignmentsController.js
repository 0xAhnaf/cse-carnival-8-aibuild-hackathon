const db = require('../database/db');

exports.getAll = (req, res) => {
  res.json(db.prepare('SELECT * FROM assignments').all());
};

exports.create = (req, res) => {
  const { id, course_code, title, due_date, description, status } = req.body;
  const newId = id || `asgn_${Date.now()}`;

  db.prepare(`
    INSERT INTO assignments (id, course_code, title, due_date, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newId, course_code, title, due_date, description, status || 'Pending');

  res.status(201).json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(newId));
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { course_code, title, due_date, description, status } = req.body;

  const result = db.prepare(`
    UPDATE assignments 
    SET course_code = COALESCE(?, course_code),
        title = COALESCE(?, title),
        due_date = COALESCE(?, due_date),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(course_code, title, due_date, description, status, id);

  if (result.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
  res.json(db.prepare('SELECT * FROM assignments WHERE id = ?').get(id));
};

exports.remove = (req, res) => {
  const result = db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ success: true, message: 'Assignment deleted successfully' });
};