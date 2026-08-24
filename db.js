const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in (see SETUP.md).');
  process.exit(1);
}

// Neon (and most hosted Postgres providers) require SSL; a bare local Postgres
// during development typically does not offer/require it. Detect from the
// connection string so the same code works in both places.
const needsSsl = /sslmode=require/i.test(connectionString) || /neon\.tech/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // A background/idle client error should not crash the whole server.
  console.error('Unexpected Postgres pool error:', err);
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, ensureSchema };
