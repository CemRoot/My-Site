/**
 * Common TypeScript types used across the application
 */

import type { LucideIcon } from 'lucide-react';

export type ColorVariant = 'primary' | 'secondary' | 'accent';

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
  color: ColorVariant;
  decimals?: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  skills: string[];
  color: ColorVariant;
  featured?: boolean;
}

export interface ContactMethod {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  color: ColorVariant;
  description: string;
  meta: string;
  cta: string;
  featured?: boolean;
}

export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
}

/** Tech news article from the Supabase database */
export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  date: string;
  slug: string;
  createdAt: string;
  originalTitle?: string;
  category?: string;
}

/** Response shape from /api/tech-news */
export interface NewsDatabase {
  version?: string;
  lastUpdated?: string | null;
  totalArticles?: number;
  articles: Article[];
}

/** Chat widget message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type TopicTag = 'cem' | 'off_topic';

/** Navigation item for the main navbar */
export interface NavItem {
  label: string;
  href: string;
  isHash: boolean;
}

/** Hero section stat displayed on the landing page */
export interface HeroStat {
  value: string;
  label: string;
  gradient: string;
  border: string;
}

/** Experience/education timeline entry */
export interface ExperienceEntry {
  type: string;
  title: string;
  organization: string;
  period: string;
  description: string;
  achievements: string[];
  icon: LucideIcon;
  color: string;
  className?: string;
}

/** Achievement badge in the experience section */
export interface AchievementBadge {
  text: string;
  icon: LucideIcon;
}

/** Highlight card in the about section */
export interface HighlightItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  stats: string;
}

/** Achievement stat in the about section */
export interface AboutAchievement {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

/** Project card data */
export interface ProjectData {
  title: string;
  description: string;
  icon: LucideIcon;
  tags: readonly string[];
  color: string;
  stats: readonly string[];
  details: string;
  highlights: readonly string[];
  github?: string;
  link?: string;
}
