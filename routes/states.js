const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── GET /api/states ─────────────────────────────────────────────
// Returns all active states
router.get('/', async (req, res) => {
  try {
    const states = await db.getAllStates();
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
router.get('/:slug/cities', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category query parameter is required' });
    }

    const { state, cities } = await db.getStateWithCitiesBySlugAndCategory(
      req.params.slug,
      category
    );
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }

    res.json({ success: true, data: { state, cities } });
  } catch (error) {
    console.error('Error fetching cities for state:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

// ─── GET /api/states/:slug/all-cities ────────────────────────────
// Returns all cities + metro cities for a state, grouped by category
router.get('/:slug/all-cities', async (req, res) => {
  try {
    const { state, categories: grouped } = await db.getStateWithGroupedCitiesBySlug(
      req.params.slug
    );
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.json({ success: true, data: { state, categories: grouped } });
  } catch (error) {
    console.error('Error fetching all cities for state:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

module.exports = router;
