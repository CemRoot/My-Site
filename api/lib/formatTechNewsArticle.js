/**
 * Public API shape for tech news articles.
 * Detail view (includeContent=true) also exposes original_source so the
 * frontend can link back to the primary news outlet.
 */

/**
 * @param {Object} article - Raw row from tech_news_articles
 * @param {boolean} includeContent
 */
export function formatTechNewsArticle(article, includeContent = false) {
  const formatted = {
    id: article.id,
    title: article.title,
    description: article.description,
    originalTitle: article.original_title,
    image: article.image_url,
    date: article.date,
    category: article.category,
    slug: article.slug,
    views: article.views,
    createdAt: article.created_at,
  };

  if (includeContent && article.content) {
    formatted.content = article.content;
    if (article.original_source) {
      formatted.originalSource = article.original_source;
    }
  }

  return formatted;
}
