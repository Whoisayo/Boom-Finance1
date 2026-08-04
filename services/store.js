const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

const DEFAULT_STATE = {
  cash: [
    { id: 'cash-current', name: 'Current account', amount: 1850 },
    { id: 'cash-pot', name: 'Savings pot', amount: 490 }
  ],
  debt: [
    { id: 'debt-cc', name: 'Credit card', amount: 1240, log: [] }
  ],
  investments: [
    { id: 'stocks', name: 'Stocks', amount: 1551, log: [] },
    { id: 'property', name: 'Property', amount: 530, log: [] },
    { id: 'bond', name: 'Bond', amount: 795, log: [] }
  ],
  goals: {
    'emergency-fund': { name: 'Emergency Fund', icon: 'umbrellaIcon', iconBg: 'var(--teal-tint)', iconColor: 'var(--teal-dark)', target: 10000, date: 'Dec 2027', saved: 2500, contribution: 150, pillClass: 'pill-teal', barColor: 'var(--teal)', log: [] },
    'portugal-trip':  { name: 'Portugal Trip',  icon: 'planeIcon',    iconBg: 'var(--amber-tint)', iconColor: 'var(--amber)',    target: 1800,  date: 'Jun 2027', saved: 860,  contribution: 90,  pillClass: 'pill-amber', barColor: 'var(--amber)', log: [] },
    'house-deposit':  { name: 'House Deposit',  icon: 'keyIcon',      iconBg: 'var(--teal-tint)', iconColor: 'var(--teal-dark)', target: 25000, date: '2030',     saved: 2250, contribution: 200, pillClass: 'pill-teal', barColor: 'var(--teal)', log: [] }
  },
  budget: {
    monthlyIncome: 3200,
    cycleStartDay: 26,
    categories: [
      { key: 'groceries', name: 'Groceries', limit: 500 },
      { key: 'dining', name: 'Dining out', limit: 200 },
      { key: 'subscriptions', name: 'Subscriptions', limit: 50 },
      { key: 'transport', name: 'Transport', limit: 150 },
      { key: 'bills', name: 'Bills & utilities', limit: 1200 }
    ]
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
