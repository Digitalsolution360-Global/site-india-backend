const express = require('express');
const router = express.Router();
const db = require('../db');
const readCache = require('../utils/readCache');
const { apiPublicCache } = require('../middleware/apiPublicCache');

// ─── GET /api/states ─────────────────────────────────────────────
// Returns all active states
router.get('/', apiPublicCache(120), async (req, res) => {
  try {
    const states = await readCache.getOrSet('states:all', () => db.getAllStates());
    res.json({ success: true, data: states });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch states' });
  }
});

// ─── GET /api/states/:slug ───────────────────────────────────────
// Returns a single state by slug
router.get('/:slug', async (req, res) => {
  try {
    const state = await db.getStateBySlug(req.params.slug);
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.json({ success: true, data: state });
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch state' });
  }
});

// ─── GET /api/states/:slug/cities?category=xxx ──────────────────
// Returns cities for a state, filtered by category
router.get('/:slug/cities', apiPublicCache(120), async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category query parameter is required' });
    }

    const slug = req.params.slug;
    const data = await readCache.getOrSet(`states:cities:${slug}:${category}`, async () => {
      const state = await db.getStateBySlug(slug);
      if (!state) return null;
      const cities = await db.getCitiesByStateAndCategory(state.state_id, category);
      return { state, cities };
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching cities for state:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

// ─── GET /api/states/:slug/all-cities ────────────────────────────
// Returns all cities + metro cities for a state, grouped by category
router.get('/:slug/all-cities', apiPublicCache(120), async (req, res) => {
  try {
    const slug = req.params.slug;
    const payload = await readCache.getOrSet(`states:allcities:${slug}`, async () => {
      const state = await db.getStateBySlug(slug);
      if (!state) return null;
      const grouped = await db.getAllCitiesByState(state.state_id);
      return { state, categories: grouped };
    });
    if (!payload) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error fetching all cities for state:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

module.exports = router;
