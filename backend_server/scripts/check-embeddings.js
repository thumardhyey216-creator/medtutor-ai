
require('dotenv').config();
const { pool } = require('../server/config/database');

async function checkEmbeddings() {
    try {
        console.log('🔍 Checking database content and embeddings...\n');

        // Check total chunks
        const totalResult = await pool.query('SELECT COUNT(*) FROM content_chunks');
        const total = parseInt(totalResult.rows[0].count);
        console.log(`Total content chunks: ${total}`);

        // Check chunks with embeddings
        const embeddingResult = await pool.query('SELECT COUNT(*) FROM content_chunks WHERE embedding IS NOT NULL');
        const withEmbeddings = parseInt(embeddingResult.rows[0].count);
        console.log(`Chunks with embeddings: ${withEmbeddings}`);

        // Calculate percentage
        const percentage = total > 0 ? ((withEmbeddings / total) * 100).toFixed(1) : 0;
        console.log(`Coverage: ${percentage}%\n`);

        if (total > 0) {
            // Check a sample
            const sampleResult = await pool.query('SELECT id, subject, topic, substring(text, 1, 100) as preview, embedding IS NOT NULL as has_embedding FROM content_chunks LIMIT 5');
            console.log('Sample chunks:');
            sampleResult.rows.forEach(row => {
                console.log(`- [${row.id}] ${row.subject} / ${row.topic}: ${row.has_embedding ? '✅ Has Embedding' : '❌ No Embedding'}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Error checking embeddings:', err);
        process.exit(1);
    }
}

checkEmbeddings();
