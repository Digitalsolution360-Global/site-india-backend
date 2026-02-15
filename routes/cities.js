const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── GET /api/cities/:slug ───────────────────────────────────────
// Returns a city by its city_slug (all categories)
router.get('/:slug', async (req, res) => {
  try {
    const city = await db.getCityBySlug(req.params.slug);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.json({ success: true, data: city });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch city' });
  }
});

// ─── GET /api/cities/:category/:slug ─────────────────────────────
// Returns a city by slug filtered by category_name
router.get('/:category/:slug', async (req, res) => {
  try {
    const { category, slug } = req.params;
    const city = await db.getCityBySlugAndCategory(slug, category);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found for this category' });
    }
    res.json({ success: true, data: city });
  } catch (error) {
    console.error('Error fetching city by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch city' });
  }
});

module.exports = router;
