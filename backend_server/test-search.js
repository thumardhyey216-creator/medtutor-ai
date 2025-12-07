require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function testKeywordSearch() {
    try {
        const cleanMessage = "drugs used in epilepsy";
        const retrievalDepth = 15;

        console.log('Testing keyword search for:', cleanMessage, '\n');

        // Extract keywords (same logic as chat.js)
        const keywords = cleanMessage
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5)
            .join(' & ');

        console.log('Extracted keywords:', keywords, '\n');

        // Test keyword search
        const result = await pool.query(
            `SELECT id, subject, topic, substring(text, 1, 150) as preview,
                    ts_rank(to_tsvector('english', text), to_tsquery('english', $1)) AS rank
             FROM content_chunks
             WHERE to_tsvector('english', text) @@ to_tsquery('english', $1)
                OR LOWER(text) ILIKE $2
                OR LOWER(subject) ILIKE $2
                OR LOWER(topic) ILIKE $2
             ORDER BY rank DESC
             LIMIT $3`,
            [keywords || 'medical', `%${cleanMessage.toLowerCase()}%`, Math.ceil(retrievalDepth / 2)]
        );

        console.log(`✅ Found ${result.rows.length} results\n`);

        if (result.rows.length > 0) {
            console.log('Top 3 results:');
            result.rows.slice(0, 3).forEach((row, i) => {
                console.log(`\n${i + 1}. Subject: ${row.subject}`);
                console.log(`   Topic: ${row.topic}`);
                console.log(`   Preview: ${row.preview}...`);
            });
        } else {
            console.log('⚠️  No results found - trying fallback search...\n');

            // Try fallback
            const fallback = await pool.query(
                `SELECT id, subject, topic, substring(text, 1, 150) as preview
                 FROM content_chunks
                 WHERE LOWER(text) ILIKE $1
                    OR LOWER(subject) ILIKE $1
                    OR LOWER(topic) ILIKE $1
                 LIMIT $2`,
                [`%${cleanMessage.toLowerCase()}%`, Math.ceil(retrievalDepth / 2)]
            );

            console.log(`Fallback found: ${fallback.rows.length} results`);
            if (fallback.rows.length > 0) {
                console.log('\nTop result:');
                console.log(`Subject: ${fallback.rows[0].subject}`);
                console.log(`Topic: ${fallback.rows[0].topic}`);
                console.log(`Preview: ${fallback.rows[0].preview}...`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

testKeywordSearch();
