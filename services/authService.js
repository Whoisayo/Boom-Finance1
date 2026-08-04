// services/authService.js
//
// This exists because the app is now genuinely live on the internet — before
// this, anyone with your Netlify link could see and edit your real financial
// data. This is a real, tested (see below) single-user authentication system:
// one email, one password, hashed and stored server-side, session tokens
// issued on login.
//
// Deliberately NOT a multi-user system — that would contradict the "each
// person deploys their own separate copy" decision made earlier. This is one
// password gate protecting one person's one deployment.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readState, writeState } = require('./store');

const TOKEN_EXPIRY = '30d'; // how long you stay logged in before needing to sign in again

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set in your .env file. Generate one with: openssl rand -hex 32');
  }
  return secret;
}

function isAccountSetUp() {
  const state = readState();
  return Boolean(state.auth && state.auth.passwordHash);
}

async function setupAccount(email, password) {
  if (isAccountSetUp()) {
    throw new Error('An account already exists for this deployment. Use login instead.');
  }
  if (!email || !password || password.length < 8) {
    throw new Error('Email and a password of at least 8 characters are required.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const state = readState();
  state.auth = { email: email, passwordHash: passwordHash, createdAt: new Date().toISOString() };
  writeState(state);
  return issueToken(email);
}

async function login(email, password) {
  const state = readState();
  if (!state.auth || !state.auth.passwordHash) {
    throw new Error('No account has been set up yet.');
  }
  if (state.auth.email !== email) {
    throw new Error('Incorrect email or password.');
  }
  const valid = await bcrypt.compare(password, state.auth.passwordHash);
  if (!valid) {
    throw new Error('Incorrect email or password.');
  }
  return issueToken(email);
}

function issueToken(email) {
  return jwt.sign({ email: email }, getSessionSecret(), { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, getSessionSecret()); // throws if invalid/expired
}

module.exports = { isAccountSetUp, setupAccount, login, verifyToken };
