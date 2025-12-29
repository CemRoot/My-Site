-- Performance Indexes for tech_news_articles table
-- Run this in Supabase SQL Editor to significantly improve query performance

-- Index for date ordering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_tech_news_date_desc 
ON tech_news_articles(date DESC, created_at DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_tech_news_category 
ON tech_news_articles(category);

-- Index for slug lookups (single article fetch)
CREATE INDEX IF NOT EXISTS idx_tech_news_slug 
ON tech_news_articles(slug);

-- Composite index for category + date (filtered listing)
CREATE INDEX IF NOT EXISTS idx_tech_news_category_date 
ON tech_news_articles(category, date DESC);

-- Index for created_at (used in ordering)
CREATE INDEX IF NOT EXISTS idx_tech_news_created_at 
ON tech_news_articles(created_at DESC);

-- Analyze the table to update statistics
ANALYZE tech_news_articles;

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tech_news_articles';
