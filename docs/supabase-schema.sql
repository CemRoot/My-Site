-- ============================================================
-- Newsletter Subscribers Table
-- Secure storage for email subscriptions
-- GDPR Compliant with Row Level Security (RLS)
-- ============================================================

-- Create the newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'website',
  status VARCHAR(20) DEFAULT 'active',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at);

-- Enable Row Level Security (RLS)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow public to insert (subscribe)
CREATE POLICY "Allow public to subscribe" 
ON newsletter_subscribers 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policy: Prevent public reading (privacy protection)
CREATE POLICY "Prevent public reading subscribers" 
ON newsletter_subscribers 
FOR SELECT 
TO anon
USING (false);

-- Create policy: Allow authenticated users (admin) to read all
CREATE POLICY "Allow admin to read subscribers" 
ON newsletter_subscribers 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy: Allow admin to update
CREATE POLICY "Allow admin to update subscribers" 
ON newsletter_subscribers 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy: Allow admin to delete
CREATE POLICY "Allow admin to delete subscribers" 
ON newsletter_subscribers 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE newsletter_subscribers IS 'Stores newsletter subscription data with GDPR compliance';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Subscriber email address (unique)';
COMMENT ON COLUMN newsletter_subscribers.subscribed_at IS 'Timestamp when user subscribed';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Source of subscription (website, api, etc.)';
COMMENT ON COLUMN newsletter_subscribers.status IS 'Subscription status (active, unsubscribed, bounced)';
COMMENT ON COLUMN newsletter_subscribers.ip_address IS 'IP address of subscriber (for fraud detection)';
COMMENT ON COLUMN newsletter_subscribers.user_agent IS 'Browser user agent (for analytics)';

-- ============================================================
-- Test queries (run these to verify setup)
-- ============================================================

-- Check table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'newsletter_subscribers';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'newsletter_subscribers';

-- View policies
SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscribers';

-- Test insert (should work as anon)
-- INSERT INTO newsletter_subscribers (email, source) VALUES ('test@example.com', 'website');

-- View count (as admin)
-- SELECT COUNT(*) FROM newsletter_subscribers;

-- ============================================================
-- System Settings Table
-- Stores application-wide configuration and settings
-- Used for n8n trial tracking, feature flags, etc.
-- ============================================================

-- Create the system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow service role to read all
CREATE POLICY "Allow service role to read settings" 
ON system_settings 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy: Allow service role to insert
CREATE POLICY "Allow service role to insert settings" 
ON system_settings 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy: Allow service role to update
CREATE POLICY "Allow service role to update settings" 
ON system_settings 
FOR UPDATE 
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial settings for n8n trial tracking
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) VALUES
  ('n8n_trial_start_date', '2025-01-14', 'n8n trial başlangıç tarihi (14 günlük deneme)', 'system'),
  ('n8n_trial_duration_days', '14', 'n8n deneme süresi (gün cinsinden)', 'system'),
  ('webhook_last_reset_date', '2025-01-14', 'Telegram webhook son reset tarihi', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE system_settings IS 'Stores system-wide configuration and settings';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.setting_value IS 'Value of the setting (stored as text)';
COMMENT ON COLUMN system_settings.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN system_settings.updated_by IS 'User/system that updated the setting';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of the setting';

-- ============================================================
-- Test queries for system_settings
-- ============================================================

-- Check table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'system_settings';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'system_settings';

-- View all settings
-- SELECT * FROM system_settings;

-- Get specific setting
-- SELECT setting_value FROM system_settings WHERE setting_key = 'n8n_trial_start_date';

-- Update setting
-- UPDATE system_settings SET setting_value = '2025-01-28', updated_by = 'admin' WHERE setting_key = 'n8n_trial_start_date';

