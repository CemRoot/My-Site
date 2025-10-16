/**
 * Dynamic Open Graph Meta Generator
 * Generates HTML with proper OG tags for news articles
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug parameter required' });
  }

  try {
    // Fetch article from Supabase
    const { data: article, error } = await supabase
      .from('tech_news_articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Generate dynamic HTML with Open Graph tags
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Basic Meta -->
  <title>${article.title} | Cem Koyluoğlu Tech News</title>
  <meta name="description" content="${article.description}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${article.title}" />
  <meta property="og:description" content="${article.description}" />
  <meta property="og:url" content="https://cemkoyluoglu.codes/news/${slug}" />
  <meta property="og:image" content="${article.image_url || 'https://cemkoyluoglu.codes/og-default.jpg'}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Cem Koyluoğlu Tech News" />
  <meta property="article:published_time" content="${article.created_at}" />
  <meta property="article:author" content="Cem Koyluoğlu" />
  <meta property="article:section" content="${article.category || 'Technology'}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${article.title}" />
  <meta name="twitter:description" content="${article.description}" />
  <meta name="twitter:image" content="${article.image_url || 'https://cemkoyluoglu.codes/og-default.jpg'}" />
  <meta name="twitter:creator" content="@cemkoyluoglu" />
  
  <!-- LinkedIn specific -->
  <meta property="og:locale" content="en_US" />
  
  <!-- Redirect to main site after 2 seconds -->
  <meta http-equiv="refresh" content="2;url=https://cemkoyluoglu.codes/#/news/${slug}" />
  
  <style>
    body { 
      font-family: Arial, sans-serif; 
      text-align: center; 
      padding: 50px; 
      background: #f5f5f5; 
    }
    .loading { 
      color: #666; 
      font-size: 18px; 
    }
    .article-preview {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .article-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
    }
    .article-description {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .redirect-info {
      font-size: 14px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="article-preview">
    <div class="article-title">${article.title}</div>
    <div class="article-description">${article.description}</div>
    <div class="redirect-info">
      📖 Redirecting to full article...
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('OG Meta generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

