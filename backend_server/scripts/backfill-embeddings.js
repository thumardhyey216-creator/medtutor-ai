// ═══════════════════════════════════════════════════════════
// Backfill Embeddings for Content Chunks
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const { pool } = require('../server/config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const BATCH_SIZE = 5; // Small batch to avoid rate limits
const DELAY_MS = 2000; // 2 seconds delay between chunks
const API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-004';

const genAI = new GoogleGenerativeAI(API_KEY);

async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (err) {
        console.error('⚠️  Gemini API Error:', err.message);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillEmbeddings() {
    console.log('🚀 Starting Embedding Backfill...\n');

    while (true) {
        const client = await pool.connect();
        try {
            // Fetch chunks without embeddings
            const res = await client.query(`
                SELECT id, text 
                FROM content_chunks 
                WHERE embedding IS NULL 
                LIMIT $1
            `, [BATCH_SIZE]);

            if (res.rows.length === 0) {
                console.log('✅ All chunks have embeddings!');
                break;
            }

            console.log(`📦 Processing batch of ${res.rows.length} chunks...`);

            for (const row of res.rows) {
                const embedding = await generateEmbedding(row.text);

                if (embedding) {
                    await client.query(`
                        UPDATE content_chunks 
                        SET embedding = $1 
                        WHERE id = $2
                    `, [`[${embedding.join(',')}]`, row.id]);
                    process.stdout.write('.');
                } else {
                    process.stdout.write('x');
                }

                // Rate limiting delay
                await sleep(DELAY_MS);
            }
            console.log('\n');

        } catch (err) {
            console.error('❌ Error in backfill loop:', err);
            await sleep(5000); // Wait longer on error
        } finally {
            client.release();
        }
    }

    process.exit(0);
}

backfillEmbeddings().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
