const store = require('../database/store');
const { createResourceRouter, sendError } = require('./resourceRouter');
const router = createResourceRouter('rooms');
router.post('/:id/bookings', (req, res) => {
  try { res.status(201).json(store.bookRoom(req.params.id, req.body)); } catch (error) { sendError(res, error); }
});
router.delete('/:roomId/bookings/:bookingId', (req, res) => {
  try { store.cancelRoomBooking(req.params.roomId, req.params.bookingId); res.json({ success: true }); } catch (error) { sendError(res, error); }
});
module.exports = router;
