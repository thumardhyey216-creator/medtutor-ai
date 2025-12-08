// ═══════════════════════════════════════════════════════════
// QBank Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateQuestions, generateChatResponse } = require('../services/gemini');

const router = express.Router();
router.use(authenticateToken);

/**
 * POST /api/qbank/start-session
 * Start a new test session
 */
router.post('/start-session', async (req, res) => {
    try {
        const userId = req.user.id;
        const { mode, numQuestions, subject, difficulty, examType, timed } = req.body;

        // Create session
        const sessionResult = await query(
            'INSERT INTO qbank_sessions (user_id, mode, total_questions) VALUES ($1, $2, $3) RETURNING id',
            [userId, mode, numQuestions]
        );

        const sessionId = sessionResult.rows[0].id;

        // Build query for fetching questions
        let questionQuery = 'SELECT * FROM questions WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (subject) {
            paramCount++;
            questionQuery += ` AND LOWER(subject) = LOWER($${paramCount})`;
            params.push(subject);
        }

        if (difficulty) {
            paramCount++;
            questionQuery += ` AND difficulty = $${paramCount}`;
            params.push(difficulty);
        }

        questionQuery += ` ORDER BY RANDOM() LIMIT $${paramCount + 1}`;
        params.push(numQuestions);

        const questionsResult = await query(questionQuery, params);
        let finalQuestions = questionsResult.rows;

        // If not enough questions, generate some
        if (finalQuestions.length < numQuestions) {
            const needed = numQuestions - finalQuestions.length;
            console.log(`Only ${finalQuestions.length} questions found, generating ${needed} more...`);

            try {
                const genSubject = subject || 'General Medicine';
                const genTopic = subject ? `${subject} General` : 'Mixed Topics'; // Use subject as topic if available

                // Get relevant context using text search (similar to /generate route)
                let context = [];
                try {
                    // If subject is provided, search for content related to it
                    if (subject) {
                        const contextResult = await query(
                            `SELECT text, subject, topic FROM content_chunks 
                             WHERE LOWER(subject) LIKE LOWER($1) 
                             ORDER BY RANDOM()
                             LIMIT 5`,
                            [`%${subject}%`]
                        );
                        context = contextResult.rows;

                        // If we have embeddings available, we could use hybrid search here
                        // For now, fall back to text search
                    }

                    // If still no context, use a generic prompt
                    if (context.length === 0) {
                        context = [{ text: `Generate questions for ${genSubject} covering important clinical and conceptual topics.` }];
                    }
                } catch (searchErr) {
                    console.error('Context search error during session start:', searchErr);
                    context = [{ text: `Generate questions for ${genSubject}.` }];
                }

                // Generate questions with context and exam type
                let generatedQuestions = [];
                let attempts = 0;
                const maxAttempts = 3;
                let lastError = null;

                while (attempts < maxAttempts && generatedQuestions.length === 0) {
                    try {
                        attempts++;
                        generatedQuestions = await generateQuestions(
                            genSubject,
                            genTopic,
                            context,
                            difficulty || 'medium',
                            needed,
                            examType || 'neet-pg'
                        );
                    } catch (e) {
                        console.warn(`Generation attempt ${attempts} failed:`, e.message);
                        if (e.response && e.response.text) {
                             console.warn('Failed Response Text:', e.response.text().substring(0, 200) + '...');
                        }
                        lastError = e;
                        // Wait a bit before retry
                        if (attempts < maxAttempts) {
                             await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                }

                if (generatedQuestions.length === 0 && lastError) {
                    throw lastError;
                }

                // Insert into DB and add to final list
                for (const q of generatedQuestions) {
                    const insertResult = await query(
                        `INSERT INTO questions (subject, topic, stem, options, correct_option, explanation, difficulty, is_ai_generated)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
                        [genSubject, genTopic, q.stem, JSON.stringify(q.options), q.correct_option, q.explanation, difficulty || 'medium']
                    );

                    const newQ = insertResult.rows[0];
                    finalQuestions.push(newQ);
                }
            } catch (genErr) {
                console.error('Failed to generate extra questions:', genErr);
                // If we have 0 questions and generation failed, we must report this
                if (finalQuestions.length === 0) {
                    throw new Error(`Generation failed: ${genErr.message}`);
                }
            }
        }

        if (finalQuestions.length === 0) {
             throw new Error('No questions found and generation failed');
        }

        res.json({
            session: {
                id: sessionId,
                mode,
                totalQuestions: numQuestions,
                timed,
            },
            questions: finalQuestions.map(q => ({
                id: q.id,
                subject: q.subject || 'General',
                topic: q.topic || 'Mixed',
                stem: q.stem,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                difficulty: q.difficulty,
                isAiGenerated: q.is_ai_generated || false,
            })),
        });
    } catch (err) {
        console.error('Error starting session:', err);
        res.status(500).json({ message: 'Failed to start session', error: err.message });
    }
});

/**
 * POST /api/qbank/answer
 * Submit answer for a question
 */
router.post('/answer', async (req, res) => {
    try {
        const { sessionId, questionId, selectedOption, timeSpent } = req.body;

        // Get question
        const questionResult = await query(
            'SELECT correct_option, explanation FROM questions WHERE id = $1',
            [questionId]
        );

        if (questionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const question = questionResult.rows[0];
        const isCorrect = parseInt(selectedOption) === parseInt(question.correct_option);

        // Record attempt
        await query(
            `INSERT INTO question_attempts (session_id, question_id, selected_option, is_correct, time_taken_sec)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, questionId, selectedOption, isCorrect, timeSpent || 0]
        );

        res.json({
            isCorrect,
            correctOption: question.correct_option,
            explanation: question.explanation || 'No explanation available.',
        });
    } catch (err) {
        console.error('Error submitting answer:', err);
        res.status(500).json({ message: 'Failed to submit answer' });
    }
});

/**
 * POST /api/qbank/session/:id/complete
 * Complete a test session
 */
router.post('/session/:id/complete', async (req, res) => {
    try {
        const sessionId = req.params.id;

        // Calculate results
        const resultsQuery = await query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
                SUM(time_taken_sec) as total_time
             FROM question_attempts
             WHERE session_id = $1`,
            [sessionId]
        );

        const results = resultsQuery.rows[0];
        const total = parseInt(results.total) || 1;
        const correct = parseInt(results.correct) || 0;
        const score = Math.round((correct / total) * 100);

        // Update session
        await query(
            'UPDATE qbank_sessions SET completed_at = CURRENT_TIMESTAMP, score = $1, time_taken = $2 WHERE id = $3',
            [score, results.total_time || 0, sessionId]
        );

        res.json({
            score,
            correct,
            incorrect: total - correct,
            timeTaken: parseInt(results.total_time) || 0,
        });
    } catch (err) {
        console.error('Error completing session:', err);
        res.status(500).json({ message: 'Failed to complete session' });
    }
});

/**
 * GET /api/qbank/session/:id
 * Get session details
 */
router.get('/session/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = req.params.id;

        const sessionResult = await query(
            'SELECT * FROM qbank_sessions WHERE id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const attemptsResult = await query(
            `SELECT qa.*, q.stem, q.options, q.correct_option, q.explanation
             FROM question_attempts qa
             JOIN questions q ON qa.question_id = q.id
             WHERE qa.session_id = $1
             ORDER BY qa.attempted_at`,
            [sessionId]
        );

        res.json({
            session: sessionResult.rows[0],
            attempts: attemptsResult.rows,
        });
    } catch (err) {
        console.error('Error fetching session:', err);
        res.status(500).json({ message: 'Failed to fetch session' });
    }
});

/**
 * POST /api/qbank/generate
 * Generate questions using AI
 */
router.post('/generate', async (req, res) => {
    try {
        const { subject, topic, difficulty, count, examType } = req.body;

        if (!subject || !topic) {
            return res.status(400).json({ message: 'Subject and topic are required' });
        }

        // Get relevant context using text search
        let context = [];
        try {
            const contextResult = await query(
                `SELECT text FROM content_chunks 
                 WHERE LOWER(subject) LIKE LOWER($1) 
                    OR LOWER(topic) LIKE LOWER($2)
                    OR LOWER(text) LIKE LOWER($3)
                 LIMIT 5`,
                [`%${subject}%`, `%${topic}%`, `%${topic}%`]
            );
            context = contextResult.rows;
        } catch (searchErr) {
            console.error('Context search error:', searchErr);
        }

        // If no context found, use topic description
        if (context.length === 0) {
            context = [{ text: `Topic: ${subject} - ${topic}. Generate medical exam questions about this topic.` }];
        }

        // Generate questions with exam type
        const questions = await generateQuestions(
            subject,
            topic,
            context,
            difficulty || 'medium',
            count || 5,
            examType || 'neet-pg'
        );

        // Insert questions into database
        for (const q of questions) {
            await query(
                `INSERT INTO questions (subject, topic, stem, options, correct_option, explanation, difficulty, is_ai_generated)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                [subject, topic, q.stem, JSON.stringify(q.options), q.correct_option, q.explanation, difficulty || 'medium']
            );
        }

        res.json({ message: 'Questions generated successfully', count: questions.length });
    } catch (err) {
        console.error('Error generating questions:', err);
        res.status(500).json({ message: 'Failed to generate questions', error: err.message });
    }
});

/**
 * POST /api/qbank/generate-from-answer
 * Generate questions from chat answer
 */
router.post('/generate-from-answer', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' });
        }

        const questions = await generateQuestions('General', 'Mixed Topics', [{ text }], 'medium', 2);

        for (const q of questions) {
            await query(
                `INSERT INTO questions (subject, topic, stem, options, correct_option, explanation, difficulty, is_ai_generated)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                ['General', 'Mixed Topics', q.stem, JSON.stringify(q.options), q.correct_option, q.explanation, 'medium']
            );
        }

        res.json({ message: 'Questions generated from answer', count: questions.length });
    } catch (err) {
        console.error('Error generating questions from answer:', err);
        res.status(500).json({ message: 'Failed to generate questions', error: err.message });
    }
});

/**
 * GET /api/qbank/questions
 * Get all questions for browsing
 */
router.get('/questions', async (req, res) => {
    try {
        const { subject, difficulty, limit = 50 } = req.query;

        let questionQuery = 'SELECT id, subject, topic, stem, difficulty FROM questions WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (subject) {
            paramCount++;
            questionQuery += ` AND LOWER(subject) = LOWER($${paramCount})`;
            params.push(subject);
        }

        if (difficulty) {
            paramCount++;
            questionQuery += ` AND difficulty = $${paramCount}`;
            params.push(difficulty);
        }

        paramCount++;
        questionQuery += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        const result = await query(questionQuery, params);

        res.json({ questions: result.rows });
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
});

/**
 * POST /api/qbank/deep-dive
 * Generate a deep dive explanation for a question
 */
router.post('/deep-dive', async (req, res) => {
    try {
        const { questionId, selectedOption, correctOption, stem, subject } = req.body;

        const prompt = `
I am studying ${subject || 'Medicine'}.
I just answered a question:
"${stem}"

I selected option ${String.fromCharCode(65 + parseInt(selectedOption))} (index ${selectedOption}).
The correct answer is option ${String.fromCharCode(65 + parseInt(correctOption))} (index ${correctOption}).

Please provide a "Deep Dive" explanation.
1. Explain the core concept in depth.
2. Explain specifically why the correct answer is right.
3. Explain why my selected answer (if incorrect) is wrong, or common pitfalls if I was correct.
4. Provide high-yield clinical pearls or key associations.
        `;

        const result = await generateChatResponse(
            prompt, 
            [], // No specific context chunks needed, rely on model knowledge
            'comprehensive', 
            'NEET PG'
        );

        res.json({ content: result.response });
    } catch (err) {
        console.error('Error generating deep dive:', err);
        res.status(500).json({ message: 'Failed to generate deep dive', error: err.message });
    }
});

module.exports = router;
