import { useEffect } from 'react';
import { PERSONAL_INFO, SOCIAL_LINKS, EDUCATION } from '../lib/constants/personal';
import type { SEOMetadata } from '../lib/types';

/**
 * SEO Component
 * Manages meta tags, Open Graph, Twitter Card, and structured data
 */
export function SEO({
  title = 'Welcome',
  description = `${PERSONAL_INFO.bio.short} Based in ${PERSONAL_INFO.location}. Available for freelance projects and full-time opportunities.`,
  keywords = 'AI Engineer, Machine Learning, NLP, Computer Vision, LLMs, Python Developer, Azure Specialist, Microsoft 365, System Operations, Dublin Ireland, Freelance AI Developer, RAG, LangChain, Deep Learning, TensorFlow, PyTorch, Cloud Solutions, Data Engineering',
  author = PERSONAL_INFO.name,
  ogTitle = `${PERSONAL_INFO.name} - ${PERSONAL_INFO.title}`,
  ogDescription = `AI Engineer with ${EDUCATION.degree} (${EDUCATION.classification}). Expert in LLMs, NLP, Computer Vision, Azure & Microsoft 365. Based in ${PERSONAL_INFO.location}, available for freelance & full-time opportunities.`,
  ogImage = 'https://portfolio.cemkoyluoglu.com/og-image.jpg',
  twitterCard = 'summary_large_image',
}: SEOMetadata = {}) {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to set or update meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.content = content;
    };

    // Standard meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', author);
    setMetaTag('robots', 'index, follow');
    setMetaTag('language', 'English');
    setMetaTag('revisit-after', '7 days');

    // Open Graph meta tags
    setMetaTag('og:title', ogTitle, true);
    setMetaTag('og:description', ogDescription, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', window.location.href, true);
    setMetaTag('og:site_name', `${PERSONAL_INFO.name} Portfolio`, true);
    setMetaTag('og:locale', 'en_IE', true);

    // Twitter Card meta tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', ogTitle);
    setMetaTag('twitter:description', ogDescription);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:creator', '@CemKoyluoglu');

    // Additional SEO tags
    setMetaTag('theme-color', '#5BE7FF');
    setMetaTag('msapplication-TileColor', '#5BE7FF');
    setMetaTag('mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMetaTag('format-detection', 'telephone=no');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    // JSON-LD structured data for better SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: PERSONAL_INFO.name,
      jobTitle: PERSONAL_INFO.title,
      description: description,
      url: window.location.href,
      email: PERSONAL_INFO.email,
      telephone: PERSONAL_INFO.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dublin',
        addressCountry: 'Ireland',
      },
      alumniOf: {
        '@type': 'EducationalOrganization',
        name: EDUCATION.institution,
        degree: EDUCATION.degree,
      },
      knowsAbout: [
        'Artificial Intelligence',
        'Machine Learning',
        'Natural Language Processing',
        'Computer Vision',
        'Large Language Models',
        'Python Programming',
        'Microsoft Azure',
        'Microsoft 365',
        'System Operations',
        'Cloud Computing',
        'Data Engineering',
      ],
      sameAs: [
        SOCIAL_LINKS.github.url,
        SOCIAL_LINKS.linkedin.url,
      ],
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, author, ogTitle, ogDescription, ogImage, twitterCard]);

  return null;
}
