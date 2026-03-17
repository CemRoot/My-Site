/**
 * Dynamic Open Graph Meta Generator
 * Generates HTML with proper OG tags for news articles
 * Handles social media crawler detection
 */

import { supabase } from '../lib/supabaseAdmin.js';

// Detect if request is from a social media crawler
function isCrawler(userAgent) {
  if (!userAgent) return false;
  
  const crawlerPatterns = [
    'facebookexternalhit',
    'Facebot',
    'LinkedInBot',
    'WhatsApp',
    'Twitterbot',
    'Slackbot',
    'TelegramBot',
    'Discordbot',
    'SkypeUriPreview',
    'pinterest',
    'reddit',
    'vkShare',
  ];
  
  return crawlerPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug parameter required' });
  }

  // Security: Validate slug input
  if (typeof slug !== 'string' || slug.length > 200) {
    return res.status(400).json({ error: 'Invalid slug format' });
  }
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    console.warn('Invalid slug characters detected:', slug);
    return res.status(400).json({ error: 'Slug contains invalid characters' });
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

    // Escape HTML special characters in text content
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const title = escapeHtml(article.title);
    const description = escapeHtml(article.description || article.title);
    const imageUrl = article.image_url || 'https://cemkoyluoglu.codes/og-image.png';
    const articleUrl = `https://cemkoyluoglu.codes/tech-news/${slug}`;
    const category = escapeHtml(article.category || 'Technology');

    // Check if this is a crawler request
    const userAgent = req.headers['user-agent'] || '';
    const isBot = isCrawler(userAgent);

    // Generate dynamic HTML with Open Graph tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Basic Meta -->
  <title>${title} | Cem Koyluoglu Tech News</title>
  <meta name="description" content="${description}" />
  <meta name="author" content="Cem Koyluoglu" />
  
  <!-- Open Graph / Facebook / LinkedIn -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${articleUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${title}" />
  <meta property="og:site_name" content="Cem Koyluoglu Tech News" />
  <meta property="og:locale" content="en_US" />
  <meta property="article:published_time" content="${article.created_at}" />
  <meta property="article:author" content="Cem Koyluoglu" />
  <meta property="article:section" content="${category}" />
  <meta property="article:tag" content="${category}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@CemKoyluoglu" />
  <meta name="twitter:creator" content="@CemKoyluoglu" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${title}" />
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${articleUrl}" />
  
  ${isBot ? '' : `<!-- Redirect for real users after 1 second -->
  <meta http-equiv="refresh" content="1;url=${articleUrl}" />`}
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .article-preview {
      max-width: 700px;
      width: 100%;
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .article-image {
      width: 100%;
      height: 300px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .article-category {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .article-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 16px;
      color: #1a202c;
      line-height: 1.3;
    }
    .article-description {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .redirect-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      color: #718096;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="article-preview">
    ${imageUrl !== 'https://cemkoyluoglu.codes/og-image.png' ? 
      `<img src="${imageUrl}" alt="${title}" class="article-image" onerror="this.style.display='none'" />` : ''}
    <div class="article-category">${category}</div>
    <h1 class="article-title">${title}</h1>
    <p class="article-description">${description}</p>
    ${!isBot ? `<div class="redirect-info">
      <div class="spinner"></div>
      <span>Loading full article...</span>
    </div>` : ''}
  </div>
  ${!isBot ? `<script>
    // Fallback redirect after 1 second
    setTimeout(() => {
      window.location.href = '${articleUrl}';
    }, 1000);
  </script>` : ''}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (error) {
    console.error('OG Meta generation error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
