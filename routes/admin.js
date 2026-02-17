const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

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
    global_countries: {
        displayName: 'Global Countries',
        primaryKey: 'id',
        columns: ['id', 'name', 'web_slug', 'digital_slug', 'gmb_slug', 'content_slug', 'seo_slug', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['name'],
        listColumns: ['id', 'name', 'status', 'created_at'],
        editable: ['name', 'web_slug', 'digital_slug', 'gmb_slug', 'content_slug', 'seo_slug', 'status'],
        icon: 'globe',
    },
    global_states: {
        displayName: 'Global States',
        primaryKey: 'state_id',
        columns: ['state_id', 'country_id', 'name', 'web_slug', 'digital_slug', 'gmb_slug', 'content_slug', 'seo_slug', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['name'],
        listColumns: ['state_id', 'country_id', 'name', 'status', 'created_at'],
        editable: ['country_id', 'name', 'web_slug', 'digital_slug', 'gmb_slug', 'content_slug', 'seo_slug', 'status'],
        icon: 'globalstate',
    },
    global_cities: {
        displayName: 'Global Cities',
        primaryKey: 'city_id',
        columns: ['city_id', 'state_id', 'city', 'web_slug', 'digital_slug', 'gmb_slug', 'content_slug', 'seo_slug', 'status', 'created_by', 'created_at', 'updated_at'],
        searchable: ['city'],
        listColumns: ['city_id', 'state_id', 'city', 'status', 'created_at'],
        editable: ['state_id', 'city', 'web_slug', 'digital_slug', 'gmb_slug', 'content_slug', 'seo_slug', 'status'],
        icon: 'globalcity',
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

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD ANALYTICS
   ═══════════════════════════════════════════════════════════════════ */
router.get('/dashboard', async (req, res) => {
    try {
        // Total counts
        const tables = ['states', 'citys', 'categories', 'posts', 'contacts', 'careers', 'footercontacts', 'landingcontacts', 'schedule_meetings', 'comments', 'metrocitys', 'users'];
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
