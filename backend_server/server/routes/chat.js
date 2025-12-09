// ═══════════════════════════════════════════════════════════
// Chat Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const { validate: validateUuid } = require('uuid');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateChatResponse, generateEmbedding } = require('../services/gemini');
const { searchContentChunks } = require('../services/rag');

const router = express.Router();

// Simple in-memory cache
const cache = {
    data: new Map(),
    get(key) {
        const item = this.data.get(key);
        if (item && item.expiry > Date.now()) {
            return item.value;
        }
        if (item) this.data.delete(key);
        return null;
    },
    set(key, value, ttlSeconds = 60) {
        this.data.set(key, {
            value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
        // Cleanup if too large
        if (this.data.size > 1000) {
            const firstKey = this.data.keys().next().value;
            this.data.delete(firstKey);
        }
    }
};

let isBackfilling = false;

// ═══════════════════════════════════════════════════════════
// DEBUG ROUTES (NO AUTH REQ)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/chat/debug/embeddings
 * Check embedding coverage
 */
router.get('/debug/embeddings', async (req, res) => {
    try {
        const totalResult = await query('SELECT COUNT(*) FROM content_chunks');
        const embeddingResult = await query('SELECT COUNT(*) FROM content_chunks WHERE embedding IS NOT NULL');

        const total = parseInt(totalResult.rows[0].count);
        const withEmbeddings = parseInt(embeddingResult.rows[0].count);

        res.json({
            total,
            withEmbeddings,
            coverage: total > 0 ? ((withEmbeddings / total) * 100).toFixed(1) + '%' : '0%',
            isBackfilling,
            dbInfo: {
                host: process.env.DB_HOST,
                database: process.env.DB_NAME
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/chat/debug/search
 * Direct DB Search
 */
router.get('/debug/search', async (req, res) => {
    try {
        const term = req.query.term || '';
        if (!term) return res.json({ message: 'No term provided' });

        const result = await query(
            `SELECT id, subject, topic, substring(text, 1, 100) as preview, (embedding IS NOT NULL) as has_embedding 
             FROM content_chunks 
             WHERE text ILIKE $1 OR topic ILIKE $1
             LIMIT 10`,
            [`%${term}%`]
        );

        res.json({
            term,
            matchCount: result.rows.length,
            matches: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/chat/debug/backfill
 * Start background backfill process
 */
router.post('/debug/backfill', async (req, res) => {
    if (isBackfilling) {
        return res.json({ message: 'Backfill already in progress' });
    }

    isBackfilling = true;

    // Start async process
    runBackfill().catch(err => {
        console.error('Backfill fatal error:', err);
        isBackfilling = false;
    });

    res.json({ message: 'Backfill process started in background' });
});

/**
 * POST /api/chat/debug/stop-backfill
 * Stop background backfill process
 */
router.post('/debug/stop-backfill', (req, res) => {
    isBackfilling = false;
    res.json({ message: 'Stopping backfill...' });
});

async function runBackfill() {
    console.log('🚀 Starting background backfill...');
    const BATCH_SIZE = 20; // Increased batch size
    const DELAY_MS = 200;  // Reduced delay for faster processing

    while (isBackfilling) {
        try {
            // Fetch chunks without embeddings
            const res = await query(`
                SELECT id, text 
                FROM content_chunks 
                WHERE embedding IS NULL 
                LIMIT $1
            `, [BATCH_SIZE]);

            if (res.rows.length === 0) {
                console.log('✅ Backfill complete!');
                isBackfilling = false;
                break;
            }

            console.log(`📦 Processing backfill batch of ${res.rows.length}...`);

            for (const row of res.rows) {
                if (!isBackfilling) break;

                try {
                    const embedding = await generateEmbedding(row.text);
                    if (embedding) {
                        await query(`
                            UPDATE content_chunks 
                            SET embedding = $1 
                            WHERE id = $2
                        `, [`[${embedding.join(',')}]`, row.id]);
                    }
                } catch (e) {
                    console.error(`Failed to embed chunk ${row.id}:`, e.message);
                }

                // Rate limiting delay
                await new Promise(r => setTimeout(r, DELAY_MS));
            }
        } catch (err) {
            console.error('Backfill batch error:', err);
            await new Promise(r => setTimeout(r, 10000)); // Wait on error
        }
    }
    console.log('🛑 Backfill stopped');
}

// ═══════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES
// ═══════════════════════════════════════════════════════════

// All routes below this line require authentication
router.use(authenticateToken);

/**
 * POST /api/chat/message
 * Send a chat message and get AI response
 */
router.post('/message', async (req, res) => {
    console.log('📨 POST /message received:', { message: req.body.message?.substring(0, 50), style: req.body.response_style });
    try {
        const { message, sessionId, exam, mode, response_style } = req.body;
        const userId = req.user.id;

        // Input Validation & Sanitization
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: 'Valid message string is required' });
        }

        // if (sessionId && !validateUuid(sessionId)) {
        //    return res.status(400).json({ message: 'Invalid session ID format' });
        // }

        const cleanMessage = message.trim();
        if (cleanMessage.length === 0) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }
        if (cleanMessage.length > 2000) {
            return res.status(400).json({ message: 'Message too long (max 2000 chars)' });
        }

        // Determine response style (default: standard)
        const responseStyle = response_style || mode || 'standard';

        // Map old mode names to new response_style names
        const styleMappings = {
            'concise': 'brief',
            'ultracomprehensive': 'ultra',
            'mnemonic': 'standard' // Treat mnemonic as standard for now
        };
        const normalizedStyle = styleMappings[responseStyle] || responseStyle;

        // Determine retrieval depth based on response style
        const retrievalDepth = {
            'brief': 5,
            'standard': 15,
            'comprehensive': 25,
            'ultra': 40
        }[normalizedStyle] || 15;

        let context = [];

        // Check cache for identical queries (simple optimization)
        // Use hash of message to prevent collisions on similar prefixes
        const msgHash = cleanMessage.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const cacheKey = `ctx_${msgHash}_${retrievalDepth}`;
        const cachedContext = cache.get(cacheKey);

        if (mode === 'general') {
            console.log('🌍 General mode requested - skipping context retrieval');
            context = [];
        } else if (cachedContext) {
            context = cachedContext;
            console.log(`📦 Using cached context (${context.length} chunks)`);
        } else {
            // Use RAG Service
            context = await searchContentChunks(cleanMessage, retrievalDepth);
            
            // Cache results
            if (context.length > 0) {
                cache.set(cacheKey, context, 300);
            }
        }

        const aiResult = await generateChatResponse(cleanMessage, context, normalizedStyle, exam, userId, mode, sessionId);

        // Extract response components
        const aiResponse = aiResult.response;
        const suggestedQuestions = aiResult.suggestedQuestions || [];
        const queryFocus = aiResult.queryFocus;

        // Create or use existing session
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            const sessionResult = await query(
                'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id',
                [userId, cleanMessage.substring(0, 100)]
            );
            activeSessionId = sessionResult.rows[0].id;
        } else {
            // Update last activity
            await query(
                'UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
                [activeSessionId]
            );
        }

        // Save user message
        await query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
            [activeSessionId, 'user', cleanMessage]
        );

        // Save AI response with sources and metadata
        const sources = context.map(c => ({
            subject: c.subject || 'General',
            topic: c.topic || 'Unknown',
            id: c.id
        }));

        const metadata = {
            sources,
            suggestedQuestions,
            queryFocus,
            responseStyle: normalizedStyle,
            timestamp: new Date().toISOString()
        };

        await query(
            'INSERT INTO chat_messages (session_id, role, content, sources) VALUES ($1, $2, $3, $4)',
            [activeSessionId, 'ai', aiResponse, JSON.stringify(metadata)]
        );

        res.json({
            sessionId: activeSessionId,
            response: aiResponse,
            sources,
            suggestedQuestions,
            queryFocus,
            responseStyle: normalizedStyle,
            timestamp: metadata.timestamp
        });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ message: 'Failed to process message', error: err.message });
    }
});

/**
 * GET /api/chat/sessions
 * Get recent chat sessions
 */
router.get('/sessions', async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50
        const offset = parseInt(req.query.offset) || 0;

        // Cache key for sessions list
        const cacheKey = `sessions_${userId}_${limit}_${offset}`;
        const cachedSessions = cache.get(cacheKey);
        if (cachedSessions) {
            return res.json({ sessions: cachedSessions, cached: true });
        }

        const result = await query(
            `SELECT cs.id, cs.title, cs.created_at, cs.last_activity,
              (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as preview
       FROM chat_sessions cs
       WHERE cs.user_id = $1
       ORDER BY cs.last_activity DESC
       LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        cache.set(cacheKey, result.rows, 30); // Cache for 30 seconds
        res.json({ sessions: result.rows });
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ message: 'Failed to fetch sessions' });
    }
});

/**
 * GET /api/chat/sessions/:id
 * Get specific chat session with messages (Supports pagination)
 */
router.get('/sessions/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = req.params.id;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;

        // Get session
        const sessionResult = await query(
            'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Get messages with pagination (fetch latest first, then reverse)
        const messagesResult = await query(
            'SELECT role, content, sources, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [sessionId, limit, offset]
        );

        // Reverse to chronological order for display
        const messages = messagesResult.rows.reverse();

        // Get total count for pagination info
        const countResult = await query(
            'SELECT COUNT(*) FROM chat_messages WHERE session_id = $1',
            [sessionId]
        );

        res.json({
            session: sessionResult.rows[0],
            messages: messages,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit,
                offset,
                hasMore: (offset + limit) < parseInt(countResult.rows[0].count)
            }
        });
    } catch (err) {
        console.error('Error fetching session:', err);
        res.status(500).json({ message: 'Failed to fetch session' });
    }
});

/**
 * GET /api/chat/last-session
 * Get last active session
 */
router.get('/last-session', async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            'SELECT id, subject, topic FROM chat_sessions WHERE user_id = $1 ORDER BY last_activity DESC LIMIT 1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No previous session' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching last session:', err);
        res.status(500).json({ message: 'Failed to fetch last session' });
    }
});

module.exports = router;
