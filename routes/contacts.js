const express = require('express');
const router = express.Router();
const db = require('../db');

/* ═══════════════════════════════════════════════════════════════════
   POST /api/contacts
   Public endpoint — saves a lead/enquiry to the `contacts` table.
   DB columns: id, name, lastname, pageurl, email, number, message,
               created_at, updated_at
   ═══════════════════════════════════════════════════════════════════ */
router.post('/', async (req, res) => {
  try {
    const { name, lastname, email, number, phone, message, pageurl, page_url, source } = req.body;

    await db.query(
      `INSERT INTO contacts (name, lastname, pageurl, email, number, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name || null,
        lastname || null,
        pageurl || page_url || null,
        email || null,
        number || phone || null,
        message || (source ? `[${source}]` : null),
      ]
    );

    res.json({ success: true, message: 'Contact saved' });
  } catch (error) {
    console.error('Contact save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save contact' });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   POST /api/contacts/career
   Public endpoint — saves a job application to the `careers` table.
   DB columns: id, name, phone, email, apply_for, city, expected_salary,
               resume, created_at, updated_at
   ═══════════════════════════════════════════════════════════════════ */
router.post('/career', async (req, res) => {
  try {
    const { name, phone, email, apply_for, city, expected_salary, resume } = req.body;

    await db.query(
      `INSERT INTO careers (name, phone, email, apply_for, city, expected_salary, resume, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name || null,
        phone || null,
        email || null,
        apply_for || null,
        city || null,
        expected_salary || null,
        resume || null,
      ]
    );

    res.json({ success: true, message: 'Application saved' });
  } catch (error) {
    console.error('Career save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save application' });
  }
});

module.exports = router;
