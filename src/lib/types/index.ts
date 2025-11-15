/**
 * Common TypeScript types used across the application
 */

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

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  technologies: string[];
  image: string;
  category: 'AI/ML' | 'Cloud' | 'Full Stack' | 'Automation';
  featured?: boolean;
  demoUrl?: string;
  githubUrl?: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  period: string;
  location: string;
  description: string;
  achievements: string[];
  technologies: string[];
  type: 'work' | 'education';
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

export interface SocialLink {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
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
