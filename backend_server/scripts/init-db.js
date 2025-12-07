const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('supabase') ? { rejectUnauthorized: false } : false
});

async function initDB() {
    try {
        console.log('🔌 Connecting to database...');
        const client = await pool.connect();
        
        console.log('📄 Reading SQL schema...');
        const sqlPath = path.join(__dirname, 'init-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('🚀 Executing schema initialization...');
        await client.query(sql);
        
        console.log('✅ Database initialized successfully!');
        client.release();
    } catch (err) {
        console.error('❌ Database initialization failed:', err);
    } finally {
        // Only close pool if running as standalone script
        if (require.main === module) {
            await pool.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    initDB();
}

module.exports = { initDB };
