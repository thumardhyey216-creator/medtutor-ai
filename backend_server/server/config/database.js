// ═══════════════════════════════════════════════════════════
// Database Configuration
// ═══════════════════════════════════════════════════════════

const { Pool } = require('pg');
const { URL } = require('url');

// Create PostgreSQL connection pool
// Check if using Supabase based on host URL
const isSupabase = (process.env.DB_HOST || '').includes('supabase.co');

let connectionConfig;

if (process.env.DATABASE_URL) {
    let connectionString = process.env.DATABASE_URL;

    // Supabase Pooler Fix:
    // If using Supabase Pooler (pooler.supabase.com), node-postgres often fails with "DbHandler exited"
    // or prepared statement errors. For a persistent backend (like Render),
    // it's better to use the Direct Connection (db.ref.supabase.co).
    if (connectionString.includes('pooler.supabase.com')) {
        try {
            const url = new URL(connectionString);
            // Check if username is in format postgres.ref
            const matches = url.username.match(/^postgres\.([a-z0-9]+)$/);
            if (matches && matches[1]) {
                const projectRef = matches[1];
                console.log(`\n⚠️  Detected Supabase Pooler URL. Switching to Direct Connection for stability.`);
                
                // Construct direct URL: postgres://postgres:[pwd]@db.[ref].supabase.co:5432/postgres
                url.hostname = `db.${projectRef}.supabase.co`;
                url.port = '5432';
                url.username = 'postgres'; // Standard user for direct connection
                
                connectionString = url.toString();
                console.log(`   Target: ${url.hostname} (Direct)`);
            }
        } catch (e) {
            console.warn('   Failed to optimize Supabase URL, using provided string:', e.message);
        }
    }

    connectionConfig = {
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }, // Supabase requires SSL, but CA often optional for direct
    };
} else {
    connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'medtutor_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        // Enable SSL for Supabase, disable for local if needed
        ssl: (process.env.DB_HOST || 'localhost').includes('localhost') ? false : { rejectUnauthorized: false },
    };
}

const pool = new Pool(connectionConfig);

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
