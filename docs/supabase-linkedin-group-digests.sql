-- LinkedIn Group Digests Table
-- Tracks which articles have been used in LinkedIn Group digests
-- to prevent the same articles from being shared repeatedly

CREATE TABLE IF NOT EXISTS linkedin_group_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(100) NOT NULL,
  group_name VARCHAR(255) NOT NULL,
  article_ids UUID[] NOT NULL,
  digest_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional: Track if the post was actually shared
  was_posted BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMPTZ,
  
  -- Indexing for efficient queries
  CONSTRAINT unique_group_date UNIQUE (group_id, digest_date)
);

-- Index for efficient lookup of used article IDs
CREATE INDEX IF NOT EXISTS idx_linkedin_group_digests_created_at 
  ON linkedin_group_digests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_group_digests_group_id 
  ON linkedin_group_digests(group_id);

-- RLS (Row Level Security) - Optional but recommended
ALTER TABLE linkedin_group_digests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role has full access" ON linkedin_group_digests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE linkedin_group_digests IS 'Tracks LinkedIn Group digest posts to prevent article reuse';
COMMENT ON COLUMN linkedin_group_digests.article_ids IS 'Array of tech_news_articles UUIDs used in this digest';
COMMENT ON COLUMN linkedin_group_digests.digest_date IS 'Date the digest was generated (prevents duplicate digests per day)';
