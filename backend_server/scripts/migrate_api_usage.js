
const { query } = require('../server/config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Try parent dir first? No, let's try standard
// If that didn't work, try current dir
if (!process.env.DB_NAME) {
    require('dotenv').config();
}

async function migrate() {
    try {
        console.log('Starting migration...');
        
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

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
