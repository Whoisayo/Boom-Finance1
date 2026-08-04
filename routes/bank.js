// routes/bank.js
//
// ⚠️ See services/bankService.js for the full honesty note — none of this
// has been tested against the real Enable Banking API.

const express = require('express');
const router = express.Router();
const bankService = require('../services/bankService');
const syncService = require('../services/syncService');
const { readState, writeState } = require('../services/store');

router.get('/status', (req, res) => {
  const state = readState();
  res.json({
    configured: bankService.isConfigured(),
    connected: Boolean(state.bankConnection)
  });
});

router.get('/banks', async (req, res) => {
  const country = req.query.country || 'GB';
  try {
    const banks = await bankService.listBanks(country);
    res.json(banks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/connect', async (req, res) => {
  const { bankName, country, redirectUrl } = req.body || {};
  if (!bankName || !redirectUrl) {
    return res.status(400).json({ error: 'bankName and redirectUrl are required.' });
  }
  try {
    const result = await bankService.startAuthorization(bankName, country || 'GB', redirectUrl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The bank redirects the user's browser back here after they authenticate.
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code in callback.');
  }
  try {
    const session = await bankService.completeAuthorization(code);
    const state = readState();
    state.bankConnection = {
      connectedAt: new Date().toISOString(),
      session: session
    };
    writeState(state);

    try {
      await syncService.syncAllConnectedAccounts();
    } catch (syncErr) {
      console.error('Initial sync after connect failed:', syncErr.message);
    }

    res.send('Bank connected and synced. You can close this window and return to the app.');
  } catch (err) {
    res.status(500).send('Connection failed: ' + err.message);
  }
});

router.post('/sync', async (req, res) => {
  try {
    const result = await syncService.syncAllConnectedAccounts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions/:accountId', async (req, res) => {
  try {
    const transactions = await bankService.getTransactions(req.params.accountId);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
