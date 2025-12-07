// ═══════════════════════════════════════════════════════════
// Authentication Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, exam } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            'INSERT INTO users (name, email, password_hash, exam) VALUES ($1, $2, $3, $4) RETURNING id, name, email, exam',
            [name, email, passwordHash, exam || 'neet-pg']
        );

        const user = result.rows[0];

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                exam: user.exam,
            },
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const result = await query(
            'SELECT id, name, email, password_hash, exam FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last login
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                exam: user.exam,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
