// ═══════════════════════════════════════════════════════════
// RAG Service (Hybrid Search)
// ═══════════════════════════════════════════════════════════

const { query } = require('../config/database');
const { generateEmbedding } = require('./gemini');

/**
 * Perform hybrid search (Vector + Keyword) on content_chunks
 * @param {string} searchText - The text to search for
 * @param {number} limit - Max number of results (default: 10)
 * @param {number} similarityThreshold - Minimum similarity for vector search (default: 0.5 - purely advisory, we sort by distance)
 * @returns {Promise<Array>} Array of unique content chunks
 */
async function searchContentChunks(searchText, limit = 10) {
    try {
        if (!searchText || typeof searchText !== 'string' || searchText.trim().length === 0) {
            return [];
        }

        const cleanText = searchText.trim();
        console.log(`🔍 Executing Hybrid Search for: "${cleanText.substring(0, 50)}..." (Limit: ${limit})`);

        // 1. Generate Embedding
        let userEmbedding = null;
        try {
            userEmbedding = await generateEmbedding(cleanText);
        } catch (e) {
            console.warn('⚠️ Embedding generation failed, falling back to keyword only:', e.message);
        }

        // 2. Extract Keywords
        const keywords = cleanText
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5)
            .join(' & ');

        const promises = [];

        // 3. Vector Search (if embedding available)
        if (userEmbedding) {
            promises.push(
                query(
                    `SELECT id, subject, topic, text, 
                            1 - (embedding <=> $1::vector) AS similarity,
                            'vector' as source
                     FROM content_chunks
                     WHERE embedding IS NOT NULL
                     ORDER BY embedding <=> $1::vector
                     LIMIT $2`,
                    [JSON.stringify(userEmbedding), limit]
                ).catch(err => {
                    console.warn('⚠️ Vector search failed:', err.message);
                    return { rows: [] };
                })
            );
        } else {
            promises.push(Promise.resolve({ rows: [] }));
        }

        // 4. Keyword Search
        promises.push(
            query(
                `SELECT id, subject, topic, text,
                        ts_rank(to_tsvector('english', text), to_tsquery('english', $1)) AS rank,
                        'keyword' as source
                 FROM content_chunks
                 WHERE to_tsvector('english', text) @@ to_tsquery('english', $1)
                    OR LOWER(text) ILIKE $2
                    OR LOWER(subject) ILIKE $2
                    OR LOWER(topic) ILIKE $2
                 ORDER BY rank DESC
                 LIMIT $3`,
                [keywords || 'medical', `%${cleanText.toLowerCase()}%`, Math.ceil(limit / 2)]
            ).catch(err => {
                console.warn('⚠️ Keyword search failed, using ILIKE fallback:', err.message);
                return query(
                    `SELECT id, subject, topic, text, 'fallback' as source
                     FROM content_chunks
                     WHERE LOWER(text) ILIKE $1
                        OR LOWER(subject) ILIKE $1
                        OR LOWER(topic) ILIKE $1
                     LIMIT $2`,
                    [`%${cleanText.toLowerCase()}%`, Math.ceil(limit / 2)]
                ).catch(e => ({ rows: [] }));
            })
        );

        // 5. Execute in Parallel
        const [vectorResults, keywordResults] = await Promise.all(promises);

        // 6. Combine and Deduplicate
        const combined = [...vectorResults.rows, ...keywordResults.rows];
        const uniqueMap = new Map();
        
        combined.forEach(item => {
            if (!uniqueMap.has(item.id)) {
                uniqueMap.set(item.id, item);
            }
        });

        const results = Array.from(uniqueMap.values());
        console.log(`✅ Found ${results.length} unique relevant chunks.`);
        
        return results;

    } catch (err) {
        console.error('❌ Error in searchContentChunks:', err);
        return [];
    }
}

module.exports = {
    searchContentChunks
};
