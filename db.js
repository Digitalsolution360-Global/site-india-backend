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
  getAvailableCategories
};
