-- Frontend Error Logs Table
-- Stores frontend errors reported by the monitoring system

CREATE TABLE IF NOT EXISTS frontend_error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL, -- 'error', 'crash', 'performance', 'network'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_agent TEXT,
  page_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying errors by type and time
CREATE INDEX IF NOT EXISTS idx_frontend_errors_type_time 
ON frontend_error_logs(error_type, timestamp DESC);

-- Index for querying by page URL
CREATE INDEX IF NOT EXISTS idx_frontend_errors_page 
ON frontend_error_logs(page_url, timestamp DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on tables
ALTER TABLE frontend_error_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on frontend_error_logs"
  ON frontend_error_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to view (read-only)
CREATE POLICY "Authenticated users can view frontend_error_logs"
  ON frontend_error_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to clean up old logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete old frontend error logs
  DELETE FROM frontend_error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Comments
COMMENT ON TABLE frontend_error_logs IS 'Stores frontend errors for monitoring and debugging';
COMMENT ON FUNCTION cleanup_old_error_logs IS 'Cleans up error logs older than 30 days';

