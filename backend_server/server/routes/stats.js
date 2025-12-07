// ═══════════════════════════════════════════════════════════
// Stats Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateStudyPlan } = require('../services/gemini');

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/stats/overview
 * Get overview statistics
 */
router.get('/overview', async (req, res) => {
    try {
        const userId = req.user.id;
        const range = req.query.range || '7d';

        // Calculate date range
        const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

        // Initialize default stats
        let stats = {
            streak: 0,
            questionsSolved: 0,
            questionsThisWeek: 0,
            accuracy: 0,
            accuracyChange: 0,
            studyHours: 0,
            hoursThisWeek: 0,
            subjects: [],
            weakTopics: [],
            suggestions: {
                text: 'Start practicing to see personalized recommendations!',
                topics: []
            }
        };

        try {
            // Questions solved and accuracy
            const questionsResult = await query(
                `SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN qa.attempted_at >= CURRENT_DATE - INTERVAL '${days} days' THEN 1 END) as this_period,
                    AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END) as accuracy
                 FROM question_attempts qa
                 JOIN qbank_sessions qs ON qa.session_id = qs.id
                 WHERE qs.user_id = $1`,
                [userId]
            );

            const qStats = questionsResult.rows[0];
            stats.questionsSolved = parseInt(qStats.total) || 0;
            stats.questionsThisWeek = parseInt(qStats.this_period) || 0;
            stats.accuracy = Math.round(qStats.accuracy || 0);
        } catch (err) {
            console.error('Error fetching question stats:', err);
        }

        try {
            // Study streak (count of distinct days with activity)
            const streakResult = await query(
                `SELECT COUNT(DISTINCT DATE(qa.attempted_at)) as streak
                 FROM question_attempts qa
                 JOIN qbank_sessions qs ON qa.session_id = qs.id
                 WHERE qs.user_id = $1 AND qa.attempted_at >= CURRENT_DATE - INTERVAL '30 days'`,
                [userId]
            );
            stats.streak = parseInt(streakResult.rows[0]?.streak || 0);
        } catch (err) {
            console.error('Error fetching streak:', err);
        }

        try {
            // Study time from sessions
            const timeResult = await query(
                `SELECT 
                    COALESCE(SUM(time_taken), 0) as total_seconds,
                    COALESCE(SUM(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '${days} days' THEN time_taken ELSE 0 END), 0) as this_period_seconds
                 FROM qbank_sessions
                 WHERE user_id = $1 AND completed_at IS NOT NULL`,
                [userId]
            );
            const timeStats = timeResult.rows[0];
            stats.studyHours = Math.round((timeStats.total_seconds || 0) / 3600);
            stats.hoursThisWeek = Math.round((timeStats.this_period_seconds || 0) / 3600);
        } catch (err) {
            console.error('Error fetching time stats:', err);
        }

        try {
            // Subject performance
            const subjectsResult = await query(
                `SELECT 
                    q.subject as name,
                    COUNT(qa.id) as questions_count,
                    AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) as accuracy
                 FROM question_attempts qa
                 JOIN questions q ON qa.question_id = q.id
                 JOIN qbank_sessions qs ON qa.session_id = qs.id
                 WHERE qs.user_id = $1
                 GROUP BY q.subject
                 ORDER BY accuracy ASC
                 LIMIT 10`,
                [userId]
            );

            stats.subjects = subjectsResult.rows.map(s => ({
                name: s.name || 'General',
                questionsCount: parseInt(s.questions_count),
                accuracy: Math.round(s.accuracy || 0),
            }));
        } catch (err) {
            console.error('Error fetching subject stats:', err);
        }

        try {
            // Weak topics (accuracy < 60%)
            const weakTopicsResult = await query(
                `SELECT 
                    q.subject,
                    q.topic as name,
                    q.topic as id,
                    COUNT(qa.id) as attempts,
                    AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) as accuracy
                 FROM question_attempts qa
                 JOIN questions q ON qa.question_id = q.id
                 JOIN qbank_sessions qs ON qa.session_id = qs.id
                 WHERE qs.user_id = $1
                 GROUP BY q.subject, q.topic
                 HAVING COUNT(qa.id) >= 3 AND AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) < 60
                 ORDER BY accuracy ASC, attempts DESC
                 LIMIT 5`,
                [userId]
            );

            stats.weakTopics = weakTopicsResult.rows.map(t => ({
                id: t.id,
                subject: t.subject || 'General',
                name: t.name || 'Mixed',
                accuracy: Math.round(t.accuracy || 0),
            }));

            if (stats.weakTopics.length > 0) {
                stats.suggestions = {
                    text: 'Focus on your weak areas and maintain consistent daily practice',
                    topics: stats.weakTopics.slice(0, 3).map(t => t.name),
                };
            }
        } catch (err) {
            console.error('Error fetching weak topics:', err);
        }

        res.json(stats);
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/stats/by-subject
 * Get detailed subject performance
 */
router.get('/by-subject', async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT 
                q.subject,
                COUNT(qa.id) as total_questions,
                SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_answers,
                AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) as accuracy,
                AVG(qa.time_taken_sec) as avg_time
             FROM question_attempts qa
             JOIN questions q ON qa.question_id = q.id
             JOIN qbank_sessions qs ON qa.session_id = qs.id
             WHERE qs.user_id = $1
             GROUP BY q.subject
             ORDER BY q.subject`,
            [userId]
        );

        res.json({ subjects: result.rows });
    } catch (err) {
        console.error('Error fetching subject stats:', err);
        res.status(500).json({ message: 'Failed to fetch subject statistics' });
    }
});

/**
 * GET /api/stats/activity
 * Get daily activity data
 */
router.get('/activity', async (req, res) => {
    try {
        const userId = req.user.id;
        const range = req.query.range || '7d';
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 7;

        const result = await query(
            `SELECT 
                DATE(qa.attempted_at) as date,
                COUNT(qa.id) as questions,
                SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct
             FROM question_attempts qa
             JOIN qbank_sessions qs ON qa.session_id = qs.id
             WHERE qs.user_id = $1 AND qa.attempted_at >= CURRENT_DATE - INTERVAL '${days} days'
             GROUP BY DATE(qa.attempted_at)
             ORDER BY date`,
            [userId]
        );

        res.json({ activity: result.rows });
    } catch (err) {
        console.error('Error fetching activity:', err);
        res.status(500).json({ message: 'Failed to fetch activity data' });
    }
});

/**
 * GET /api/stats/accuracy
 * Get accuracy trend
 */
router.get('/accuracy', async (req, res) => {
    try {
        const userId = req.user.id;
        const range = req.query.range || '7d';
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 7;

        const result = await query(
            `SELECT 
                DATE(qa.attempted_at) as date,
                AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) as accuracy
             FROM question_attempts qa
             JOIN qbank_sessions qs ON qa.session_id = qs.id
             WHERE qs.user_id = $1 AND qa.attempted_at >= CURRENT_DATE - INTERVAL '${days} days'
             GROUP BY DATE(qa.attempted_at)
             ORDER BY date`,
            [userId]
        );

        res.json({ trend: result.rows });
    } catch (err) {
        console.error('Error fetching accuracy trend:', err);
        res.status(500).json({ message: 'Failed to fetch accuracy data' });
    }
});

/**
 * GET /api/stats/today-plan
 * Get AI-generated study plan for today
 */
router.get('/today-plan', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get weak areas
        let weakAreas = [];
        try {
            const weakAreasResult = await query(
                `SELECT 
                    q.subject,
                    q.topic,
                    AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) as accuracy,
                    COUNT(qa.id) as attempts
                 FROM question_attempts qa
                 JOIN questions q ON qa.question_id = q.id
                 JOIN qbank_sessions qs ON qa.session_id = qs.id
                 WHERE qs.user_id = $1
                 GROUP BY q.subject, q.topic
                 HAVING COUNT(qa.id) >= 3
                 ORDER BY accuracy ASC
                 LIMIT 5`,
                [userId]
            );
            weakAreas = weakAreasResult.rows;
        } catch (err) {
            console.error('Error fetching weak areas:', err);
        }

        // Get overall performance
        let performance = { total_questions: 0, accuracy: 0 };
        try {
            const performanceResult = await query(
                `SELECT 
                    COUNT(qa.id) as total_questions,
                    AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0 END) as accuracy
                 FROM question_attempts qa
                 JOIN qbank_sessions qs ON qa.session_id = qs.id
                 WHERE qs.user_id = $1`,
                [userId]
            );
            performance = performanceResult.rows[0];
        } catch (err) {
            console.error('Error fetching performance:', err);
        }

        // Generate AI study plan
        let plan;
        try {
            plan = await generateStudyPlan(weakAreas, performance);
        } catch (aiErr) {
            console.error('AI study plan error:', aiErr);
            // Fallback plan
            plan = {
                suggestedTopics: weakAreas.slice(0, 3).map(w => w.topic || 'General'),
                planDescription: 'Focus on your weak areas and practice consistently',
                questionsCount: 30,
                estimatedTime: '45 mins'
            };
        }

        res.json({ plan });
    } catch (err) {
        console.error('Error generating study plan:', err);
        res.status(500).json({ message: 'Failed to generate study plan' });
    }
});

module.exports = router;
