require('dotenv').config();
const express = require('express');
const cors = require('cors');

const dataRoutes = require('./routes/data');
const coachRoutes = require('./routes/coach');
const bankRoutes = require('./routes/bank');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // fine for personal single-user use; tighten this if that ever changes
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/data', dataRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/bank', bankRoutes);

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
