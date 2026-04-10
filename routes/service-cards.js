const express = require('express');
const router = express.Router();
const db = require('../db');
const readCache = require('../utils/readCache');
const { apiPublicCache } = require('../middleware/apiPublicCache');

/**
 * GET /api/service-cards?category=...&page_slug=...
 *
 * Fetching logic (same as FAQs):
 *   1. If page_slug provided, try category + page_slug first
 *   2. If none found, fall back to category defaults (page_slug IS NULL)
 */
router.get('/', apiPublicCache(60), async (req, res) => {
    try {
        const { category, page_slug } = req.query;

        if (!category) {
            return res.status(400).json({ success: false, message: 'category is required' });
        }

        const slugKey = page_slug === undefined || page_slug === '' ? '_default' : String(page_slug);
        const cards = await readCache.getOrSet(`service-cards:${category}:${slugKey}`, async () => {
            let rows = [];

            if (page_slug) {
                rows = await db.query(
                    `SELECT id, category_name, page_slug, title, description, sort_order
         FROM service_cards
         WHERE category_name = ? AND page_slug = ? AND status = 0
         ORDER BY sort_order ASC`,
                    [category, page_slug]
                );
            }

            if (rows.length === 0) {
                rows = await db.query(
                    `SELECT id, category_name, page_slug, title, description, sort_order
         FROM service_cards
         WHERE category_name = ? AND page_slug IS NULL AND status = 0
         ORDER BY sort_order ASC`,
                    [category]
                );
            }

            return rows;
        });

        res.json({ success: true, data: cards });
    } catch (err) {
        console.error('Error fetching service cards:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/service-cards/categories
 * Returns distinct category names
 */
router.get('/categories', apiPublicCache(120), async (req, res) => {
    try {
        const rows = await readCache.getOrSet('service-cards:categories', () =>
            db.query('SELECT DISTINCT category_name FROM service_cards ORDER BY category_name')
        );
        res.json({ success: true, data: rows.map(r => r.category_name) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/service-cards/overrides
 * Returns page_slugs that have custom overrides (non-null, non-market)
 */
router.get('/overrides', apiPublicCache(120), async (req, res) => {
    try {
        const { category } = req.query;
        const rows = await readCache.getOrSet(`service-cards:overrides:${category || 'all'}`, async () => {
            let q = 'SELECT DISTINCT page_slug, category_name FROM service_cards WHERE page_slug IS NOT NULL';
            const params = [];
            if (category) {
                q += ' AND category_name = ?';
                params.push(category);
            }
            q += ' ORDER BY category_name, page_slug';
            return db.query(q, params);
        });
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
