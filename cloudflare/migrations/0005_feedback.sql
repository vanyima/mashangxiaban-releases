CREATE TABLE IF NOT EXISTS feedback_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_ideas_created_at
  ON feedback_ideas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_ideas_client_created
  ON feedback_ideas(client_id, created_at DESC);
