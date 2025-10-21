-- ============================================
-- Vercel Status Notifications Table
-- ============================================
-- Tracks notified Vercel incidents to prevent duplicate alerts
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vercel_status_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL UNIQUE,
  incident_title TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vercel_status_incident_id 
  ON vercel_status_notifications(incident_id);

CREATE INDEX IF NOT EXISTS idx_vercel_status_notified_at 
  ON vercel_status_notifications(notified_at DESC);

-- Add comment
COMMENT ON TABLE vercel_status_notifications IS 
  'Tracks Vercel status incidents that have been notified to Telegram to prevent duplicates';

-- Enable Row Level Security (RLS)
ALTER TABLE vercel_status_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access
CREATE POLICY "Allow service role full access"
  ON vercel_status_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON vercel_status_notifications TO service_role;
GRANT SELECT ON vercel_status_notifications TO authenticated;

-- ============================================
-- Cleanup old notifications (optional)
-- ============================================
-- Auto-delete notifications older than 30 days
-- You can run this manually or set up a cron job

-- DELETE FROM vercel_status_notifications 
-- WHERE notified_at < NOW() - INTERVAL '30 days';

