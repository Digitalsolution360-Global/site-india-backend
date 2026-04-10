const express = require('express');
const router = express.Router();
const db = require('../db');
const readCache = require('../utils/readCache');
const { apiPublicCache } = require('../middleware/apiPublicCache');

// GET /api/posts — List posts (paginated, optional category filter)
router.get('/', apiPublicCache(30), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const rawCat = req.query.category ? parseInt(req.query.category, 10) : null;
    const categoryId = Number.isFinite(rawCat) ? rawCat : null;

    const cacheKey = `posts:list:p${page}:l${limit}:c${categoryId ?? 'all'}`;
    const { posts, total } = await readCache.getOrSet(cacheKey, () =>
      db.getPostsListWithTotal(page, limit, categoryId)
    );

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// GET /api/posts/categories — List categories with post counts
router.get('/categories', apiPublicCache(60), async (req, res) => {
  try {
    const categories = await readCache.getOrSet('posts:categories', () => db.getPostCategories());
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching post categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// GET /api/posts/:slug — Single post by slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await db.getPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const related = await db.getRelatedPosts(post.category_id, post.post_id, 3);
    res.json({ success: true, data: post, related });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
});

module.exports = router;
