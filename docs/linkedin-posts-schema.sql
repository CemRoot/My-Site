-- LinkedIn Posts Database Schema
-- This table stores the LinkedIn automation workflow data

CREATE TABLE IF NOT EXISTS linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES tech_news_articles(id) ON DELETE CASCADE,
  ai_score INTEGER NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
  suggested_content TEXT NOT NULL,
  approved_content TEXT, -- User can edit the suggested content
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'posted', 'failed')),
  telegram_message_id INTEGER, -- Reference to Telegram approval message
  posted_at TIMESTAMP WITH TIME ZONE,
  linkedin_post_id TEXT, -- LinkedIn's post ID after successful posting
  engagement_data JSONB, -- Store likes, comments, shares data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_article_id ON linkedin_posts(article_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_created_at ON linkedin_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_ai_score ON linkedin_posts(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_telegram_msg ON linkedin_posts(telegram_message_id);

-- Unique constraint to prevent duplicate posts for same article
CREATE UNIQUE INDEX IF NOT EXISTS idx_linkedin_posts_article_unique 
ON linkedin_posts(article_id) 
WHERE status IN ('pending', 'approved', 'posted');

-- RLS (Row Level Security) policies
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to posted content (for analytics)
CREATE POLICY "Allow public read access to posted content" 
ON linkedin_posts FOR SELECT 
USING (status = 'posted');

-- Allow service role full access
CREATE POLICY "Allow service role full access" 
ON linkedin_posts FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_linkedin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_linkedin_posts_updated_at
BEFORE UPDATE ON linkedin_posts
FOR EACH ROW EXECUTE FUNCTION update_linkedin_posts_updated_at();

-- Function to get daily statistics
CREATE OR REPLACE FUNCTION get_daily_linkedin_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_analyzed INTEGER,
  total_approved INTEGER,
  total_posted INTEGER,
  total_failed INTEGER,
  avg_ai_score NUMERIC,
  top_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_analyzed,
    COUNT(*) FILTER (WHERE lp.status = 'approved')::INTEGER as total_approved,
    COUNT(*) FILTER (WHERE lp.status = 'posted')::INTEGER as total_posted,
    COUNT(*) FILTER (WHERE lp.status = 'failed')::INTEGER as total_failed,
    ROUND(AVG(lp.ai_score), 1) as avg_ai_score,
    (
      SELECT tna.category 
      FROM linkedin_posts lp2 
      JOIN tech_news_articles tna ON lp2.article_id = tna.id
      WHERE DATE(lp2.created_at) = target_date
      GROUP BY tna.category 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as top_category
  FROM linkedin_posts lp
  WHERE DATE(lp.created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly performance report
CREATE OR REPLACE FUNCTION get_weekly_linkedin_performance()
RETURNS TABLE (
  week_start DATE,
  total_posts INTEGER,
  success_rate NUMERIC,
  avg_score NUMERIC,
  top_performing_post TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('week', lp.created_at)::DATE as week_start,
    COUNT(*)::INTEGER as total_posts,
    ROUND(
      (COUNT(*) FILTER (WHERE lp.status = 'posted')::NUMERIC / COUNT(*)) * 100, 
      1
    ) as success_rate,
    ROUND(AVG(lp.ai_score), 1) as avg_score,
    (
      SELECT tna.title 
      FROM linkedin_posts lp2 
      JOIN tech_news_articles tna ON lp2.article_id = tna.id
      WHERE DATE_TRUNC('week', lp2.created_at) = DATE_TRUNC('week', lp.created_at)
        AND lp2.status = 'posted'
      ORDER BY lp2.ai_score DESC 
      LIMIT 1
    ) as top_performing_post
  FROM linkedin_posts lp
  WHERE lp.created_at >= NOW() - INTERVAL '4 weeks'
  GROUP BY DATE_TRUNC('week', lp.created_at)
  ORDER BY week_start DESC;
END;
$$ LANGUAGE plpgsql;

-- View for easy analytics
CREATE OR REPLACE VIEW linkedin_posts_analytics AS
SELECT 
  lp.id,
  lp.ai_score,
  lp.status,
  lp.created_at,
  lp.posted_at,
  tna.title,
  tna.category,
  tna.views,
  EXTRACT(EPOCH FROM (lp.posted_at - lp.created_at))/3600 as approval_time_hours
FROM linkedin_posts lp
JOIN tech_news_articles tna ON lp.article_id = tna.id
ORDER BY lp.created_at DESC;

-- Sample queries for monitoring:
-- 
-- Get today's statistics:
-- SELECT * FROM get_daily_linkedin_stats();
--
-- Get weekly performance:
-- SELECT * FROM get_weekly_linkedin_performance();
--
-- Get pending approvals:
-- SELECT * FROM linkedin_posts_analytics WHERE status = 'pending';
--
-- Get success rate by category:
-- SELECT 
--   tna.category,
--   COUNT(*) as total,
--   COUNT(*) FILTER (WHERE lp.status = 'posted') as posted,
--   ROUND((COUNT(*) FILTER (WHERE lp.status = 'posted')::NUMERIC / COUNT(*)) * 100, 1) as success_rate
-- FROM linkedin_posts lp
-- JOIN tech_news_articles tna ON lp.article_id = tna.id
-- WHERE lp.created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY tna.category
-- ORDER BY success_rate DESC;
