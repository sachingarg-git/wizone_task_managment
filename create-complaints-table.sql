-- Drop existing table if it exists with old schema
DROP TABLE IF EXISTS complaints CASCADE;

-- Create complaints table with new schema
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  complaint_id VARCHAR NOT NULL UNIQUE,
  engineer_id INTEGER NOT NULL REFERENCES users(id),
  engineer_name VARCHAR NOT NULL,
  engineer_email VARCHAR,
  subject VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending',
  status_note TEXT,
  status_history JSONB DEFAULT '[]',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_engineer_id ON complaints(engineer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
