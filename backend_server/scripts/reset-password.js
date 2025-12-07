const { Client } = require('pg');

async function resetPassword() {
    const c = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres'
    });

    await c.connect();
    await c.query("ALTER USER postgres WITH PASSWORD 'dhyeythumar1'");
    console.log('✅ Password reset successfully with SCRAM-SHA-256!');
    await c.end();
}

resetPassword().catch(e => console.log('Error:', e.message));
