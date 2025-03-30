-- Quiz Responses Table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  industry TEXT NOT NULL,
  selected_channels TEXT NOT NULL, -- JSON array
  responses TEXT NOT NULL, -- JSON object
  scores TEXT NOT NULL, -- JSON object
  timestamp TEXT NOT NULL
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  quiz_response_id TEXT NOT NULL,
  insights TEXT NOT NULL,
  recommendations TEXT NOT NULL, -- JSON array
  timestamp TEXT NOT NULL,
  FOREIGN KEY (quiz_response_id) REFERENCES quiz_responses(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_responses_timestamp ON quiz_responses(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_quiz_response_id ON reports(quiz_response_id);

-- Comments
PRAGMA foreign_keys = ON;

-- Notes:
-- 1. All JSON fields are stored as TEXT to maintain compatibility with SQLite
-- 2. Timestamps are stored in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
-- 3. The quiz_responses_timestamp index optimizes the admin page's response listing
-- 4. The reports_quiz_response_id index optimizes joining reports with responses
-- 5. Foreign key constraint ensures referential integrity between tables 