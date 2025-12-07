// ═══════════════════════════════════════════════════════════
// Authentication Middleware
// ═══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Verify JWT token and attach user to request
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}

/**
 * Generate JWT token
 */
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        JWT_SECRET,
        { expiresIn: process.env.SESSION_TIMEOUT || '7d' }
    );
}

module.exports = {
    authenticateToken,
    generateToken,
    JWT_SECRET,
};
