const express = require('express');
const router = express.Router();
const db = require('../db');
const readCache = require('../utils/readCache');
const { apiPublicCache } = require('../middleware/apiPublicCache');

/**
 * GET /api/faqs?category=...&page_slug=...
 *
 * Fetching logic:
 *   1. If page_slug is provided, look for FAQs matching category + page_slug
 *   2. If none found (or page_slug not provided), fall back to category defaults (page_slug IS NULL)
 *   3. If page_slug = 'market', only return market-page FAQs (no fallback)
 */
router.get('/', apiPublicCache(60), async (req, res) => {
    try {
        const { category, page_slug } = req.query;

        if (!category) {
            return res.status(400).json({ success: false, message: 'category is required' });
        }

        const slugKey = page_slug === undefined || page_slug === '' ? '_default' : String(page_slug);
        const faqs = await readCache.getOrSet(`faqs:${category}:${slugKey}`, async () => {
            let rows = [];

            if (page_slug === 'market') {
                rows = await db.query(
                    `SELECT id, category_name, page_slug, question, answer, sort_order
         FROM faqs
         WHERE category_name = ? AND page_slug = 'market' AND status = 0
         ORDER BY sort_order ASC`,
                    [category]
                );
            } else if (page_slug) {
                rows = await db.query(
                    `SELECT id, category_name, page_slug, question, answer, sort_order
         FROM faqs
         WHERE category_name = ? AND page_slug = ? AND status = 0
         ORDER BY sort_order ASC`,
                    [category, page_slug]
                );

                if (rows.length === 0) {
                    rows = await db.query(
                        `SELECT id, category_name, page_slug, question, answer, sort_order
           FROM faqs
           WHERE category_name = ? AND page_slug IS NULL AND status = 0
           ORDER BY sort_order ASC`,
                        [category]
                    );
                }
            } else {
                rows = await db.query(
                    `SELECT id, category_name, page_slug, question, answer, sort_order
         FROM faqs
         WHERE category_name = ? AND page_slug IS NULL AND status = 0
         ORDER BY sort_order ASC`,
                    [category]
                );
            }

            return rows;
        });

        res.json({ success: true, data: faqs });
    } catch (err) {
        console.error('Error fetching FAQs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/faqs/categories
 * Returns distinct category names that have FAQs
 */
router.get('/categories', apiPublicCache(120), async (req, res) => {
    try {
        const rows = await readCache.getOrSet('faqs:categories', () =>
            db.query(
                `SELECT DISTINCT category_name FROM faqs WHERE status = 0 ORDER BY category_name`
            )
        );
        res.json({ success: true, data: rows.map(r => r.category_name) });
    } catch (err) {
        console.error('Error fetching FAQ categories:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/faqs/overrides
 * Returns list of page_slugs that have custom FAQ overrides (not NULL, not 'market')
 */
router.get('/overrides', apiPublicCache(120), async (req, res) => {
    try {
        const { category } = req.query;
        const rows = await readCache.getOrSet(`faqs:overrides:${category || 'all'}`, async () => {
            let sql = `SELECT DISTINCT page_slug, category_name FROM faqs WHERE page_slug IS NOT NULL AND page_slug != 'market' AND status = 0`;
            const params = [];
            if (category) {
                sql += ' AND category_name = ?';
                params.push(category);
            }
            sql += ' ORDER BY category_name, page_slug';
            return db.query(sql, params);
        });
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching FAQ overrides:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
