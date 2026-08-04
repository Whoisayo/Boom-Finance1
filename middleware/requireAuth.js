// middleware/requireAuth.js
const authService = require('../services/authService');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  try {
    req.user = authService.verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid — please sign in again.' });
  }
};
