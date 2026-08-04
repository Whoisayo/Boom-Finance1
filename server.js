require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const coachRoutes = require('./routes/coach');
const bankRoutes = require('./routes/bank');
const requireAuth = require('./middleware/requireAuth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// auth routes are public (you need to be able to log in before you're logged in)
app.use('/api/auth', authRoutes);

// everything else requires a valid session token — this app now holds real
// financial data on a public URL, so this is not optional
app.use('/api/data', requireAuth, dataRoutes);
app.use('/api/coach', requireAuth, coachRoutes);
app.use('/api/bank', requireAuth, bankRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found: ' + req.method + ' ' + req.path });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('Boom Finance backend running on http://localhost:' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/health');
});
