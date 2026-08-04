const ENABLE_BANKING_API_BASE = 'https://api.enablebanking.com';

function isConfigured() {
  return Boolean(process.env.ENABLE_BANKING_APP_ID && process.env.ENABLE_BANKING_JWT);
}

async function listBanks(countryCode) {
  if (!isConfigured()) {
    throw new Error('Enable Banking is not configured yet — see services/bankService.js setup notes.');
  }
  const jwt = process.env.ENABLE_BANKING_JWT;
  const response = await fetch(ENABLE_BANKING_API_BASE + '/aspsps?country=' + encodeURIComponent(countryCode), {
    headers: { Authorization: 'Bearer ' + jwt }
  });
  if (!response.ok) {
    throw new Error('Enable Banking listBanks failed (HTTP ' + response.status + ')');
  }
  return response.json();
}

async function startAuthorization(bankName, countryCode, redirectUrl) {
  if (!isConfigured()) {
    throw new Error('Enable Banking is not configured yet — see services/bankService.js setup notes.');
  }
  const jwt = process.env.ENABLE_BANKING_JWT;
  const response = await fetch(ENABLE_BANKING_API_BASE + '/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    },
    body: JSON.stringify({
      access: { valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
      aspsp: { name: bankName, country: countryCode },
      redirect_url: redirectUrl,
      psu_type: 'personal'
    })
  });
  if (!response.ok) {
    throw new Error('Enable Banking startAuthorization failed (HTTP ' + response.status + ')');
  }
  return response.json();
}

async function completeAuthorization(code) {
  if (!isConfigured()) {
    throw new Error('Enable Banking is not configured yet — see services/bankService.js setup notes.');
  }
  const jwt = process.env.ENABLE_BANKING_JWT;
  const response = await fetch(ENABLE_BANKING_API_BASE + '/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    },
    body: JSON.stringify({ code: code })
  });
  if (!response.ok) {
    throw new Error('Enable Banking completeAuthorization failed (HTTP ' + response.status + ')');
  }
  return response.json();
}

async function getTransactions(accountId) {
  if (!isConfigured()) {
    throw new Error('Enable Banking is not configured yet — see services/bankService.js setup notes.');
  }
  const jwt = process.env.ENABLE_BANKING_JWT;
  const response = await fetch(ENABLE_BANKING_API_BASE + '/accounts/' + encodeURIComponent(accountId) + '/transactions', {
    headers: { Authorization: 'Bearer ' + jwt }
  });
  if (!response.ok) {
    throw new Error('Enable Banking getTransactions failed (HTTP ' + response.status + ')');
  }
  return response.json();
}

module.exports = { isConfigured, listBanks, startAuthorization, completeAuthorization, getTransactions };
