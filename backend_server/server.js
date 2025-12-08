// ═══════════════════════════════════════════════════════════
// MedTutor AI - Main Server
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./server/routes/auth-routes');
const chatRoutes = require('./server/routes/chat');
const flashcardsRoutes = require('./server/routes/flashcards');
const qbankRoutes = require('./server/routes/qbank');
const statsRoutes = require('./server/routes/stats');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');
console.log('🔧 CORS Allowed Origins:', allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed (or if wildcard is used)
        // Also explicitly allow Vercel deployments for convenience
        if (
            allowedOrigins.includes('*') ||
            allowedOrigins.indexOf(origin) !== -1 ||
            origin.endsWith('.vercel.app')
        ) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/auth headers
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging & Performance Monitoring
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);

    // Capture end of response
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Add timing header if headers not sent (though finish usually means they are)
        // Ideally, we set this BEFORE finish, but response time is only known at end.
        // Common practice is to set X-Response-Time on header send.
        // But for logging purposes, this is fine.

        const status = res.statusCode;
        const logMsg = `${timestamp} - ${req.method} ${req.path} ${status} - ${duration}ms`;

        // Highlight slow requests
        if (duration > 1000) {
            console.warn(`⚠️ SLOW REQUEST: ${logMsg}`);
        } else {
            console.log(logMsg);
        }
    });

    // Add X-Response-Time header
    const originalSend = res.send;
    res.send = function (body) {
        const duration = Date.now() - start;
        res.set('X-Response-Time', `${duration}ms`);
        return originalSend.call(this, body);
    };

    next();
});

// Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/qbank', qbankRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Catch-all route - serve index.html for SPA routing
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {},
    });
});

// Start server
const { initDB } = require('./scripts/init-db');

async function startServer() {
    // Initialize DB on startup
    if (process.env.NODE_ENV === 'production' || process.env.INIT_DB_ON_START === 'true') {
        console.log('🔄 Checking database initialization...');
        await initDB();
    }

    const server = app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              🩺 MedTutor AI Server                       ║
║                                                          ║
║  Server running on: http://localhost:${PORT}              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  CORS Origins: ${process.env.CORS_ORIGIN || '*'}          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, closing server...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}

startServer();
