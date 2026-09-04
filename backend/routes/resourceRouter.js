const express = require('express');
const store = require('../database/store');

function sendError(res, error) {
  res.status(error.status || 500).json({ error: error.message || 'Unexpected server error.' });
}
function createResourceRouter(resource) {
  const router = express.Router();
  router.get('/', (req, res) => {
    try { res.json(store.list(resource)); } catch (error) { sendError(res, error); }
  });
  router.post('/', (req, res) => {
    try { res.status(201).json(store.create(resource, req.body)); } catch (error) { sendError(res, error); }
  });
  router.put('/:id', (req, res) => {
    try { res.json(store.update(resource, req.params.id, req.body)); } catch (error) { sendError(res, error); }
  });
  router.delete('/:id', (req, res) => {
    try { store.remove(resource, req.params.id); res.json({ success: true }); } catch (error) { sendError(res, error); }
  });
  return router;
}
module.exports = { createResourceRouter, sendError };
