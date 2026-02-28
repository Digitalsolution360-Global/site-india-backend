const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

async function query(sql, params = []) {
  try {
    const connection = getPool();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
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
  const sql = `
    SELECT state_id, name, slug, image, descritpion AS description,
           meta_title, meta_description, meta_keywords, navbar_status
    FROM states
    ORDER BY name ASC
  `;
  return await query(sql);
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
  const categoryName = resolveCategory(category);

  const sql = `
    SELECT DISTINCT s.state_id, s.name, s.slug, s.image,
           s.descritpion AS description
    FROM states s
    INNER JOIN citys c ON s.state_id = c.state_id
    WHERE c.category_name = ?
    ORDER BY s.name ASC
  `;
  const states = await query(sql, [categoryName]);

  const citiesSql = `
    SELECT city_id, state_id, city, city_slug
    FROM citys
    WHERE category_name = ?
    ORDER BY city ASC
  `;
  const allCities = await query(citiesSql, [categoryName]);

  // Also fetch metro cities for each state
  const metroCitiesSql = `
    SELECT m.metrocity, m.metrocity_slug, c.state_id
    FROM metrocitys m
    JOIN citys c ON m.city_id = c.city_id
    WHERE m.category_name = ?
    ORDER BY m.metrocity ASC
  `;
  const allMetroCities = await query(metroCitiesSql, [categoryName]);

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

  // Merge metro cities into their state's city list
  allMetroCities.forEach(metro => {
    if (!cityMap[metro.state_id]) {
      cityMap[metro.state_id] = [];
    }
    cityMap[metro.state_id].push({
      name: metro.metrocity,
      slug: metro.metrocity_slug
    });
  });

  // Sort each state's city list alphabetically after merging
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
}

// ─── All cities for a category (flat) ────────────────────────────

async function getAllCitiesByCategory(category) {
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
}

async function getAvailableCategories() {
  const sql = `
    SELECT DISTINCT category_name, COUNT(*) as city_count
    FROM citys
    GROUP BY category_name
    ORDER BY category_name ASC
  `;
  return await query(sql);
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
}

// ─── Search Dropdown Data ────────────────────────────────────────

async function getSearchDropdownData() {
  const servicesSql = `SELECT DISTINCT category_name FROM citys ORDER BY category_name ASC`;
  const statesSql = `SELECT DISTINCT s.state_id, s.name, s.slug FROM states s INNER JOIN citys c ON s.state_id = c.state_id ORDER BY s.name ASC`;
  const [services, states] = await Promise.all([
    query(servicesSql),
    query(statesSql)
  ]);
  return { services, states };
}

async function getCitiesByStateId(stateId) {
  const sql = `
    SELECT DISTINCT city, city_slug, category_name
    FROM citys
    WHERE state_id = ?
    ORDER BY city ASC
  `;
  return await query(sql, [stateId]);
}

// ─── Posts / Blog Functions ───────────────────────────────────────
async function getAllPosts(page = 1, limit = 12, categoryId = null) {
  const offset = (page - 1) * limit;
  let sql, params;
  if (categoryId) {
    sql = `SELECT p.*, c.name as category_name, c.slug as category_slug
           FROM posts p LEFT JOIN categories c ON p.category_id = c.category_id
           WHERE p.status = 0 AND p.category_id = ?
           ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params = [categoryId, limit, offset];
  } else {
    sql = `SELECT p.*, c.name as category_name, c.slug as category_slug
           FROM posts p LEFT JOIN categories c ON p.category_id = c.category_id
           WHERE p.status = 0
           ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params = [limit, offset];
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
  const sql = `SELECT p.*, c.name as category_name, c.slug as category_slug
               FROM posts p LEFT JOIN categories c ON p.category_id = c.category_id
               WHERE p.status = 0 AND p.category_id = ? AND p.post_id != ?
               ORDER BY p.created_at DESC LIMIT ?`;
  return await query(sql, [categoryId, excludePostId, limit]);
}

async function getPostCategories() {
  const sql = `SELECT c.category_id, c.name, c.slug, COUNT(p.post_id) as post_count
               FROM categories c INNER JOIN posts p ON c.category_id = p.category_id
               WHERE p.status = 0
               GROUP BY c.category_id, c.name, c.slug
               ORDER BY c.name ASC`;
  return await query(sql);
}

module.exports = {
  query,
  resolveCategory,
  CATEGORY_MAP,
  getAllStates,
  getStateBySlug,
  getStateById,
  getCitiesByStateAndCategory,
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
  getAllPosts,
  getPostsCount,
  getPostBySlug,
  getRelatedPosts,
  getPostCategories
};
