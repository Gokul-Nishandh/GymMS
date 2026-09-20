require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');

const app = express();

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? (process.env.CLIENT_URL || true) : true,
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// ── Body parsing ────────────────────────────────────────────
// Webhook route needs raw body — parsed inside paymentRoutes.js
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static receipts (local dev) ──────────────────────────────
app.use('/receipts', express.static(path.resolve(__dirname, 'receipts')));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/members',     require('./routes/memberRoutes'));
app.use('/api',             require('./routes/membershipRoutes'));
app.use('/api/payments',    require('./routes/paymentRoutes'));
app.use('/api/receipts',    require('./routes/receiptRoutes'));

// ── Health & Debug check ─────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/debug', async (req, res) => {
  const { pool } = require('./config/database');
  try {
    const [dbRes] = await pool.query('SELECT DATABASE() as current_db, VERSION() as version');
    const [tables] = await pool.query('SHOW TABLES');
    let users = [];
    try {
      const [u] = await pool.query('SELECT user_id, email, role, created_at FROM users');
      users = u;
    } catch (uErr) {
      users = { error: uErr.message };
    }
    res.json({
      success: true,
      database: dbRes[0],
      env: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
      },
      tables: tables.map(t => Object.values(t)[0]),
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Database query failed in /api/debug',
      error: err.message,
      code: err.code,
      stack: err.stack,
    });
  }
});

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server;

testConnection().then(() => {
  server = app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please terminate existing node processes or wait 2 seconds.`);
    } else {
      console.error('Server error:', err);
    }
  });
});

const cleanup = () => {
  if (server) {
    server.close(() => {
      console.log('HTTP server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.once('SIGUSR2', () => {
  if (server) {
    server.close(() => process.kill(process.pid, 'SIGUSR2'));
  } else {
    process.kill(process.pid, 'SIGUSR2');
  }
});

module.exports = app;
