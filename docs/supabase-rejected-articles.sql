-- Rejected Articles Table
-- Tracks articles that were scraped but failed content validation
-- (e.g. AI refusal messages, too short content)

CREATE TABLE IF NOT EXISTS rejected_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  source_url TEXT,
  original_source TEXT,
  reason TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookup of rejected articles by source URL
CREATE INDEX IF NOT EXISTS idx_rejected_articles_source_url
  ON rejected_articles(source_url);

-- Index for date ordering
CREATE INDEX IF NOT EXISTS idx_rejected_articles_scraped_at
  ON rejected_articles(scraped_at DESC);

-- RLS (Row Level Security) - Optional but recommended
ALTER TABLE rejected_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
-- Note: Supabase service_role automatically bypasses RLS, so just enabling RLS
-- without any policies correctly restricts access to backend operations.
-- We can also explicitly define it if desired:
CREATE POLICY "Service role has full access on rejected_articles" ON rejected_articles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE rejected_articles IS 'Tracks articles rejected due to validation failures like AI refusals';
COMMENT ON COLUMN rejected_articles.reason IS 'Reason why the article was rejected (e.g., Too short, AI refusal)';
