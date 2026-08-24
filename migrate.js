// Optional standalone migration runner: `npm run migrate`.
// The server also runs this automatically on every boot (it's just
// `CREATE TABLE IF NOT EXISTS`, safe to run repeatedly), so you don't have to
// run this by hand -- it's here in case you want to provision the database
// once, ahead of the first deploy.
require('dotenv').config();
const { ensureSchema, pool } = require('./db');

ensureSchema()
  .then(() => {
    console.log('Schema is up to date.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
