require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');

const statesRoutes = require('./routes/states');
const citiesRoutes = require('./routes/cities');
const marketRoutes = require('./routes/market');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001'],
  credentials: true
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/states', statesRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/market', marketRoutes);

// ─── Categories Endpoint ─────────────────────────────────────────
const db = require('./db');
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getAvailableCategories();
    res.json({ success: true, data: categories, categoryMap: db.CATEGORY_MAP });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 India360 API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   States:       http://localhost:${PORT}/api/states`);
  console.log(`   Market:       http://localhost:${PORT}/api/market/:category`);
  console.log(`   Cities:       http://localhost:${PORT}/api/cities/:slug`);
});
