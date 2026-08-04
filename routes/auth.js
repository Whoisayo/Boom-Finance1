// routes/auth.js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.get('/status', (req, res) => {
  res.json({ accountExists: authService.isAccountSetUp() });
});

router.post('/setup', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const token = await authService.setupAccount(email, password);
    res.json({ token: token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const token = await authService.login(email, password);
    res.json({ token: token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
