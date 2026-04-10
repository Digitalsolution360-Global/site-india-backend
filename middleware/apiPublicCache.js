/**
 * Sets Cache-Control for cacheable public GET JSON (browser / CDN).
 * Does not make first hits faster; helps repeat navigations.
 */
function apiPublicCache(maxAgeSec = 60) {
  const swr = Math.min(maxAgeSec * 5, 3600);
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAgeSec}, stale-while-revalidate=${swr}`);
    next();
  };
}

module.exports = { apiPublicCache };
