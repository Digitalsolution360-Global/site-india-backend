const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const XLSX = require('xlsx');
const { authMiddleware } = require('../middleware/auth');

const bulkUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
});

// All admin routes require auth
router.use(authMiddleware);

/* ═══════════════════════════════════════════════════════════════════
   TABLE CONFIGURATION
   ═══════════════════════════════════════════════════════════════════ */
const TABLE_CONFIG = {
    states: {
        displayName: 'States',
        primaryKey: 'state_id',
        columns: ['state_id', 'name', 'slug', 'image', 'descritpion', 'meta_title', 'meta_description', 'meta_keywords', 'navbar_status', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['name', 'slug'],
        listColumns: ['state_id', 'name', 'slug', 'navbar_status', 'status', 'created_at'],
        editable: ['name', 'slug', 'image', 'descritpion', 'meta_title', 'meta_description', 'meta_keywords', 'navbar_status', 'status'],
        icon: 'map',
    },
    citys: {
        displayName: 'Cities',
        primaryKey: 'city_id',
        columns: ['city_id', 'state_id', 'city', 'category_name', 'city_name', 'city_slug', 'city_description', 'image', 'yt_iframe_link', 'meta_title', 'meta_description', 'meta_keyword', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['city', 'city_name', 'city_slug', 'category_name'],
        listColumns: ['city_id', 'city', 'category_name', 'city_name', 'status', 'created_at'],
        editable: ['state_id', 'city', 'category_name', 'city_name', 'city_slug', 'city_description', 'image', 'yt_iframe_link', 'meta_title', 'meta_description', 'meta_keyword', 'status'],
        icon: 'building',
    },
    categories: {
        displayName: 'Categories',
        primaryKey: 'category_id',
        columns: ['category_id', 'name', 'slug', 'image', 'descritpion', 'meta_title', 'meta_description', 'meta_keywords', 'navbar_status', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['name', 'slug'],
        listColumns: ['category_id', 'name', 'slug', 'navbar_status', 'status', 'created_at'],
        editable: ['name', 'slug', 'image', 'descritpion', 'meta_title', 'meta_description', 'meta_keywords', 'navbar_status', 'status'],
        icon: 'tag',
    },
    posts: {
        displayName: 'Posts',
        primaryKey: 'post_id',
        columns: ['post_id', 'category_id', 'post_name', 'post_slug', 'post_description', 'image', 'yt_iframe_link', 'meta_title', 'meta_description', 'meta_keyword', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['post_name', 'post_slug'],
        listColumns: ['post_id', 'post_name', 'post_slug', 'category_id', 'status', 'created_at'],
        editable: ['category_id', 'post_name', 'post_slug', 'post_description', 'image', 'yt_iframe_link', 'meta_title', 'meta_description', 'meta_keyword', 'status'],
        icon: 'article',
    },
    contacts: {
        displayName: 'Contacts',
        primaryKey: 'id',
        columns: ['id', 'name', 'lastname', 'pageurl', 'email', 'number', 'message', 'created_at', 'updated_at'],
        searchable: ['name', 'email', 'number', 'message'],
        listColumns: ['id', 'name', 'email', 'number', 'pageurl', 'created_at'],
        editable: ['name', 'lastname', 'pageurl', 'email', 'number', 'message'],
        icon: 'mail',
    },
    careers: {
        displayName: 'Careers',
        primaryKey: 'id',
        columns: ['id', 'name', 'phone', 'email', 'apply_for', 'city', 'expected_salary', 'resume', 'created_at', 'updated_at'],
        searchable: ['name', 'email', 'phone', 'apply_for', 'city'],
        listColumns: ['id', 'name', 'email', 'phone', 'apply_for', 'city', 'created_at'],
        editable: ['name', 'phone', 'email', 'apply_for', 'city', 'expected_salary', 'resume'],
        icon: 'briefcase',
    },
    footercontacts: {
        displayName: 'Footer Contacts',
        primaryKey: 'id',
        columns: ['id', 'name', 'pageurl', 'email', 'phone', 'created_at', 'updated_at'],
        searchable: ['name', 'email', 'phone'],
        listColumns: ['id', 'name', 'email', 'phone', 'pageurl', 'created_at'],
        editable: ['name', 'pageurl', 'email', 'phone'],
        icon: 'footercontact',
    },
    landingcontacts: {
        displayName: 'Landing Contacts',
        primaryKey: 'id',
        columns: ['id', 'name', 'lastname', 'email', 'number', 'message', 'page_url', 'page_name', 'created_at', 'updated_at'],
        searchable: ['name', 'email', 'number', 'page_name'],
        listColumns: ['id', 'name', 'email', 'number', 'page_name', 'created_at'],
        editable: ['name', 'lastname', 'email', 'number', 'message', 'page_url', 'page_name'],
        icon: 'landing',
    },
    schedule_meetings: {
        displayName: 'Meetings',
        primaryKey: 'id',
        columns: ['id', 'name', 'service', 'pageurl', 'email', 'number', 'message', 'created_at', 'updated_at'],
        searchable: ['name', 'email', 'number', 'service'],
        listColumns: ['id', 'name', 'email', 'number', 'service', 'created_at'],
        editable: ['name', 'service', 'pageurl', 'email', 'number', 'message'],
        icon: 'calendar',
    },
    comments: {
        displayName: 'Comments',
        primaryKey: 'id',
        columns: ['id', 'post_id', 'user_id', 'name', 'email', 'comment_body', 'created_at', 'updated_at'],
        searchable: ['name', 'email', 'comment_body'],
        listColumns: ['id', 'post_id', 'name', 'email', 'comment_body', 'created_at'],
        editable: ['post_id', 'user_id', 'name', 'email', 'comment_body'],
        icon: 'comment',
    },
    metrocitys: {
        displayName: 'Metro Cities',
        primaryKey: 'metrocity_id',
        columns: ['metrocity_id', 'city_id', 'metrocity', 'category_name', 'metrocity_name', 'metrocity_slug', 'metrocity_description', 'image', 'yt_iframe_link', 'meta_title', 'meta_description', 'meta_keyword', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['metrocity', 'metrocity_name', 'metrocity_slug', 'category_name'],
        listColumns: ['metrocity_id', 'metrocity', 'category_name', 'metrocity_name', 'status', 'created_at'],
        editable: ['city_id', 'metrocity', 'category_name', 'metrocity_name', 'metrocity_slug', 'metrocity_description', 'image', 'yt_iframe_link', 'meta_title', 'meta_description', 'meta_keyword', 'status'],
        icon: 'metro',
    },
    faqs: {
        displayName: 'FAQs',
        primaryKey: 'id',
        columns: ['id', 'category_name', 'page_slug', 'question', 'answer', 'sort_order', 'status', 'created_at', 'updated_at'],
        searchable: ['category_name', 'page_slug', 'question', 'answer'],
        listColumns: ['id', 'category_name', 'page_slug', 'question', 'sort_order', 'status'],
        editable: ['category_name', 'page_slug', 'question', 'answer', 'sort_order', 'status'],
        icon: 'faq',
    },
    service_cards: {
        displayName: 'Service Cards',
        primaryKey: 'id',
        columns: ['id', 'category_name', 'page_slug', 'title', 'description', 'sort_order', 'status', 'created_at', 'updated_at'],
        searchable: ['category_name', 'page_slug', 'title', 'description'],
        listColumns: ['id', 'category_name', 'page_slug', 'title', 'sort_order', 'status'],
        editable: ['category_name', 'page_slug', 'title', 'description', 'sort_order', 'status'],
        icon: 'cards',
    },
    settings: {
        displayName: 'Settings',
        primaryKey: 'id',
        columns: ['id', 'website_name', 'logo', 'favicon', 'description', 'meta_title', 'meta_description', 'meta_keyword', 'created_at', 'updated_at'],
        searchable: ['website_name'],
        listColumns: ['id', 'website_name', 'logo', 'meta_title', 'created_at'],
        editable: ['website_name', 'logo', 'favicon', 'description', 'meta_title', 'meta_description', 'meta_keyword'],
        icon: 'settings',
    },
    users: {
        displayName: 'Users',
        primaryKey: 'id',
        columns: ['id', 'name', 'email', 'role_as', 'created_at', 'updated_at'],
        searchable: ['name', 'email'],
        listColumns: ['id', 'name', 'email', 'role_as', 'created_at'],
        editable: ['name', 'email', 'role_as'],
        icon: 'users',
    },
};

const BULK_UPLOAD_ALLOWED = new Set(['states', 'citys', 'metrocitys']);

const BULK_TEMPLATES = {
    states: {
        headers: [
            'name', 'slug', 'image', 'descritpion',
            'meta_title', 'meta_description', 'meta_keywords',
            'navbar_status', 'status'
        ],
        sample: {
            name: 'Uttar Pradesh',
            slug: 'uttar-pradesh',
            image: 'https://example.com/state.webp',
            descritpion: 'Digital services across Uttar Pradesh',
            meta_title: 'Digital Services in Uttar Pradesh',
            meta_description: 'Professional digital services across major cities in Uttar Pradesh.',
            meta_keywords: 'digital marketing uttar pradesh, seo uttar pradesh',
            navbar_status: '1',
            status: '1'
        }
    },
    citys: {
        headers: [
            'state_slug', 'city', 'category_name', 'city_name', 'city_slug',
            'city_description', 'image', 'yt_iframe_link',
            'meta_title', 'meta_description', 'meta_keyword', 'status'
        ],
        sample: {
            state_slug: 'uttar-pradesh',
            city: 'Noida',
            category_name: 'Digital Marketing',
            city_name: 'Best Digital Marketing Services in Noida',
            city_slug: 'digital-marketing-noida',
            city_description: 'Category focused digital marketing services in Noida.',
            image: 'https://example.com/noida.webp',
            yt_iframe_link: 'https://www.youtube.com/embed/xxxxxxxxxxx',
            meta_title: 'Digital Marketing in Noida',
            meta_description: 'Result-driven digital marketing services in Noida.',
            meta_keyword: 'digital marketing noida, seo noida',
            status: '1'
        }
    },
    metrocitys: {
        headers: [
            'city_slug', 'metrocity', 'category_name', 'metrocity_name', 'metrocity_slug',
            'metrocity_description', 'image', 'yt_iframe_link',
            'meta_title', 'meta_description', 'meta_keyword', 'status'
        ],
        sample: {
            city_slug: 'digital-marketing-noida',
            metrocity: 'Sector 62',
            category_name: 'Digital Marketing',
            metrocity_name: 'Digital Marketing Services in Sector 62 Noida',
            metrocity_slug: 'digital-marketing-sector-62-noida',
            metrocity_description: 'Local digital marketing services for Sector 62 businesses.',
            image: 'https://example.com/sector-62.webp',
            yt_iframe_link: 'https://www.youtube.com/embed/xxxxxxxxxxx',
            meta_title: 'Digital Marketing in Sector 62 Noida',
            meta_description: 'Targeted digital marketing services in Sector 62, Noida.',
            meta_keyword: 'digital marketing sector 62 noida',
            status: '1'
        }
    }
};

function toText(val) {
    if (val === undefined || val === null) return '';
    return String(val).trim();
}

function toFlag(val, fallback = 1) {
    const v = toText(val).toLowerCase();
    if (v === '') return fallback;
    if (['1', 'true', 'yes', 'active'].includes(v)) return 1;
    if (['0', 'false', 'no', 'inactive'].includes(v)) return 0;
    return fallback;
}

function csvEscape(value) {
    const v = String(value ?? '');
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
}

function buildTemplateCsv(table) {
    const template = BULK_TEMPLATES[table];
    if (!template) return null;
    const headerRow = template.headers.join(',');
    const sampleRow = template.headers.map((h) => csvEscape(template.sample[h] || '')).join(',');
    return `${headerRow}\n${sampleRow}\n`;
}

function normalizeKeys(row) {
    const out = {};
    Object.entries(row || {}).forEach(([k, v]) => {
        out[String(k || '').trim().toLowerCase()] = v;
    });
    return out;
}

function buildInsertQuery(table, payload) {
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    return {
        sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
        values: cols.map((c) => payload[c]),
    };
}

function buildUpdateQuery(table, payload, whereClause, whereValues) {
    const cols = Object.keys(payload);
    const setClause = cols.map((c) => `${c} = ?`).join(', ');
    return {
        sql: `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`,
        values: [...cols.map((c) => payload[c]), ...whereValues],
    };
}

async function processStateRow(rawRow, rowNumber, mode, dryRun, userId) {
    const row = normalizeKeys(rawRow);
    const name = toText(row.name);
    const slug = toText(row.slug);

    if (!name || !slug) {
        return { ok: false, rowNumber, message: 'name and slug are required.' };
    }

    const existing = await db.query('SELECT state_id FROM states WHERE slug = ? LIMIT 1', [slug]);
    const now = new Date();

    const payload = {
        name,
        slug,
        image: toText(row.image),
        descritpion: toText(row.descritpion || row.description),
        meta_title: toText(row.meta_title),
        meta_description: toText(row.meta_description),
        meta_keywords: toText(row.meta_keywords),
        navbar_status: toFlag(row.navbar_status, 1),
        status: toFlag(row.status, 1),
        updated_at: now,
    };

    if (!existing.length) {
        const insertPayload = { ...payload, created_at: now, created_by: String(userId) };
        if (!dryRun) {
            const q = buildInsertQuery('states', insertPayload);
            await db.query(q.sql, q.values);
        }
        return { ok: true, rowNumber, action: 'inserted', key: slug };
    }

    if (mode === 'insert') {
        return { ok: false, rowNumber, message: `state already exists for slug: ${slug}` };
    }

    if (!dryRun) {
        const q = buildUpdateQuery('states', payload, 'state_id = ?', [existing[0].state_id]);
        await db.query(q.sql, q.values);
    }
    return { ok: true, rowNumber, action: 'updated', key: slug };
}

async function processCityRow(rawRow, rowNumber, mode, dryRun, userId, stateMap) {
    const row = normalizeKeys(rawRow);
    const stateSlug = toText(row.state_slug);
    const city = toText(row.city);
    const categoryName = toText(row.category_name);
    const cityName = toText(row.city_name);
    const citySlug = toText(row.city_slug);

    if (!stateSlug || !city || !categoryName || !cityName || !citySlug) {
        return {
            ok: false,
            rowNumber,
            message: 'state_slug, city, category_name, city_name, and city_slug are required.'
        };
    }

    const stateId = stateMap.get(stateSlug);
    if (!stateId) {
        return { ok: false, rowNumber, message: `invalid state_slug: ${stateSlug}` };
    }

    const existing = await db.query(
        'SELECT city_id FROM citys WHERE city_slug = ? AND category_name = ? LIMIT 1',
        [citySlug, categoryName]
    );

    const now = new Date();
    const payload = {
        state_id: stateId,
        city,
        category_name: categoryName,
        city_name: cityName,
        city_slug: citySlug,
        city_description: toText(row.city_description),
        image: toText(row.image),
        yt_iframe_link: toText(row.yt_iframe_link),
        meta_title: toText(row.meta_title),
        meta_description: toText(row.meta_description),
        meta_keyword: toText(row.meta_keyword),
        status: toFlag(row.status, 1),
        updated_at: now,
    };

    if (!existing.length) {
        const insertPayload = { ...payload, created_at: now, created_by: String(userId) };
        if (!dryRun) {
            const q = buildInsertQuery('citys', insertPayload);
            await db.query(q.sql, q.values);
        }
        return { ok: true, rowNumber, action: 'inserted', key: citySlug };
    }

    if (mode === 'insert') {
        return { ok: false, rowNumber, message: `city already exists for city_slug + category_name: ${citySlug} / ${categoryName}` };
    }

    if (!dryRun) {
        const q = buildUpdateQuery('citys', payload, 'city_id = ?', [existing[0].city_id]);
        await db.query(q.sql, q.values);
    }
    return { ok: true, rowNumber, action: 'updated', key: citySlug };
}

async function processMetroCityRow(rawRow, rowNumber, mode, dryRun, userId, cityMap) {
    const row = normalizeKeys(rawRow);
    const citySlug = toText(row.city_slug);
    const metrocity = toText(row.metrocity);
    const categoryName = toText(row.category_name);
    const metrocityName = toText(row.metrocity_name);
    const metrocitySlug = toText(row.metrocity_slug);

    if (!citySlug || !metrocity || !categoryName || !metrocityName || !metrocitySlug) {
        return {
            ok: false,
            rowNumber,
            message: 'city_slug, metrocity, category_name, metrocity_name, and metrocity_slug are required.'
        };
    }

    const cityId = cityMap.get(citySlug);
    if (!cityId) {
        return { ok: false, rowNumber, message: `invalid city_slug: ${citySlug}` };
    }

    const existing = await db.query(
        'SELECT metrocity_id FROM metrocitys WHERE metrocity_slug = ? AND category_name = ? LIMIT 1',
        [metrocitySlug, categoryName]
    );

    const now = new Date();
    const payload = {
        city_id: cityId,
        metrocity,
        category_name: categoryName,
        metrocity_name: metrocityName,
        metrocity_slug: metrocitySlug,
        metrocity_description: toText(row.metrocity_description),
        image: toText(row.image),
        yt_iframe_link: toText(row.yt_iframe_link),
        meta_title: toText(row.meta_title),
        meta_description: toText(row.meta_description),
        meta_keyword: toText(row.meta_keyword),
        status: toFlag(row.status, 1),
        updated_at: now,
    };

    if (!existing.length) {
        const insertPayload = { ...payload, created_at: now, created_by: String(userId) };
        if (!dryRun) {
            const q = buildInsertQuery('metrocitys', insertPayload);
            await db.query(q.sql, q.values);
        }
        return { ok: true, rowNumber, action: 'inserted', key: metrocitySlug };
    }

    if (mode === 'insert') {
        return { ok: false, rowNumber, message: `metro city already exists for metrocity_slug + category_name: ${metrocitySlug} / ${categoryName}` };
    }

    if (!dryRun) {
        const q = buildUpdateQuery('metrocitys', payload, 'metrocity_id = ?', [existing[0].metrocity_id]);
        await db.query(q.sql, q.values);
    }
    return { ok: true, rowNumber, action: 'updated', key: metrocitySlug };
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD ANALYTICS
   ═══════════════════════════════════════════════════════════════════ */
router.get('/dashboard', async (req, res) => {
    try {
        // Total counts
        const tables = ['states', 'citys', 'categories', 'posts', 'contacts', 'careers', 'footercontacts', 'landingcontacts', 'schedule_meetings', 'comments', 'metrocitys', 'faqs', 'service_cards', 'users'];
        const counts = {};
        for (const t of tables) {
            const result = await db.query(`SELECT COUNT(*) as count FROM ${t}`);
            counts[t] = result[0].count;
        }

        // Cities by category
        const citiesByCategory = await db.query(
            'SELECT category_name, COUNT(*) as count FROM citys GROUP BY category_name ORDER BY count DESC'
        );

        // Cities by state (top 15)
        const citiesByState = await db.query(
            `SELECT s.name as state_name, COUNT(c.city_id) as count
             FROM citys c JOIN states s ON c.state_id = s.state_id
             GROUP BY s.name ORDER BY count DESC LIMIT 15`
        );

        // Contacts over last 12 months
        const contactsOverTime = await db.query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
             FROM contacts WHERE created_at IS NOT NULL
             GROUP BY month ORDER BY month DESC LIMIT 12`
        );

        // Career applications over last 12 months
        const careersOverTime = await db.query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
             FROM careers WHERE created_at IS NOT NULL
             GROUP BY month ORDER BY month DESC LIMIT 12`
        );

        // Recent contacts (last 10)
        const recentContacts = await db.query(
            'SELECT id, name, email, number, pageurl, created_at FROM contacts ORDER BY created_at DESC LIMIT 10'
        );

        // Recent career applications (last 10)
        const recentCareers = await db.query(
            'SELECT id, name, email, phone, apply_for, city, created_at FROM careers ORDER BY created_at DESC LIMIT 10'
        );

        // Posts by category
        const postsByCategory = await db.query(
            `SELECT cat.name as category_name, COUNT(p.post_id) as count
             FROM posts p JOIN categories cat ON p.category_id = cat.category_id
             GROUP BY cat.name ORDER BY count DESC`
        );

        // Metro cities by category
        const metroCitiesByCategory = await db.query(
            'SELECT category_name, COUNT(*) as count FROM metrocitys GROUP BY category_name ORDER BY count DESC'
        );

        res.json({
            success: true,
            data: {
                counts,
                citiesByCategory,
                citiesByState,
                contactsOverTime: contactsOverTime.reverse(),
                careersOverTime: careersOverTime.reverse(),
                recentContacts,
                recentCareers,
                postsByCategory,
                metroCitiesByCategory
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
    }
});

/* ═══════════════════════════════════════════════════════════════════
   TABLE METADATA
   ═══════════════════════════════════════════════════════════════════ */
router.get('/tables', (req, res) => {
    const tables = Object.entries(TABLE_CONFIG).map(([key, cfg]) => ({
        key,
        displayName: cfg.displayName,
        icon: cfg.icon,
        primaryKey: cfg.primaryKey,
        listColumns: cfg.listColumns,
        editable: cfg.editable,
        searchable: cfg.searchable,
    }));
    res.json({ success: true, data: tables });
});

/* ═══════════════════════════════════════════════════════════════════
   BULK UPLOAD (states, citys, metrocitys)
   ═══════════════════════════════════════════════════════════════════ */

router.get('/bulk-upload/template/:table', async (req, res) => {
    const table = req.params.table;
    if (!BULK_UPLOAD_ALLOWED.has(table)) {
        return res.status(400).json({ success: false, message: 'Bulk upload not enabled for this table.' });
    }

    const csv = buildTemplateCsv(table);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${table}-bulk-template.csv"`);
    return res.send(csv);
});

router.post('/bulk-upload/:table', bulkUpload.single('file'), async (req, res) => {
    const table = req.params.table;
    if (!BULK_UPLOAD_ALLOWED.has(table)) {
        return res.status(400).json({ success: false, message: 'Bulk upload not enabled for this table.' });
    }

    if (!req.file?.buffer) {
        return res.status(400).json({ success: false, message: 'Please upload a CSV or XLSX file in the file field.' });
    }

    const mode = req.body.mode === 'insert' ? 'insert' : 'upsert';
    const dryRun = ['1', 'true', 'yes'].includes(String(req.body.dryRun || '').toLowerCase());

    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
            return res.status(400).json({ success: false, message: 'File is empty.' });
        }

        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
            defval: '',
            raw: false,
        });

        if (!rows.length) {
            return res.status(400).json({ success: false, message: 'No rows found. Please add at least one data row.' });
        }

        if (rows.length > 2000) {
            return res.status(400).json({ success: false, message: 'Maximum 2000 rows allowed per upload.' });
        }

        const stateRows = table === 'citys'
            ? await db.query('SELECT state_id, slug FROM states')
            : [];
        const stateMap = new Map(stateRows.map((s) => [toText(s.slug), Number(s.state_id)]));

        const cityRows = table === 'metrocitys'
            ? await db.query('SELECT city_id, city_slug FROM citys')
            : [];
        const cityMap = new Map(cityRows.map((c) => [toText(c.city_slug), Number(c.city_id)]));

        const summary = {
            totalRows: rows.length,
            inserted: 0,
            updated: 0,
            failed: 0,
        };
        const failures = [];

        for (let i = 0; i < rows.length; i++) {
            const rowNumber = i + 2;
            let result;

            if (table === 'states') {
                result = await processStateRow(rows[i], rowNumber, mode, dryRun, req.user.id);
            } else if (table === 'citys') {
                result = await processCityRow(rows[i], rowNumber, mode, dryRun, req.user.id, stateMap);
            } else {
                result = await processMetroCityRow(rows[i], rowNumber, mode, dryRun, req.user.id, cityMap);
            }

            if (!result.ok) {
                summary.failed += 1;
                failures.push({ rowNumber, message: result.message });
                continue;
            }

            if (result.action === 'inserted') summary.inserted += 1;
            if (result.action === 'updated') summary.updated += 1;
        }

        return res.json({
            success: true,
            message: dryRun
                ? 'Validation completed. No database changes made.'
                : 'Bulk upload completed.',
            data: {
                mode,
                dryRun,
                summary,
                failures: failures.slice(0, 300),
                hasMoreFailures: failures.length > 300,
            }
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        return res.status(500).json({ success: false, message: 'Bulk upload failed. Please check file format and data.' });
    }
});

/* ═══════════════════════════════════════════════════════════════════
   GENERIC CRUD
   ═══════════════════════════════════════════════════════════════════ */

// GET /api/admin/:table — paginated list
router.get('/:table', async (req, res) => {
    const config = TABLE_CONFIG[req.params.table];
    if (!config) return res.status(404).json({ success: false, message: 'Table not found.' });

    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const sortBy = config.columns.includes(req.query.sortBy) ? req.query.sortBy : config.primaryKey;
        const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

        let whereClause = '';
        let params = [];

        if (search && config.searchable.length) {
            const conditions = config.searchable.map(col => `${col} LIKE ?`);
            whereClause = `WHERE ${conditions.join(' OR ')}`;
            params = config.searchable.map(() => `%${search}%`);
        }

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM ${req.params.table} ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        const columns = config.listColumns.join(', ');
        const rows = await db.query(
            `SELECT ${columns} FROM ${req.params.table} ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [...params, String(limit), String(offset)]
        );

        res.json({
            success: true,
            data: rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error(`List ${req.params.table} error:`, error);
        res.status(500).json({ success: false, message: 'Failed to fetch records.' });
    }
});

// GET /api/admin/:table/:id — single record (all columns)
router.get('/:table/:id', async (req, res) => {
    const config = TABLE_CONFIG[req.params.table];
    if (!config) return res.status(404).json({ success: false, message: 'Table not found.' });

    try {
        const rows = await db.query(
            `SELECT * FROM ${req.params.table} WHERE ${config.primaryKey} = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(`Get ${req.params.table} error:`, error);
        res.status(500).json({ success: false, message: 'Failed to fetch record.' });
    }
});

// POST /api/admin/:table — create
router.post('/:table', async (req, res) => {
    const config = TABLE_CONFIG[req.params.table];
    if (!config) return res.status(404).json({ success: false, message: 'Table not found.' });

    try {
        const fields = config.editable.filter(col => req.body[col] !== undefined);
        if (!fields.length) return res.status(400).json({ success: false, message: 'No valid fields provided.' });

        // Add created_at/updated_at if the table has them
        const allFields = [...fields];
        const allValues = fields.map(f => req.body[f]);

        if (config.columns.includes('created_at')) {
            allFields.push('created_at');
            allValues.push(new Date());
        }
        if (config.columns.includes('updated_at')) {
            allFields.push('updated_at');
            allValues.push(new Date());
        }
        if (config.columns.includes('created_by') && !fields.includes('created_by')) {
            allFields.push('created_by');
            allValues.push(String(req.user.id));
        }

        const placeholders = allFields.map(() => '?').join(', ');
        const result = await db.query(
            `INSERT INTO ${req.params.table} (${allFields.join(', ')}) VALUES (${placeholders})`,
            allValues
        );

        res.status(201).json({ success: true, message: 'Record created.', id: result.insertId });
    } catch (error) {
        console.error(`Create ${req.params.table} error:`, error);
        res.status(500).json({ success: false, message: 'Failed to create record.' });
    }
});

// PUT /api/admin/:table/:id — update
router.put('/:table/:id', async (req, res) => {
    const config = TABLE_CONFIG[req.params.table];
    if (!config) return res.status(404).json({ success: false, message: 'Table not found.' });

    try {
        const fields = config.editable.filter(col => req.body[col] !== undefined);
        if (!fields.length) return res.status(400).json({ success: false, message: 'No valid fields provided.' });

        const allFields = [...fields];
        const allValues = fields.map(f => req.body[f]);

        if (config.columns.includes('updated_at')) {
            allFields.push('updated_at');
            allValues.push(new Date());
        }

        const setClause = allFields.map(f => `${f} = ?`).join(', ');
        allValues.push(req.params.id);

        await db.query(
            `UPDATE ${req.params.table} SET ${setClause} WHERE ${config.primaryKey} = ?`,
            allValues
        );

        res.json({ success: true, message: 'Record updated.' });
    } catch (error) {
        console.error(`Update ${req.params.table} error:`, error);
        res.status(500).json({ success: false, message: 'Failed to update record.' });
    }
});

// DELETE /api/admin/:table/:id — delete
router.delete('/:table/:id', async (req, res) => {
    const config = TABLE_CONFIG[req.params.table];
    if (!config) return res.status(404).json({ success: false, message: 'Table not found.' });

    try {
        await db.query(
            `DELETE FROM ${req.params.table} WHERE ${config.primaryKey} = ?`,
            [req.params.id]
        );
        res.json({ success: true, message: 'Record deleted.' });
    } catch (error) {
        console.error(`Delete ${req.params.table} error:`, error);
        res.status(500).json({ success: false, message: 'Failed to delete record.' });
    }
});

module.exports = router;
