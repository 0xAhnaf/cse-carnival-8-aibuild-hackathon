const store = require('../database/store');
const { createResourceRouter, sendError } = require('./resourceRouter');
const router = createResourceRouter('events');
router.post('/:id/registrations', (req, res) => {
  try { res.status(201).json(store.registerForEvent(req.params.id, req.body)); } catch (error) { sendError(res, error); }
});
router.delete('/:eventId/registrations/:studentId', (req, res) => {
  try { store.cancelEventRegistration(req.params.eventId, req.params.studentId); res.json({ success: true }); } catch (error) { sendError(res, error); }
});
module.exports = router;
