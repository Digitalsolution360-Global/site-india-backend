const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── GET /api/cities/metro/:slug ───────────────────────────────
// Returns a metro city by its metrocity_slug
router.get('/metro/:slug', async (req, res) => {
  try {
    const metro = await db.getMetroCityBySlug(req.params.slug);
    if (!metro) {
      return res.status(404).json({ success: false, message: 'Metro city not found' });
    }

    const normalized = {
      city_id: metro.metrocity_id,
      state_id: metro.state_id,
      city: metro.metrocity,
      category_name: metro.category_name,
      city_name: metro.metrocity_name,
      city_slug: metro.metrocity_slug,
      city_description: metro.metrocity_description,
      image: metro.image,
      yt_iframe_link: metro.yt_iframe_link,
      meta_title: metro.meta_title,
      meta_description: metro.meta_description,
      meta_keyword: metro.meta_keyword,
      state_name: metro.state_name,
      state_slug: metro.state_slug,
      parent_city: metro.parent_city,
      parent_city_slug: metro.parent_city_slug,
      is_metrocity: true
    };

    return res.json({ success: true, data: normalized, type: 'metrocity' });
  } catch (error) {
    console.error('Error fetching metro city:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metro city' });
  }
});

// ─── GET /api/cities/:slug ───────────────────────────────────────
// Returns a normal city by its city_slug
router.get('/:slug', async (req, res) => {
  try {
    const city = await db.getCityBySlug(req.params.slug);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    return res.json({ success: true, data: city, type: 'city' });
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
