CREATE TABLE IF NOT EXISTS radar_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_device_id TEXT NOT NULL,
  recipient_device_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_radar_messages_recipient_created
  ON radar_messages(recipient_device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_radar_messages_sender_created
  ON radar_messages(sender_device_id, created_at DESC);
