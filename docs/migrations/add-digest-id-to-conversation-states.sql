-- Migration: Add digest_id column to conversation_states table
-- Date: 2025-10-30
-- Purpose: Support LinkedIn digest editing workflow via n8n

-- Add digest_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversation_states'
    AND column_name = 'digest_id'
  ) THEN
    ALTER TABLE conversation_states ADD COLUMN digest_id BIGINT;

    -- Add comment
    COMMENT ON COLUMN conversation_states.digest_id IS 'LinkedIn digest ID for digest editing workflow';

    -- Log success
    RAISE NOTICE 'Column digest_id added to conversation_states table';
  ELSE
    RAISE NOTICE 'Column digest_id already exists in conversation_states table';
  END IF;
END $$;

-- Update step comment to include new step
COMMENT ON COLUMN conversation_states.step IS 'Current step: awaiting_url, confirm_source, awaiting_original_source, awaiting_digest_edit';
