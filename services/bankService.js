// services/bankService.js
//
// ⚠️ HONESTY NOTE, updated: this now generates REAL RS256-signed JWTs
// following Enable Banking's documented format (confirmed directly from
// their own docs at enablebanking.com/docs/api/quick-start/ — header shape,
// signing algorithm, and the fact that it's signed with your application's
// private key are all confirmed). What I could NOT fully confirm from their
// docs is the complete exact list of claims in the JWT body — their sample
// code was cut off in what I could retrieve. I've built the body using the
// standard pattern (iss/aud/iat/exp) that matches how they described it,
// but before trusting this against your real bank: open
// https://enablebanking.com/docs/api/quick-start/ yourself and compare the
// `jwtBody` object in their sample code against buildJWT() below. If theirs
// has different or additional fields, update this function to match —
// don't assume mine is complete just because it's plausible.
//
// I still cannot test any of this against the real API — no network route
// to enablebanking.com from where this was built.

const fs = require('fs');
const crypto = require('crypto');

const ENABLE_BANKING_API_BASE = 'https://api.enablebanking.com';

function isConfigured() {
  return Boolean(
    process.env.ENABLE_BANKING_APPLICATION_ID &&
    process.env.ENABLE_BANKING_PRIVATE_KEY_PATH &&
    fs.existsSync(process.env.ENABLE_BANKING_PRIVATE_KEY_PATH)
  );
}

function base64url(bufferOrObject) {
  const buf = Buffer.isBuffer(bufferOrObject)
    ? bufferOrObject
    : Buffer.from(JSON.stringify(bufferOrObject));
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildJWT() {
  const applicationId = process.env.ENABLE_BANKING_APPLICATION_ID;
  const privateKeyPath = process.env.ENABLE_BANKING_PRIVATE_KEY_PATH;
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

  const now = Math.floor(Date.now() / 1000);
  const header = { typ: 'JWT', alg: 'RS256', kid: applicationId };
  const body = {
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + 3600
  };

  const signingInput = base64url(header) + '.' + base64url(body);
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  const signatureB64 = signature.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return signingInput + '.' + signatureB64;
}

async function apiRequest(path, options) {
  if (!isConfigured()) {
    throw new Error('Enable Banking is not configured — see .env.example and README.md.');
  }
  const jwt = buildJWT();
  const response = await fetch(ENABLE_BANKING_API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt,
      ...(options && options.headers)
    }
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error('Enable Banking request failed (HTTP ' + response.status + '): ' + body.slice(0, 300));
  }
  return response.json();
}

async function listBanks(countryCode) {
  return apiRequest('/aspsps?country=' + encodeURIComponent(countryCode), { method: 'GET' });
}

async function startAuthorization(bankName, countryCode, redirectUrl) {
  return apiRequest('/auth', {
    method: 'POST',
    body: JSON.stringify({
      access: { valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
      aspsp: { name: bankName, country: countryCode },
      redirect_url: redirectUrl,
      psu_type: 'personal'
    })
  });
}

async function completeAuthorization(code) {
  return apiRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify({ code: code })
  });
}

async function getTransactions(accountId) {
  return apiRequest('/accounts/' + encodeURIComponent(accountId) + '/transactions', { method: 'GET' });
}

async function getAccountBalances(accountUid) {
  return apiRequest('/accounts/' + encodeURIComponent(accountUid) + '/balances', { method: 'GET' });
}

module.exports = { isConfigured, listBanks, startAuthorization, completeAuthorization, getTransactions, getAccountBalances, buildJWT };
