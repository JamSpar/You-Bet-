require('dotenv').config();
const express = require('express');
const path = require('path');
const { pool, ensureSchema } = require('./db');

const app = express();

// Avatars/stickers are base64 data URIs saved through this same API, so the
// JSON body limit needs real headroom -- 15mb comfortably covers a handful
// of profile-photo-sized images per request.
app.use(express.json({ limit: '15mb' }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

// Bulk-fetch every shared key in one round trip. The frontend calls this once
// on load and then on a ~4s poll to pick up changes made by other devices.
app.get('/api/kv', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM kv');
    const data = {};
    for (const row of rows) data[row.key] = row.value;
    res.json({ ok: true, data });
  } catch (err) {
    console.error('GET /api/kv failed:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// Upsert (or delete, when a value is null) a batch of keys in one transaction.
// The frontend debounces multiple same-tick writes (e.g. a market creation
// touching both league state and notifications) into a single call here.
app.put('/api/kv/batch', async (req, res) => {
  const writes = req.body && req.body.writes;
  if (!writes || typeof writes !== 'object' || Array.isArray(writes)) {
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }
  const entries = Object.entries(writes);
  if (entries.length === 0) {
    return res.json({ ok: true });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of entries) {
      if (value === null) {
        await client.query('DELETE FROM kv WHERE key = $1', [key]);
      } else {
        await client.query(
          `INSERT INTO kv (key, value, updated_at) VALUES ($1, $2, now())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [key, String(value)]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/kv/batch failed:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  } finally {
    client.release();
  }
});

// Serve the app itself.
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`You Bet! server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });
