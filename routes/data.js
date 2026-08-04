// routes/data.js — the persisted version of what used to live only in the
// frontend's JavaScript variables (CASH_DATA, DEBT_DATA, INVESTMENTS_DATA,
// GOALS_DATA, BUDGET_DATA). The frontend should be updated to call these
// endpoints instead of holding its own copy in memory, so data survives a
// page reload — this was the very first gap identified before any of this
// backend work started.

const express = require('express');
const router = express.Router();
const { readState, writeState } = require('../services/store');

// GET the whole state in one call — simplest possible contract for a
// single-user app; the frontend can just replace its in-memory objects with
// whatever this returns on load.
router.get('/state', (req, res) => {
  res.json(readState());
});

// Replace the financial-data portion of the state — the frontend sends its
// current in-memory data whenever something changes. IMPORTANT: the
// frontend never manages `auth` or `bankConnection` — those are set by
// routes/auth.js and routes/bank.js respectively. Merging them back in here
// (rather than trusting the frontend's payload to include everything) is
// what prevents every autosave from silently wiping the stored password —
// a real bug caught by testing, not something guessed in advance.
router.put('/state', (req, res) => {
  const newState = req.body;
  if (!newState || typeof newState !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  const existing = readState();
  newState.auth = existing.auth;
  newState.bankConnection = existing.bankConnection;
  writeState(newState);
  res.json({ success: true });
});

module.exports = router;
