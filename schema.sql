-- You Bet! -- key/value store backing the app's persistence layer.
-- Every "shared" piece of league state (league config, chat, avatars,
-- stickers, notifications) is stored as one row per key, value as text
-- (the app JSON-stringifies before saving and parses after loading, so
-- this table never needs to understand the shape of the data itself).
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
