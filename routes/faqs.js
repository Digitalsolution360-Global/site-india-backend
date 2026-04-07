const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/faqs?category=...&page_slug=...
 *
 * Fetching logic:
 *   1. If page_slug is provided, look for FAQs matching category + page_slug
 *   2. If none found (or page_slug not provided), fall back to category defaults (page_slug IS NULL)
 *   3. If page_slug = 'market', only return market-page FAQs (no fallback)
 */
router.get('/', async (req, res) => {
    try {
        const { category, page_slug } = req.query;

        if (!category) {
            return res.status(400).json({ success: false, message: 'category is required' });
        }

        let faqs = [];

        if (page_slug === 'market') {
            // Market pages — only return market-specific FAQs
            faqs = await db.query(
                `SELECT id, category_name, page_slug, question, answer, sort_order
         FROM faqs
         WHERE category_name = ? AND page_slug = 'market' AND status = 0
         ORDER BY sort_order ASC`,
                [category]
            );
        } else if (page_slug) {
            // One round-trip: overrides + defaults; prefer rows matching page_slug
            const rows = await db.query(
                `SELECT id, category_name, page_slug, question, answer, sort_order
         FROM faqs
         WHERE category_name = ? AND status = 0
           AND (page_slug = ? OR page_slug IS NULL)
         ORDER BY CASE WHEN page_slug <=> ? THEN 0 ELSE 1 END, sort_order ASC`,
                [category, page_slug, page_slug]
            );
            const hasOverride = rows.some((r) => r.page_slug === page_slug);
            faqs = hasOverride
                ? rows.filter((r) => r.page_slug === page_slug)
                : rows.filter((r) => r.page_slug == null);
        } else {
            // No page_slug — return category defaults
            faqs = await db.query(
                `SELECT id, category_name, page_slug, question, answer, sort_order
         FROM faqs
         WHERE category_name = ? AND page_slug IS NULL AND status = 0
         ORDER BY sort_order ASC`,
                [category]
            );
        }

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
router.get('/categories', async (req, res) => {
    try {
        const rows = await db.query(
            `SELECT DISTINCT category_name FROM faqs WHERE status = 0 ORDER BY category_name`
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
router.get('/overrides', async (req, res) => {
    try {
        const { category } = req.query;
        let sql = `SELECT DISTINCT page_slug, category_name FROM faqs WHERE page_slug IS NOT NULL AND page_slug != 'market' AND status = 0`;
        const params = [];
        if (category) {
            sql += ' AND category_name = ?';
            params.push(category);
        }
        sql += ' ORDER BY category_name, page_slug';
        const rows = await db.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching FAQ overrides:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
