-- Conversation States Table for Telegram Multi-Step Interactions
-- This table stores temporary conversation states for features like manual article addition

CREATE TABLE IF NOT EXISTS conversation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL, -- Telegram user ID
  step TEXT NOT NULL, -- Current step: 'awaiting_url', 'confirm_source', 'awaiting_original_source', 'awaiting_digest_edit'
  article_url TEXT, -- The article URL being processed
  original_source TEXT, -- Custom original source URL (if different)
  digest_id BIGINT, -- LinkedIn digest ID (for digest editing workflow)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'), -- Auto-expire after 10 minutes

  CONSTRAINT unique_user_conversation UNIQUE (user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_conversation_states_user_id ON conversation_states(user_id);

-- Index for cleanup of expired states
CREATE INDEX IF NOT EXISTS idx_conversation_states_expires_at ON conversation_states(expires_at);

-- Auto-cleanup trigger (optional, can also be done via cron)
-- This will automatically delete expired states
CREATE OR REPLACE FUNCTION cleanup_expired_conversation_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM conversation_states WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert to clean up old states
CREATE TRIGGER trigger_cleanup_expired_states
AFTER INSERT ON conversation_states
EXECUTE FUNCTION cleanup_expired_conversation_states();

-- Example queries:

-- Get user's current conversation state
-- SELECT * FROM conversation_states WHERE user_id = 123456789 AND expires_at > NOW();

-- Set new state
-- INSERT INTO conversation_states (user_id, step, article_url)
-- VALUES (123456789, 'awaiting_url', NULL)
-- ON CONFLICT (user_id) 
-- DO UPDATE SET 
--   step = EXCLUDED.step,
--   article_url = EXCLUDED.article_url,
--   created_at = NOW(),
--   expires_at = NOW() + INTERVAL '10 minutes';

-- Delete user's state
-- DELETE FROM conversation_states WHERE user_id = 123456789;

-- Manual cleanup of expired states
-- DELETE FROM conversation_states WHERE expires_at < NOW();

