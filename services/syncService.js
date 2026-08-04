// services/syncService.js
//
// ⚠️ HONESTY NOTE: the account list and balance response shapes below are
// confirmed directly from Enable Banking's own documentation (I retrieved
// real example JSON for both). The TRANSACTION response shape is not fully
// confirmed the same way — their docs describe fields but I couldn't
// retrieve a complete example object. parseTransaction() below tries
// several plausible field names defensively and won't crash if some are
// missing, but you should log one real response (console.log it) the first
// time you sync for real, compare it against parseTransaction(), and adjust
// field names if they don't match. I'd rather ship something that degrades
// gracefully and tell you to verify it than pretend this part is certain.

const bankService = require('./bankService');
const { readState, writeState } = require('./store');

// Very simple best-effort categorisation from merchant/description text.
// This is intentionally basic — a real categorisation engine (per your
// Technical Review doc) is future work, not something to fake here.
const CATEGORY_KEYWORDS = {
  groceries: ['tesco', 'sainsbury', 'asda', 'aldi', 'lidl', 'waitrose', 'morrisons', 'co-op', 'grocery'],
  dining: ['restaurant', 'cafe', 'coffee', 'starbucks', 'costa', 'deliveroo', 'uber eats', 'just eat', 'pret'],
  subscriptions: ['netflix', 'spotify', 'disney', 'amazon prime', 'apple.com/bill', 'subscription'],
  bills: ['rent', 'landlord', 'mortgage', 'council tax', 'energy', 'water', 'gas', 'electric', 'utility'],
  transport: ['uber', 'tfl', 'trainline', 'railway', 'fuel', 'petrol', 'parking'],
  income: ['salary', 'payroll', 'wages']
};

function guessCategory(description) {
  const text = (description || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return category;
  }
  return 'other';
}

// Defensive parsing — tries several plausible field name variants since the
// exact transaction shape isn't fully confirmed. See note at top of file.
function parseTransaction(raw, index) {
  const amountObj = raw.transaction_amount || raw.amount || {};
  const amountValue = parseFloat(amountObj.amount ?? raw.amount ?? 0);
  const isCredit = (raw.credit_debit_indicator || raw.creditDebitIndicator) === 'CRDT' || amountValue > 0;

  const description =
    raw.remittance_information_unstructured ||
    raw.description ||
    raw.creditor_name ||
    raw.debtor_name ||
    raw.merchant ||
    'Bank transaction';

  const dateStr = raw.booking_date || raw.value_date || raw.date || new Date().toISOString().slice(0, 10);

  return {
    id: 'synced-' + (raw.entry_reference || raw.transaction_id || index + '-' + dateStr),
    merchant: description,
    category: isCredit ? 'income' : guessCategory(description),
    amount: isCredit ? Math.abs(amountValue) : -Math.abs(amountValue),
    day: dateStr,
    status: raw.status === 'PDNG' ? 'Pending' : 'Posted',
    source: 'synced'
  };
}

async function syncAllConnectedAccounts() {
  const state = readState();
  if (!state.bankConnection || !state.bankConnection.session || !state.bankConnection.session.accounts) {
    throw new Error('No connected bank accounts to sync.');
  }

  const accounts = state.bankConnection.session.accounts;
  const syncedCash = [];
  const syncedTransactions = [];
  const errors = [];

  for (const account of accounts) {
    const uid = account.uid;
    try {
      const balanceData = await bankService.getAccountBalances(uid);
      const bookedBalance = (balanceData.balances || []).find((b) => b.balance_type === 'CLBD') || (balanceData.balances || [])[0];
      if (bookedBalance) {
        syncedCash.push({
          id: 'bank-' + uid,
          name: account.name || account.details || 'Bank account',
          amount: parseFloat(bookedBalance.balance_amount.amount),
          source: 'synced',
          currency: bookedBalance.balance_amount.currency
        });
      }
    } catch (err) {
      errors.push('Balance sync failed for ' + (account.name || uid) + ': ' + err.message);
    }

    try {
      const txData = await bankService.getTransactions(uid);
      const rawTransactions = txData.transactions || txData.booked || [];
      rawTransactions.forEach((raw, i) => syncedTransactions.push(parseTransaction(raw, i)));
    } catch (err) {
      errors.push('Transaction sync failed for ' + (account.name || uid) + ': ' + err.message);
    }
  }

  const manualCash = state.cash.filter((c) => c.source !== 'synced');
  state.cash = manualCash.concat(syncedCash);

  const manualTransactions = state.transactions.filter((t) => t.source !== 'synced');
  state.transactions = manualTransactions.concat(syncedTransactions);

  state.bankConnection.lastSyncedAt = new Date().toISOString();
  writeState(state);

  return {
    accountsSynced: accounts.length,
    cashAccountsUpdated: syncedCash.length,
    transactionsImported: syncedTransactions.length,
    errors: errors
  };
}

module.exports = { syncAllConnectedAccounts };
