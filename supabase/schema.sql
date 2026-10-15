-- PorkPro Cloud Backup Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Create the backups table
CREATE TABLE IF NOT EXISTS app_backups (
  id TEXT PRIMARY KEY DEFAULT 'main_backup',
  state_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_backups ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone with anon key to read/write (for simplicity)
-- For production, you'd want proper auth
CREATE POLICY "Allow all operations" ON app_backups
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index on updated_at for quick last-backup lookups
CREATE INDEX IF NOT EXISTS idx_app_backups_updated_at ON app_backups (updated_at DESC);

-- Grant necessary permissions
GRANT ALL ON app_backups TO anon;
GRANT ALL ON app_backups TO authenticated;
