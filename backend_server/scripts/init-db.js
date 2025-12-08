const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false }, // Always use SSL for DATABASE_URL in production/cloud
          }
        : {
              host: process.env.DB_HOST || 'localhost',
              port: process.env.DB_PORT || 5432,
              database: process.env.DB_NAME || 'medtutor_db',
              user: process.env.DB_USER || 'postgres',
              password: process.env.DB_PASSWORD,
              ssl: { rejectUnauthorized: false },
          }
);

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
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    initDB();
}

module.exports = { initDB };
