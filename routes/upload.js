const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadToR2 } = require('../utils/r2');
const { authMiddleware } = require('../middleware/auth');

// Multer — store in memory (we stream directly to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

/* ═══════════════════════════════════════════════════════════════════
   POST /api/upload/blog-image  (Auth required)
   Upload a blog image to the blog-images R2 bucket.
   Returns the public URL.
   ═══════════════════════════════════════════════════════════════════ */
router.post('/blog-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only JPEG, PNG, WebP, GIF, and SVG images are allowed' });
    }

    const ext = path.extname(req.file.originalname) || '.webp';
    const key = `blogs/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    const url = await uploadToR2(
      req.file.buffer,
      key,
      process.env.R2_BLOG_BUCKET,
      req.file.mimetype
    );

    res.json({ success: true, url, key });
  } catch (error) {
    console.error('Blog image upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   POST /api/upload/resume  (Public — career applicants)
   Upload a resume PDF to the resume R2 bucket.
   Returns the URL.
   ═══════════════════════════════════════════════════════════════════ */
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file provided' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const isPdfMime = req.file.mimetype === 'application/pdf';
    const isPdfExt = ext === '.pdf';
    if (!isPdfMime && !isPdfExt) {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }

    // Sanitize original filename
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '.pdf');
    const key = `resumes/${Date.now()}-${safeName}`;

    const url = await uploadToR2(
      req.file.buffer,
      key,
      process.env.R2_RESUME_BUCKET,
      req.file.mimetype
    );

    res.json({ success: true, url, key });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume' });
  }
});

module.exports = router;
