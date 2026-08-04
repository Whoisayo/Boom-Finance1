const express = require('express');
const router = express.Router();
const { askCoach } = require('../services/claudeService');
const { readState } = require('../services/store');

router.post('/chat', async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Request body needs a "message" string.' });
  }

  try {
    const financialContext = readState();
    const reply = await askCoach(message, financialContext, history);
    res.json({ reply });
  } catch (err) {
    console.error('Coach error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
