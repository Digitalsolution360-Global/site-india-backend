const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── GET /api/market/:category ───────────────────────────────────
// Returns all states with their cities for a given category
// Used by /market-we-serve/[gmb|seo|web|marketing] pages
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const statesWithCities = await db.getStatesWithCitiesByCategory(category);

    if (!statesWithCities.length) {
      return res.status(404).json({
        success: false,
        message: `No data found for category: ${category}`
      });
    }

    res.json({ success: true, data: statesWithCities });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch market data' });
  }
});

// ─── GET /api/market/:category/cities ────────────────────────────
// Returns flat list of all cities for a category (with state info)
router.get('/:category/cities', async (req, res) => {
  try {
    const { category } = req.params;
    const cities = await db.getAllCitiesByCategory(category);
    res.json({ success: true, data: cities });
  } catch (error) {
    console.error('Error fetching cities by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

module.exports = router;
