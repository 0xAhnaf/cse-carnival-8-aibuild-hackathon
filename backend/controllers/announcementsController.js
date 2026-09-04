const db = require('../database/db');

exports.getAll = (req, res) => {
  res.json(db.prepare('SELECT * FROM announcements').all());
};

exports.create = (req, res) => {
  const { id, title, content, date_posted, category } = req.body;
  const newId = id || `anc_${Date.now()}`;

  db.prepare(`
    INSERT INTO announcements (id, title, content, date_posted, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(newId, title, content, date_posted || new Date().toISOString().split('T')[0], category || 'General');

  res.status(201).json(db.prepare('SELECT * FROM announcements WHERE id = ?').get(newId));
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { title, content, date_posted, category } = req.body;

  const result = db.prepare(`
    UPDATE announcements 
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        date_posted = COALESCE(?, date_posted),
        category = COALESCE(?, category)
    WHERE id = ?
  `).run(title, content, date_posted, category, id);

  if (result.changes === 0) return res.status(404).json({ error: 'Announcement not found' });
  res.json(db.prepare('SELECT * FROM announcements WHERE id = ?').get(id));
};

exports.remove = (req, res) => {
  const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ success: true, message: 'Announcement deleted successfully' });
};