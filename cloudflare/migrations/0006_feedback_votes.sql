CREATE TABLE IF NOT EXISTS feedback_votes (
  idea_id INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (idea_id, client_id),
  FOREIGN KEY (idea_id) REFERENCES feedback_ideas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_votes_idea
  ON feedback_votes(idea_id);
