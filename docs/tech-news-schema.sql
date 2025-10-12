-- ============================================================
-- Tech News Articles Table
-- Stores scraped and translated tech news from Nuvemmag
-- ============================================================

-- Create the tech_news_articles table
CREATE TABLE IF NOT EXISTS tech_news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Article content
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  original_title TEXT,
  
  -- Media
  image_url TEXT,
  
  -- Metadata
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  original_source TEXT,
  slug TEXT UNIQUE NOT NULL,
  
  -- Stats
  views INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tech_news_category ON tech_news_articles(category);
CREATE INDEX IF NOT EXISTS idx_tech_news_date ON tech_news_articles(date DESC);
CREATE INDEX IF NOT EXISTS idx_tech_news_created_at ON tech_news_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tech_news_slug ON tech_news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_tech_news_source_url ON tech_news_articles(source_url);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_tech_news_search ON tech_news_articles 
USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));

-- Enable Row Level Security (RLS)
ALTER TABLE tech_news_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read all articles
CREATE POLICY "Allow public to read articles" 
ON tech_news_articles 
FOR SELECT 
TO anon
USING (true);

-- Policy: Allow public to read articles (authenticated)
CREATE POLICY "Allow authenticated to read articles" 
ON tech_news_articles 
FOR SELECT 
TO authenticated
USING (true);

-- Policy: Only service role can insert (scraper)
CREATE POLICY "Allow service role to insert articles" 
ON tech_news_articles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy: Only service role can update
CREATE POLICY "Allow service role to update articles" 
ON tech_news_articles 
FOR UPDATE 
TO service_role
USING (true);

-- Policy: Only service role can delete
CREATE POLICY "Allow service role to delete articles" 
ON tech_news_articles 
FOR DELETE 
TO service_role
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tech_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tech_news_updated_at_trigger ON tech_news_articles;
CREATE TRIGGER update_tech_news_updated_at_trigger
BEFORE UPDATE ON tech_news_articles
FOR EACH ROW
EXECUTE FUNCTION update_tech_news_updated_at();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tech_news_articles
  SET views = views + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE tech_news_articles IS 'Stores tech news articles scraped from Nuvemmag and translated to English';
COMMENT ON COLUMN tech_news_articles.source_url IS 'Original Nuvemmag article URL (unique identifier)';
COMMENT ON COLUMN tech_news_articles.slug IS 'URL-friendly slug for article routing';
COMMENT ON COLUMN tech_news_articles.category IS 'AI Applications, AI, Tech, Science, Sustainability, News, Latest News';
COMMENT ON COLUMN tech_news_articles.original_source IS 'Original source if article was republished on Nuvemmag';

