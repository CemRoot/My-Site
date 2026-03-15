import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found in environment variables. Sitemap will only contain static routes.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BASE_URL = 'https://cemkoyluoglu.codes';

async function generateSitemap() {
  try {
    const sitemapPath = path.resolve('public', 'sitemap.xml');
    const now = new Date().toISOString().split('T')[0];

    // Static routes
    const staticRoutes = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/tech-news', priority: '0.9', changefreq: 'daily' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
      { url: '/terms', priority: '0.3', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static routes
    for (const route of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${route.url}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    if (supabase) {
      // Fetch dynamic routes from Supabase
      console.log('Fetching articles from Supabase...');
      const { data: articles, error } = await supabase
        .from('tech_news_articles')
        .select('slug, created_at');

      if (error) {
        console.error('Error fetching articles:', error);
      } else if (articles) {
        console.log(`Found ${articles.length} articles.`);
        for (const article of articles) {
          // Use created_at for lastmod if available, fallback to now
          const lastmod = article.created_at ? new Date(article.created_at).toISOString().split('T')[0] : now;

          xml += `  <url>\n`;
          xml += `    <loc>${BASE_URL}/tech-news/${article.slug}</loc>\n`;
          xml += `    <lastmod>${lastmod}</lastmod>\n`;
          xml += `    <changefreq>monthly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        }
      }
    } else {
      console.log('Skipping Supabase articles due to missing credentials.');
    }

    xml += `</urlset>`;

    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log(`Sitemap successfully generated at ${sitemapPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
