const express = require('express');
const router = express.Router();
const controller = require('../controllers/eventsController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Registrations
router.post('/:id/registrations', controller.register);
router.delete('/:eventId/registrations/:studentId', controller.cancelRegistration);

module.exports = router;