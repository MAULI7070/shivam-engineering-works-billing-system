const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const invoicesRouter     = require('./routes/invoices');
const calculationsRouter = require('./routes/calculations');

const app  = express();
const PORT = process.env.PORT || 5000;
const frontendDist = path.join(__dirname, 'public');

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/invoices',      invoicesRouter);
app.use('/api/calculations',  calculationsRouter);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', service: 'Billing System API', time: new Date() });
});

// Serve the compiled React app when the backend is deployed as one service.
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), err => {
    if (err) next();
  });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Billing System API running at http://localhost:${PORT}`);
});
