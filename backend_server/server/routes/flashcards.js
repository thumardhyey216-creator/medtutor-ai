// ═══════════════════════════════════════════════════════════
// Flashcards Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateFlashcards, generateEmbedding } = require('../services/gemini');

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/flashcards/decks
 * Get all decks for user
 */
router.get('/decks', async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject } = req.query;

        let queryStr = `SELECT d.*, 
              COUNT(f.id) as card_count,
              AVG(CASE WHEN fr.quality >= 3 THEN 100 ELSE 0 END) as accuracy,
              COUNT(CASE WHEN fr.due_date <= CURRENT_TIMESTAMP THEN 1 END) as due_count
       FROM flashcard_decks d
       LEFT JOIN flashcards f ON d.id = f.deck_id
       LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id AND fr.user_id = $1
       WHERE d.user_id = $1`;

        const params = [userId];

        if (subject) {
            queryStr += ` AND d.subject = $${params.length + 1}`;
            params.push(subject);
        }

        queryStr += ` GROUP BY d.id ORDER BY d.created_at DESC`;

        const result = await query(queryStr, params);

        res.json({
            decks: result.rows.map(d => ({
                id: d.id,
                name: d.name,
                subject: d.subject,
                topic: d.topic,
                cardCount: parseInt(d.card_count) || 0,
                accuracy: Math.round(d.accuracy || 0),
                progress: Math.round(d.accuracy || 0),
                dueCount: parseInt(d.due_count) || 0
            }))
        });
    } catch (err) {
        console.error('Error fetching decks:', err);
        res.status(500).json({ message: 'Failed to fetch decks' });
    }
});

/**
 * PUT /api/flashcards/decks/:id
 * Update deck
 */
router.put('/decks/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, subject } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Deck name is required' });
        }

        const result = await query(
            'UPDATE flashcard_decks SET name = $1, subject = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [name, subject || 'General', id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        res.json({ message: 'Deck updated', deck: result.rows[0] });
    } catch (err) {
        console.error('Error updating deck:', err);
        res.status(500).json({ message: 'Failed to update deck' });
    }
});

/**
 * DELETE /api/flashcards/decks/:id
 * Delete deck
 */
router.delete('/decks/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify ownership
        const check = await query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        // Cascade delete (cards will be deleted by FK cascade if configured, but let's be safe or assume FK constraints)
        // If no cascade on DB, we must delete cards first. Assuming DB handles cascade or we do it here.
        // Let's do manual cleanup just in case DB schema isn't strict.
        await query('DELETE FROM flashcards WHERE deck_id = $1', [id]);
        await query('DELETE FROM flashcard_decks WHERE id = $1', [id]);

        res.json({ message: 'Deck deleted' });
    } catch (err) {
        console.error('Error deleting deck:', err);
        res.status(500).json({ message: 'Failed to delete deck' });
    }
});


/**
 * POST /api/flashcards/decks
 * Create new deck
 */
router.post('/decks', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, subject, topic } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Deck name is required' });
        }

        const result = await query(
            'INSERT INTO flashcard_decks (user_id, name, subject, topic) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, name, subject || 'General', topic || 'Mixed']
        );

        res.json({ message: 'Deck created', deckId: result.rows[0].id });
    } catch (err) {
        console.error('Error creating deck:', err);
        res.status(500).json({ message: 'Failed to create deck' });
    }
});

/**
 * PUT /api/flashcards/decks/:id
 * Edit deck
 */
router.put('/decks/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, subject } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Deck name is required' });
        }

        const result = await query(
            'UPDATE flashcard_decks SET name = $1, subject = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [name, subject || 'General', id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        res.json({ message: 'Deck updated', deck: result.rows[0] });
    } catch (err) {
        console.error('Error updating deck:', err);
        res.status(500).json({ message: 'Failed to update deck' });
    }
});

/**
 * DELETE /api/flashcards/decks/:id
 * Delete deck and its cards
 */
router.delete('/decks/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // First check ownership
        const check = await query(
            'SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        // Delete reviews for cards in this deck (cascade usually handles this, but being safe)
        // Assuming CASCADE is set up in DB, otherwise:
        // await query('DELETE FROM flashcard_reviews WHERE flashcard_id IN (SELECT id FROM flashcards WHERE deck_id = $1)', [id]);
        
        // Delete cards
        // await query('DELETE FROM flashcards WHERE deck_id = $1', [id]);

        // Delete deck (Cascade should delete cards and reviews if configured properly)
        // If not, we need to delete children first. Assuming standard constraints:
        await query('DELETE FROM flashcard_decks WHERE id = $1', [id]);

        res.json({ message: 'Deck deleted' });
    } catch (err) {
        console.error('Error deleting deck:', err);
        res.status(500).json({ message: 'Failed to delete deck' });
    }
});

/**
 * POST /api/flashcards/generate
 * Generate flashcards using AI
 */
router.post('/generate', async (req, res) => {
    const start = Date.now();
    try {
        const userId = req.user.id;
        const { subject, topic, count } = req.body;
        console.log(`📝 Generating flashcards for ${subject} - ${topic} (Count: ${count})...`);

        if (!subject || !topic) {
            return res.status(400).json({ message: 'Subject and topic are required' });
        }

        // Get relevant context
        let context = [];

        try {
            // Try text-based search
            console.log('🔍 Searching context for flashcards...');
            const contextResult = await query(
                `SELECT text FROM content_chunks 
                 WHERE LOWER(subject) LIKE LOWER($1) 
                    OR LOWER(topic) LIKE LOWER($2)
                    OR LOWER(text) LIKE LOWER($3)
                 LIMIT 5`,
                [`%${subject}%`, `%${topic}%`, `%${topic}%`]
            );
            context = contextResult.rows;
            console.log(`✅ Found ${context.length} context chunks.`);
        } catch (searchErr) {
            console.error('Context search error:', searchErr);
        }

        // If no context found, generate with topic name only
        if (context.length === 0) {
            console.log('⚠️ No context found, using topic fallback.');
            context = [{ text: `Topic: ${subject} - ${topic}. Generate educational content about this medical topic.` }];
        }

        // Generate flashcards
        console.log('🤖 Invoking AI generation...');
        const flashcards = await generateFlashcards(subject, topic, context, count || 5);
        console.log(`✅ Generated ${flashcards.length} cards.`);

        // Create or get deck
        let deckResult = await query(
            'SELECT id FROM flashcard_decks WHERE user_id = $1 AND subject = $2 AND topic = $3',
            [userId, subject, topic]
        );

        let deckId;
        if (deckResult.rows.length === 0) {
            const newDeck = await query(
                'INSERT INTO flashcard_decks (user_id, name, subject, topic) VALUES ($1, $2, $3, $4) RETURNING id',
                [userId, `${subject} - ${topic}`, subject, topic]
            );
            deckId = newDeck.rows[0].id;
        } else {
            deckId = deckResult.rows[0].id;
        }

        // Insert flashcards
        for (const card of flashcards) {
            await query(
                'INSERT INTO flashcards (deck_id, front, back, created_by_ai) VALUES ($1, $2, $3, true)',
                [deckId, card.front, card.back]
            );
        }

        const duration = (Date.now() - start) / 1000;
        console.log(`🎉 Flashcard generation complete in ${duration}s`);

        res.json({ message: 'Flashcards generated successfully', count: flashcards.length, deckId });
    } catch (err) {
        const duration = (Date.now() - start) / 1000;
        console.error(`❌ Error generating flashcards (${duration}s):`, err);
        res.status(500).json({ message: 'Failed to generate flashcards', error: err.message });
    }
});

/**
 * GET /api/flashcards/due-today
 * Get cards due for review
 */
router.get('/due-today', async (req, res) => {
    try {
        const userId = req.user.id;

        // Count cards due
        const dueResult = await query(
            `SELECT COUNT(DISTINCT f.id) as count
             FROM flashcards f
             JOIN flashcard_decks d ON f.deck_id = d.id
             LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id AND fr.user_id = $1
             WHERE d.user_id = $1 AND (fr.due_date IS NULL OR fr.due_date <= CURRENT_TIMESTAMP)`,
            [userId]
        );

        const reviewedResult = await query(
            `SELECT COUNT(*) as count
             FROM flashcard_reviews fr
             WHERE fr.user_id = $1 AND DATE(fr.reviewed_at) = CURRENT_DATE`,
            [userId]
        );

        const accuracyResult = await query(
            `SELECT AVG(CASE WHEN quality >= 3 THEN 100 ELSE 0 END) as accuracy
             FROM flashcard_reviews
             WHERE user_id = $1 AND DATE(reviewed_at) = CURRENT_DATE`,
            [userId]
        );

        res.json({
            dueToday: parseInt(dueResult.rows[0].count) || 0,
            reviewedToday: parseInt(reviewedResult.rows[0].count) || 0,
            accuracy: Math.round(accuracyResult.rows[0].accuracy || 0),
        });
    } catch (err) {
        console.error('Error fetching due cards:', err);
        res.status(500).json({ message: 'Failed to fetch due cards' });
    }
});

/**
 * GET /api/flashcards/next
 * Get next cards for review
 */
router.get('/next', async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const deckId = req.query.deckId;

        let queryStr = `SELECT f.id, f.front, f.back, fr.id as review_id, d.name as deck_name
             FROM flashcards f
             JOIN flashcard_decks d ON f.deck_id = d.id
             LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id AND fr.user_id = $1
             WHERE d.user_id = $1 AND (fr.due_date IS NULL OR fr.due_date <= CURRENT_TIMESTAMP)`;
        
        const params = [userId];

        if (deckId) {
            queryStr += ` AND d.id = $${params.length + 1}`;
            params.push(deckId);
        }

        queryStr += ` ORDER BY COALESCE(fr.due_date, f.created_at) ASC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await query(queryStr, params);

        res.json({ cards: result.rows });
    } catch (err) {
        console.error('Error fetching next cards:', err);
        res.status(500).json({ message: 'Failed to fetch cards' });
    }
});

/**
 * POST /api/flashcards/review
 * Submit flashcard review
 */
router.post('/review', async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId, quality } = req.body;

        if (!cardId || quality === undefined) {
            return res.status(400).json({ message: 'cardId and quality are required' });
        }

        // SM-2 algorithm for spaced repetition
        const reviewResult = await query(
            'SELECT * FROM flashcard_reviews WHERE flashcard_id = $1 AND user_id = $2 ORDER BY reviewed_at DESC LIMIT 1',
            [cardId, userId]
        );

        let interval = 1;
        let easeFactor = 2.5;

        if (reviewResult.rows.length > 0) {
            const lastReview = reviewResult.rows[0];
            easeFactor = Math.max(1.3, lastReview.ease_factor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02)));

            if (quality < 3) {
                interval = 1;
            } else {
                interval = quality === 3 ? lastReview.interval * easeFactor : lastReview.interval * easeFactor * 1.3;
            }
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.round(interval));

        // Insert new review
        await query(
            `INSERT INTO flashcard_reviews (flashcard_id, user_id, quality, interval, ease_factor, due_date)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [cardId, userId, quality, Math.round(interval), easeFactor, dueDate]
        );

        res.json({ message: 'Review recorded', nextDue: dueDate });
    } catch (err) {
        console.error('Error recording review:', err);
        res.status(500).json({ message: 'Failed to record review' });
    }
});

/**
 * GET /api/flashcards
 * Get all flashcards (library view)
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject } = req.query;

        let queryStr = `SELECT f.*, d.name as deck_name, d.subject, fr.due_date
             FROM flashcards f
             JOIN flashcard_decks d ON f.deck_id = d.id
             LEFT JOIN (
                 SELECT DISTINCT ON (flashcard_id) flashcard_id, due_date
                 FROM flashcard_reviews
                 WHERE user_id = $1
                 ORDER BY flashcard_id, reviewed_at DESC
             ) fr ON f.id = fr.flashcard_id
             WHERE d.user_id = $1`;
        
        const params = [userId];

        if (subject) {
            queryStr += ` AND d.subject = $${params.length + 1}`;
            params.push(subject);
        }

        queryStr += ` ORDER BY f.created_at DESC LIMIT 100`;

        const result = await query(queryStr, params);

        res.json({
            cards: result.rows.map(c => ({
                id: c.id,
                front: c.front,
                back: c.back,
                deckId: c.deck_id,
                deckName: c.deck_name,
                subject: c.subject || 'General',
                dueDate: c.due_date ? new Date(c.due_date).toLocaleDateString() : 'New'
            }))
        });
    } catch (err) {
        console.error('Error fetching flashcards:', err);
        res.status(500).json({ message: 'Failed to fetch flashcards' });
    }
});

/**
 * GET /api/flashcards/stats
 * Get flashcard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;

        const statsResult = await query(
            `SELECT 
                (SELECT COUNT(*) FROM flashcards f JOIN flashcard_decks d ON f.deck_id = d.id WHERE d.user_id = $1) as total_cards,
                (SELECT COUNT(DISTINCT flashcard_id) FROM flashcard_reviews WHERE user_id = $1 AND quality >= 4) as mastered,
                (SELECT COUNT(DISTINCT flashcard_id) FROM flashcard_reviews WHERE user_id = $1 AND quality < 4) as learning`,
            [userId]
        );

        const stats = statsResult.rows[0];

        res.json({
            totalCards: parseInt(stats.total_cards) || 0,
            mastered: parseInt(stats.mastered) || 0,
            learning: parseInt(stats.learning) || 0,
            streak: 0 // TODO: Calculate streak
        });
    } catch (err) {
        console.error('Error fetching flashcard stats:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

/**
 * POST /api/flashcards
 * Create manual flashcard
 */
router.post('/', async (req, res) => {
    try {
        const { front, back, deckId } = req.body;

        if (!front || !back || !deckId) {
            return res.status(400).json({ message: 'front, back, and deckId are required' });
        }

        // Verify deck ownership
        const userId = req.user.id;
        const deckCheck = await query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deckId, userId]);
        if (deckCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Deck not found or unauthorized' });
        }

        await query(
            'INSERT INTO flashcards (deck_id, front, back) VALUES ($1, $2, $3)',
            [deckId, front, back]
        );

        res.json({ message: 'Flashcard created successfully' });
    } catch (err) {
        console.error('Error creating flashcard:', err);
        res.status(500).json({ message: 'Failed to create flashcard' });
    }
});

/**
 * PUT /api/flashcards/:id
 * Edit flashcard
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { front, back, deckId } = req.body;
        const userId = req.user.id;

        // Check ownership through deck join
        const check = await query(
            `SELECT f.id FROM flashcards f 
             JOIN flashcard_decks d ON f.deck_id = d.id 
             WHERE f.id = $1 AND d.user_id = $2`,
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        if (deckId) {
             // Verify new deck ownership
            const deckCheck = await query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deckId, userId]);
            if (deckCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Target deck not found or unauthorized' });
            }
            
            await query(
                'UPDATE flashcards SET front = $1, back = $2, deck_id = $3 WHERE id = $4',
                [front, back, deckId, id]
            );
        } else {
            await query(
                'UPDATE flashcards SET front = $1, back = $2 WHERE id = $3',
                [front, back, id]
            );
        }

        res.json({ message: 'Flashcard updated' });
    } catch (err) {
        console.error('Error updating flashcard:', err);
        res.status(500).json({ message: 'Failed to update flashcard' });
    }
});

/**
 * DELETE /api/flashcards/:id
 * Delete flashcard
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check ownership
        const check = await query(
            `SELECT f.id FROM flashcards f 
             JOIN flashcard_decks d ON f.deck_id = d.id 
             WHERE f.id = $1 AND d.user_id = $2`,
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        await query('DELETE FROM flashcards WHERE id = $1', [id]);

        res.json({ message: 'Flashcard deleted' });
    } catch (err) {
        console.error('Error deleting flashcard:', err);
        res.status(500).json({ message: 'Failed to delete flashcard' });
    }
});

/**
 * POST /api/flashcards/from-answer
 * Generate flashcards from chat answer
 */
router.post('/from-answer', async (req, res) => {
    try {
        const userId = req.user.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' });
        }

        // Extract key concepts and generate flashcards
        const flashcards = await generateFlashcards('General', 'Mixed Topics', [{ text }], 3);

        // Create a "Generated from Chat" deck if it doesn't exist
        let deckResult = await query(
            'SELECT id FROM flashcard_decks WHERE user_id = $1 AND name = $2',
            [userId, 'Generated from Chat']
        );

        let deckId;
        if (deckResult.rows.length === 0) {
            const newDeck = await query(
                'INSERT INTO flashcard_decks (user_id, name) VALUES ($1, $2) RETURNING id',
                [userId, 'Generated from Chat']
            );
            deckId = newDeck.rows[0].id;
        } else {
            deckId = deckResult.rows[0].id;
        }

        // Insert flashcards
        for (const card of flashcards) {
            await query(
                'INSERT INTO flashcards (deck_id, front, back, created_by_ai) VALUES ($1, $2, $3, true)',
                [deckId, card.front, card.back]
            );
        }

        res.json({ message: 'Flashcards created from answer', count: flashcards.length });
    } catch (err) {
        console.error('Error creating flashcards from answer:', err);
        res.status(500).json({ message: 'Failed to create flashcards', error: err.message });
    }
});

module.exports = router;