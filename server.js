require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const readCache = require('./utils/readCache');
const { apiPublicCache } = require('./middleware/apiPublicCache');

const statesRoutes = require('./routes/states');
const citiesRoutes = require('./routes/cities');
const marketRoutes = require('./routes/market');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const postsRoutes = require('./routes/posts');
const faqsRoutes = require('./routes/faqs');
const serviceCardsRoutes = require('./routes/service-cards');
const uploadRoutes = require('./routes/upload');
const contactsRoutes = require('./routes/contacts');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────
app.use(compression({ threshold: 1024, level: 6 }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/states', statesRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/service-cards', serviceCardsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contacts', contactsRoutes);

// ─── Categories Endpoint ─────────────────────────────────────────
const db = require('./db');
app.get('/api/categories', apiPublicCache(120), async (req, res) => {
  try {
    const categories = await readCache.getOrSet('categories', () => db.getAvailableCategories());
    res.json({ success: true, data: categories, categoryMap: db.CATEGORY_MAP });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ─── Search Dropdown Endpoints ───────────────────────────────────
app.get('/api/search/options', apiPublicCache(120), async (req, res) => {
  try {
    const data = await readCache.getOrSet('search:options', () => db.getSearchDropdownData());
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch search options' });
  }
});

app.get('/api/search/cities/:stateId', apiPublicCache(120), async (req, res) => {
  try {
    const sid = String(req.params.stateId);
    const cities = await readCache.getOrSet(`search:cities:${sid}`, () =>
      db.getCitiesByStateId(sid)
    );
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
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
  console.log(`   Auth:         http://localhost:${PORT}/api/auth/login`);
  console.log(`   Admin:        http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`   Posts:        http://localhost:${PORT}/api/posts`);
});
