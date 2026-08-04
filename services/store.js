// services/store.js
//
// Deliberately simple: a single JSON file on disk, read/written synchronously.
// This is the right amount of engineering for ONE person's personal finance
// data — no database server to run, back up, or secure separately. If this
// were ever serving multiple people, this would need to become a real
// database with proper access control; for the "each person deploys their
// own copy" model, a flat file is honest and sufficient.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

const DEFAULT_STATE = {
  cash: [],
  debt: [],
  investments: [],
  goals: {},
  budget: {
    monthlyIncome: 0,
    cycleStartDay: 1,
    categories: []
  },
  transactions: [],
  bankConnection: null
};

function ensureDataFileExists() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
  }
}

function readState() {
  ensureDataFileExists();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('store.json is corrupted, resetting to defaults:', err.message);
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function writeState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

module.exports = { readState, writeState, DEFAULT_STATE };
