/**
 * Short in-memory TTL cache for public read APIs (reduces DB round-trips on repeat hits).
 * Disable with API_CACHE_ENABLED=false. Tune TTL with API_CACHE_TTL_MS (default 60s).
 */
const ENABLED = process.env.API_CACHE_ENABLED !== 'false';
const TTL_MS = Math.max(0, parseInt(process.env.API_CACHE_TTL_MS || '60000', 10) || 60000);

const store = new Map();

async function getOrSet(key, factory) {
  if (!ENABLED || TTL_MS === 0) {
    return factory();
  }
  const e = store.get(key);
  if (e && Date.now() < e.expires) {
    return e.value;
  }
  if (e) store.delete(key);
  const value = await factory();
  store.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}

function invalidateAll() {
  store.clear();
}

module.exports = {
  ENABLED,
  TTL_MS,
  getOrSet,
  invalidateAll,
};
