const express = require('express');
const router = express.Router();
const db = require('../db');
const readCache = require('../utils/readCache');
const { apiPublicCache } = require('../middleware/apiPublicCache');

// ─── GET /api/market/:category ───────────────────────────────────
// Returns all states with their cities for a given category
// Used by /market-we-serve/[gmb|seo|web|marketing] pages
router.get('/:category', apiPublicCache(120), async (req, res) => {
  try {
    const { category } = req.params;
    const statesWithCities = await readCache.getOrSet(
      `market:states:${category}`,
      () => db.getStatesWithCitiesByCategory(category)
    );

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
router.get('/:category/cities', apiPublicCache(120), async (req, res) => {
  try {
    const { category } = req.params;
    const cities = await readCache.getOrSet(`market:cities:${category}`, () =>
      db.getAllCitiesByCategory(category)
    );
    res.json({ success: true, data: cities });
  } catch (error) {
    console.error('Error fetching cities by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

// ─── GET /api/market/:category/metrocities ───────────────────────
// Returns flat list of all metro cities for a category
router.get('/:category/metrocities', apiPublicCache(120), async (req, res) => {
  try {
    const { category } = req.params;
    const metros = await readCache.getOrSet(`market:metros:${category}`, () =>
      db.getAllMetroCitiesByCategory(category)
    );
    res.json({ success: true, data: metros });
  } catch (error) {
    console.error('Error fetching metro cities by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metro cities' });
  }
});

module.exports = router;
