const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomsController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Bookings
router.post('/:id/bookings', controller.bookRoom);
router.delete('/:roomId/bookings/:bookingId', controller.cancelBooking);

module.exports = router;