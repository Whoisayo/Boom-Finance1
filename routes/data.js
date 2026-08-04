const express = require('express');
const router = express.Router();
const { readState, writeState } = require('../services/store');

router.get('/state', (req, res) => {
  res.json(readState());
});

router.put('/state', (req, res) => {
  const newState = req.body;
  if (!newState || typeof newState !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  writeState(newState);
  res.json({ success: true });
});

module.exports = router;
