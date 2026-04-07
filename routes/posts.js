const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/posts — List posts (paginated, optional category filter)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const categoryId = req.query.category ? parseInt(req.query.category) : null;

    const [posts, total] = await Promise.all([
      db.getAllPosts(page, limit, categoryId),
      db.getPostsCount(categoryId)
    ]);

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
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.getPostCategories();
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
