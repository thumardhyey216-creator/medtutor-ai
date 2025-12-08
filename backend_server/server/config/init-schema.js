
const { query } = require('./database');

async function initSchema() {
    console.log('🔄 Checking database schema...');
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS api_usage (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                feature VARCHAR(50) NOT NULL,
                input_tokens INTEGER DEFAULT 0,
                output_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                model VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        await query(`
            CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
        `);

        console.log('✅ Database schema verified.');
    } catch (err) {
        console.error('❌ Schema initialization failed:', err);
        // Don't exit process, allow server to try running anyway (maybe DB is down momentarily)
    }
}

module.exports = { initSchema };
