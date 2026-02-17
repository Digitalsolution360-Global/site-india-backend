const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

// ─── POST /api/auth/login ────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (!users.length) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];

        // Laravel uses $2y$, bcryptjs expects $2a$ — swap the prefix
        const fixedHash = user.password.replace(/^\$2y\$/, '$2a$');
        const isMatch = await bcrypt.compare(password, fixedHash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role_as },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role_as }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed.' });
    }
});

// ─── GET /api/auth/me ────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const users = await db.query('SELECT id, name, email, role_as FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user.' });
    }
});

module.exports = router;
