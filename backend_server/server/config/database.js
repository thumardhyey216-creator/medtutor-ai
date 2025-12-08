// ═══════════════════════════════════════════════════════════
// Database Configuration
// ═══════════════════════════════════════════════════════════

const { Pool } = require('pg');

// Create PostgreSQL connection pool
// Check if using Supabase based on host URL
const isSupabase = (process.env.DB_HOST || '').includes('supabase.co');

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false },
          }
        : {
              host: process.env.DB_HOST || 'localhost',
              port: process.env.DB_PORT || 5432,
              database: process.env.DB_NAME || 'medtutor_db',
              user: process.env.DB_USER || 'postgres',
              password: process.env.DB_PASSWORD,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 10000,
              // Enable SSL for Supabase, disable for local if needed
              ssl: { rejectUnauthorized: false },
          }
);

// Test connection
pool.on('connect', () => {
    // console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Log connection details on startup
console.log(`\n🔌 Database Configuration:`);
if (process.env.DATABASE_URL) {
    console.log(`   Using DATABASE_URL`);
    console.log(`   SSL: ${process.env.NODE_ENV === 'production'}`);
} else {
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   SSL: ${!!(process.env.DB_HOST && process.env.DB_HOST.includes('supabase'))}\n`);
}

// Query helper
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // console.log('Query executed', { text: text.substring(0, 50), duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
}

// Transaction helper
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    transaction,
    pool,
};
