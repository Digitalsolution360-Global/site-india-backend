const mysql = require('mysql2/promise');
const { cached, invalidateAll: invalidateReadCache } = require('./utils/memoryCache');

let pool = null;

function createPool() {
  const connectionLimit = Math.min(
    50,
    Math.max(1, parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10))
  );
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit, // override with DB_CONNECTION_LIMIT (use 3–5 for strict serverless)
    queueLimit: 0,
    connectTimeout: 30000,   // 30 s TCP connect timeout
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

async function query(sql, params = []) {
  let attempts = 0;
  while (attempts < 2) {
    try {
      const [results] = await getPool().execute(sql, params);
      return results;
    } catch (error) {
      attempts++;
      // On a stale-pool / timeout error, destroy the pool and retry once
      if (
        attempts < 2 &&
        (error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNRESET' ||
          error.code === 'PROTOCOL_CONNECTION_LOST')
      ) {
        console.warn('DB connection error, resetting pool and retrying…', error.code);
        try { await pool.end(); } catch (_) {}
        pool = createPool();
        continue;
      }
      console.error('Database query error:', error);
      throw error;
    }
  }
}

// ─── Category Mapping ────────────────────────────────────────────
// Maps frontend route categories to DB category_name values
const CATEGORY_MAP = {
  'gmb': 'Google Business',
  'seo': 'Digital Marketing',
  'web': 'Web Development',
  'marketing': 'Digital Marketing',
  'social-media': 'Social Media',
  'content-writing': 'Content Writing',
  'wordpress': 'Wordpress Development'
};

function resolveCategory(category) {
  return CATEGORY_MAP[category] || category;
}

// ─── State Queries ───────────────────────────────────────────────

async function getAllStates() {
  return cached('read:states:all', async () => {
    const sql = `
    SELECT state_id, name, slug, image, descritpion AS description,
           meta_title, meta_description, meta_keywords, navbar_status
    FROM states
    ORDER BY name ASC
  `;
    return await query(sql);
  });
}

async function getStateBySlug(slug) {
  const sql = `
    SELECT state_id, name, slug, image, descritpion AS description,
           meta_title, meta_description, meta_keywords, navbar_status
    FROM states
    WHERE slug = ?
  `;
  const results = await query(sql, [slug]);
  return results[0] || null;
}

async function getStateById(stateId) {
  const sql = `
    SELECT state_id, name, slug, image, descritpion AS description,
           meta_title, meta_description, meta_keywords
    FROM states
    WHERE state_id = ?
  `;
  const results = await query(sql, [stateId]);
  return results[0] || null;
}

// ─── City Queries ────────────────────────────────────────────────

async function getCitiesByStateAndCategory(stateId, category) {
  const categoryName = resolveCategory(category);
  const sql = `
    SELECT city_id, state_id, city, category_name, city_name, city_slug,
           city_description, image, yt_iframe_link,
           meta_title, meta_description, meta_keyword
    FROM citys
    WHERE state_id = ? AND category_name = ?
    ORDER BY city ASC
  `;
  return await query(sql, [stateId, categoryName]);
}

/** One round-trip: state row + cities for that state/category (LEFT JOIN). */
async function getStateWithCitiesBySlugAndCategory(slug, category) {
  return cached(`read:state:citiescat:${slug}:${category}`, async () => {
  const categoryName = resolveCategory(category);
  const sql = `
    SELECT
      s.state_id, s.name, s.slug, s.image, s.descritpion AS description,
      s.meta_title, s.meta_description, s.meta_keywords, s.navbar_status,
      c.city_id, c.city, c.category_name, c.city_name, c.city_slug,
      c.city_description, c.image AS city_image, c.yt_iframe_link,
      c.meta_title AS c_meta_title, c.meta_description AS c_meta_description, c.meta_keyword AS c_meta_keyword
    FROM states s
    LEFT JOIN citys c ON s.state_id = c.state_id AND c.category_name = ?
    WHERE s.slug = ?
    ORDER BY c.city ASC
  `;
  const rows = await query(sql, [categoryName, slug]);
  if (!rows.length) {
    return { state: null, cities: [] };
  }
  const r0 = rows[0];
  const state = {
    state_id: r0.state_id,
    name: r0.name,
    slug: r0.slug,
    image: r0.image,
    description: r0.description,
    meta_title: r0.meta_title,
    meta_description: r0.meta_description,
    meta_keywords: r0.meta_keywords,
    navbar_status: r0.navbar_status,
  };
  const cities = rows
    .filter((row) => row.city_id != null)
    .map((row) => ({
      city_id: row.city_id,
      state_id: r0.state_id,
      city: row.city,
      category_name: row.category_name,
      city_name: row.city_name,
      city_slug: row.city_slug,
      city_description: row.city_description,
      image: row.city_image,
      yt_iframe_link: row.yt_iframe_link,
      meta_title: row.c_meta_title,
      meta_description: row.c_meta_description,
      meta_keyword: row.c_meta_keyword,
    }));
  return { state, cities };
  });
}

/** One round-trip: state + cities grouped by category (same shape as getAllCitiesByState). */
async function getStateWithGroupedCitiesBySlug(slug) {
  return cached(`read:state:allcats:${slug}`, async () => {
  const sql = `
    SELECT s.state_id, s.name, s.slug, s.image, s.descritpion AS description,
           s.meta_title, s.meta_description, s.meta_keywords, s.navbar_status,
           c.city_id, c.city, c.city_slug, c.category_name
    FROM states s
    LEFT JOIN citys c ON s.state_id = c.state_id
    WHERE s.slug = ?
    ORDER BY c.category_name ASC, c.city ASC
  `;
  const rows = await query(sql, [slug]);
  if (!rows.length) {
    return { state: null, categories: {} };
  }
  const r0 = rows[0];
  const state = {
    state_id: r0.state_id,
    name: r0.name,
    slug: r0.slug,
    image: r0.image,
    description: r0.description,
    meta_title: r0.meta_title,
    meta_description: r0.meta_description,
    meta_keywords: r0.meta_keywords,
    navbar_status: r0.navbar_status,
  };
  const grouped = {};
  rows
    .filter((row) => row.city_id != null)
    .forEach((row) => {
      if (!grouped[row.category_name]) grouped[row.category_name] = [];
      grouped[row.category_name].push({
        name: row.city,
        slug: row.city_slug,
      });
    });
  Object.keys(grouped).forEach((cat) => {
    const seen = new Set();
    grouped[cat] = grouped[cat]
      .filter((c) => {
        if (seen.has(c.slug)) return false;
        seen.add(c.slug);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  return { state, categories: grouped };
  });
}

async function getCityBySlug(citySlug) {
  const sql = `
    SELECT c.city_id, c.state_id, c.city, c.category_name, c.city_name, c.city_slug,
           c.city_description, c.image, c.yt_iframe_link,
           c.meta_title, c.meta_description, c.meta_keyword,
           s.name AS state_name, s.slug AS state_slug
    FROM citys c
    JOIN states s ON c.state_id = s.state_id
    WHERE c.city_slug = ?
  `;
  const results = await query(sql, [citySlug]);
  return results[0] || null;
}

async function getCityBySlugAndCategory(citySlug, category) {
  const categoryName = resolveCategory(category);
  const sql = `
    SELECT c.city_id, c.state_id, c.city, c.category_name, c.city_name, c.city_slug,
           c.city_description, c.image, c.yt_iframe_link,
           c.meta_title, c.meta_description, c.meta_keyword,
           s.name AS state_name, s.slug AS state_slug
    FROM citys c
    JOIN states s ON c.state_id = s.state_id
    WHERE c.city_slug = ? AND c.category_name = ?
  `;
  const results = await query(sql, [citySlug, categoryName]);
  return results[0] || null;
}

// ─── Market (States + Cities grouped) ────────────────────────────

async function getStatesWithCitiesByCategory(category) {
  return cached(`read:market:states-cities:${category}`, async () => {
  const categoryName = resolveCategory(category);

  const statesSql = `
    SELECT DISTINCT s.state_id, s.name, s.slug, s.image,
           s.descritpion AS description
    FROM states s
    INNER JOIN citys c ON s.state_id = c.state_id
    WHERE c.category_name = ?
    ORDER BY s.name ASC
  `;
  const citiesSql = `
    SELECT city_id, state_id, city, city_slug
    FROM citys
    WHERE category_name = ?
    ORDER BY city ASC
  `;
  const [states, allCities] = await Promise.all([
    query(statesSql, [categoryName]),
    query(citiesSql, [categoryName]),
  ]);

  const cityMap = {};
  allCities.forEach(city => {
    if (!cityMap[city.state_id]) {
      cityMap[city.state_id] = [];
    }
    cityMap[city.state_id].push({
      name: city.city,
      slug: city.city_slug
    });
  });

  // Sort each state's city list alphabetically
  Object.keys(cityMap).forEach(stateId => {
    cityMap[stateId].sort((a, b) => a.name.localeCompare(b.name));
  }); 

  return states.map(state => ({
    name: state.name,
    slug: state.slug,
    image: state.image,
    description: state.description,
    cities: cityMap[state.state_id] || []
  }));
  });
}

// ─── All cities for a category (flat) ────────────────────────────

async function getAllCitiesByCategory(category) {
  return cached(`read:market:cities-flat:${category}`, async () => {
  const categoryName = resolveCategory(category);
  const sql = `
    SELECT c.city_id, c.city, c.city_slug, c.city_name, c.city_description, c.image,
           s.name AS state_name, s.slug AS state_slug
    FROM citys c
    JOIN states s ON c.state_id = s.state_id
    WHERE c.category_name = ?
    ORDER BY s.name ASC, c.city ASC
  `;
  return await query(sql, [categoryName]);
  });
}

async function getAvailableCategories() {
  return cached('read:categories:from-citys', async () => {
  const sql = `
    SELECT DISTINCT category_name, COUNT(*) as city_count
    FROM citys
    GROUP BY category_name
    ORDER BY category_name ASC
  `;
  return await query(sql);
  });
}

// ─── Metro City Queries ──────────────────────────────────────────

async function getMetroCityBySlug(slug) {
  const sql = `
    SELECT m.metrocity_id, m.city_id, m.metrocity, m.category_name,
           m.metrocity_name, m.metrocity_slug, m.metrocity_description,
           m.image, m.yt_iframe_link,
           m.meta_title, m.meta_description, m.meta_keyword,
           c.city AS parent_city, c.city_slug AS parent_city_slug,
           c.state_id, s.name AS state_name, s.slug AS state_slug
    FROM metrocitys m
    JOIN citys c ON m.city_id = c.city_id
    JOIN states s ON c.state_id = s.state_id
    WHERE m.metrocity_slug = ?
    LIMIT 1
  `;
  const results = await query(sql, [slug]);
  return results[0] || null;
}

async function getMetroCitiesByCityId(cityId, category) {
  const categoryName = resolveCategory(category);
  const sql = `
    SELECT metrocity_id, city_id, metrocity, category_name,
           metrocity_name, metrocity_slug
    FROM metrocitys
    WHERE city_id = ? AND category_name = ?
    ORDER BY metrocity ASC
  `;
  return await query(sql, [cityId, categoryName]);
}

async function getAllMetroCitiesByCategory(category) {
  return cached(`read:market:metros-flat:${category}`, async () => {
  const categoryName = resolveCategory(category);
  const sql = `
    SELECT m.metrocity_id, m.metrocity, m.metrocity_slug, m.metrocity_name,
           c.city AS parent_city, c.city_slug AS parent_city_slug,
           s.name AS state_name, s.slug AS state_slug
    FROM metrocitys m
    JOIN citys c ON m.city_id = c.city_id
    JOIN states s ON c.state_id = s.state_id
    WHERE m.category_name = ?
    ORDER BY s.name ASC, c.city ASC, m.metrocity ASC
  `;
  return await query(sql, [categoryName]);
  });
}

// ─── Search Dropdown Data ────────────────────────────────────────

async function getSearchDropdownData() {
  return cached('read:search:dropdown', async () => {
  const servicesSql = `SELECT DISTINCT category_name FROM citys ORDER BY category_name ASC`;
  const statesSql = `SELECT DISTINCT s.state_id, s.name, s.slug FROM states s INNER JOIN citys c ON s.state_id = c.state_id ORDER BY s.name ASC`;
  const [services, states] = await Promise.all([
    query(servicesSql),
    query(statesSql)
  ]);
  return { services, states };
  });
}

async function getCitiesByStateId(stateId) {
  const sid = parseInt(stateId, 10);
  if (Number.isNaN(sid)) {
    return [];
  }
  return cached(`read:search:cities-by-state:${sid}`, async () => {
  const sql = `
    SELECT DISTINCT city, city_slug, category_name
    FROM citys
    WHERE state_id = ?
    ORDER BY city ASC
  `;
  return await query(sql, [sid]);
  });
}

// ─── All cities + metro cities for a state, grouped by category ──

async function getAllCitiesByState(stateId) {
  const citiesSql = `
    SELECT c.city_id, c.city, c.city_slug, c.category_name
    FROM citys c
    WHERE c.state_id = ?
    ORDER BY c.category_name ASC, c.city ASC
  `;
  const cities = await query(citiesSql, [stateId]);

  const grouped = {};
  cities.forEach(row => {
    if (!grouped[row.category_name]) grouped[row.category_name] = [];
    grouped[row.category_name].push({
      name: row.city,
      slug: row.city_slug
    });
  });

  // Sort cities within each category and deduplicate
  Object.keys(grouped).forEach(cat => {
    const seen = new Set();
    grouped[cat] = grouped[cat]
      .filter(c => { if (seen.has(c.slug)) return false; seen.add(c.slug); return true; })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}

// ─── Posts / Blog Functions ───────────────────────────────────────
async function getAllPosts(page = 1, limit = 12, categoryId = null) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (page - 1) * limit;

  // LIMIT/OFFSET as prepared params trigger ER_WRONG_ARGUMENTS on many MySQL builds; inline safe ints.
  const lim = limit;
  const off = offset;

  let sql, params;

  if (categoryId != null && categoryId !== '') {
    const cid = parseInt(categoryId, 10);
    if (Number.isNaN(cid)) {
      return [];
    }
    sql = `
      SELECT p.post_id, p.category_id, p.post_name, p.post_slug,
             LEFT(COALESCE(p.post_description, ''), 800) AS post_description,
             p.image, p.yt_iframe_link, p.meta_title, p.meta_description, p.meta_keyword,
             p.status, p.created_by, p.created_at, p.updated_at,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.status = 0 AND p.category_id = ?
      ORDER BY p.created_at DESC
      LIMIT ${lim} OFFSET ${off}
    `;
    params = [cid];
  } else {
    sql = `
      SELECT p.post_id, p.category_id, p.post_name, p.post_slug,
             LEFT(COALESCE(p.post_description, ''), 800) AS post_description,
             p.image, p.yt_iframe_link, p.meta_title, p.meta_description, p.meta_keyword,
             p.status, p.created_by, p.created_at, p.updated_at,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.status = 0
      ORDER BY p.created_at DESC
      LIMIT ${lim} OFFSET ${off}
    `;
    params = [];
  }

  return await query(sql, params);
}

async function getPostsCount(categoryId = null) {
  let sql, params;
  if (categoryId) {
    sql = 'SELECT COUNT(*) as total FROM posts WHERE status = 0 AND category_id = ?';
    params = [categoryId];
  } else {
    sql = 'SELECT COUNT(*) as total FROM posts WHERE status = 0';
    params = [];
  }
  const rows = await query(sql, params);
  return rows[0].total;
}

async function getPostBySlug(slug) {
  const sql = `SELECT p.*, c.name as category_name, c.slug as category_slug
               FROM posts p LEFT JOIN categories c ON p.category_id = c.category_id
               WHERE p.post_slug = ? AND p.status = 0 LIMIT 1`;
  const rows = await query(sql, [slug]);
  return rows.length > 0 ? rows[0] : null;
}

async function getRelatedPosts(categoryId, excludePostId, limit = 3) {
  const n = Math.min(50, Math.max(1, parseInt(limit, 10) || 3));
  const sql = `SELECT p.post_id, p.category_id, p.post_name, p.post_slug,
               LEFT(COALESCE(p.post_description, ''), 800) AS post_description,
               p.image, p.yt_iframe_link, p.meta_title, p.meta_description, p.meta_keyword,
               p.status, p.created_by, p.created_at, p.updated_at,
               c.name as category_name, c.slug as category_slug
               FROM posts p LEFT JOIN categories c ON p.category_id = c.category_id
               WHERE p.status = 0 AND p.category_id = ? AND p.post_id != ?
               ORDER BY p.created_at DESC LIMIT ${n}`;
  return await query(sql, [categoryId, excludePostId]);
}

async function getPostCategories() {
  return cached('read:posts:categories', async () => {
  const sql = `SELECT c.category_id, c.name, c.slug, COUNT(p.post_id) as post_count
               FROM categories c INNER JOIN posts p ON c.category_id = p.category_id
               WHERE p.status = 0
               GROUP BY c.category_id, c.name, c.slug
               ORDER BY c.name ASC`;
  return await query(sql);
  });
}

module.exports = {
  query,
  resolveCategory,
  CATEGORY_MAP,
  invalidateReadCache,
  getAllStates,
  getStateBySlug,
  getStateById,
  getCitiesByStateAndCategory,
  getStateWithCitiesBySlugAndCategory,
  getStateWithGroupedCitiesBySlug,
  getCityBySlug,
  getCityBySlugAndCategory,
  getStatesWithCitiesByCategory,
  getAllCitiesByCategory,
  getAvailableCategories,
  getMetroCityBySlug,
  getMetroCitiesByCityId,
  getAllMetroCitiesByCategory,
  getSearchDropdownData,
  getCitiesByStateId,
  getAllCitiesByState,
  getAllPosts,
  getPostsCount,
  getPostBySlug,
  getRelatedPosts,
  getPostCategories
};
