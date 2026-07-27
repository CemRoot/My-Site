/**
 * Navigation items for the site header (editorial redesign).
 * Hash targets live on the Home page; the header resolves them to `/#id`
 * when rendered on other routes.
 */

import type { Tr } from '../../features/i18n';

export interface NavItem {
  label: Tr;
  /** Hash id on the Home page, e.g. "#systems", or an absolute route. */
  href: string;
  isHash: boolean;
  /** Rendered in the accent colour (the design highlights CONTACT). */
  accent?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: { en: 'SYSTEMS', tr: 'SİSTEMLER' }, href: '#systems', isHash: true },
  { label: { en: 'WORK', tr: 'ÇALIŞMALAR' }, href: '#work', isHash: true },
  { label: { en: 'NEWS', tr: 'HABERLER' }, href: '#signal', isHash: true },
  { label: { en: 'SERVICES', tr: 'HİZMETLER' }, href: '#services', isHash: true },
  { label: { en: 'TECH NEWS', tr: 'TEKNOLOJİ HABERLERİ' }, href: '/tech-news', isHash: false },
  { label: { en: 'CONTACT', tr: 'İLETİŞİM' }, href: '#contact', isHash: true, accent: true },
];
