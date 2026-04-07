/**
 * Tiny in-process TTL cache for read-heavy API paths.
 * Set API_CACHE_TTL_MS=0 to disable (each call runs factory).
 */

const store = new Map();

function ttlMs() {
  const n = parseInt(process.env.API_CACHE_TTL_MS || '90000', 10);
  return Number.isFinite(n) && n >= 0 ? n : 90000;
}

async function cached(key, factory, customTtl) {
  const ttl = customTtl !== undefined ? customTtl : ttlMs();
  if (ttl === 0) {
    return factory();
  }
  const now = Date.now();
  const row = store.get(key);
  if (row && row.expiresAt > now) {
    return row.value;
  }
  const value = await factory();
  store.set(key, { value, expiresAt: now + ttl });
  return value;
}

function invalidateAll() {
  store.clear();
}

module.exports = { cached, invalidateAll, ttlMs };
