CREATE TABLE IF NOT EXISTS radar_presence (
  device_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  status TEXT NOT NULL,
  status_copy TEXT NOT NULL,
  tone TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  app_version TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_radar_presence_updated_at ON radar_presence(updated_at);
