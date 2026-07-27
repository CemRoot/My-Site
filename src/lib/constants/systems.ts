/**
 * "Live systems" section data — the automation that actually runs this site.
 *
 * Copy is grounded in the real stack (see api/chat.js, scripts/news-scraper.js,
 * scripts/lib/telegram-ops/, api/telegram-webhook.js, .github/workflows).
 * The design prototype claimed "FASTAPI" for the chatbot; corrected here — the
 * chat endpoint is a Vercel function calling Groq with Supabase persistence.
 * Telegram is the authorized human ops channel over scrapers, digests, and Actions.
 */

import type { Tr } from '../../features/i18n';

export type SystemStatus = 'running' | 'online' | 'build';

export interface SystemCard {
  status: SystemStatus;
  statusLabel: Tr;
  title: Tr;
  description: Tr;
  meta: Tr;
}

export const SYSTEMS_INTRO: Tr = {
  en: "This portfolio isn't a brochure — it's a running system: scrapers that pull the news, agents that tag it, GitHub Actions that schedule the work, a chatbot that answers for my work, and Telegram as the human ops channel over the stack.",
  tr: "Bu portfolyo bir vitrin değil, çalışan bir sistem: haberleri toplayan scraper'lar, onları etiketleyen agent'lar, işi zamanlayan GitHub Actions, işlerimi cevaplayan bir chatbot ve yığını denetleyen Telegram ops kanalı.",
};

export const SYSTEMS: SystemCard[] = [
  {
    status: 'running',
    statusLabel: { en: 'RUNNING', tr: 'ÇALIŞIYOR' },
    title: { en: 'News scraper', tr: "Haber scraper'ı" },
    description: {
      en: 'Cron pulls from curated sources, de-dupes, summarises.',
      tr: 'Seçili kaynaklardan cron ile çeker, tekrarları ayıklar, özetler.',
    },
    meta: { en: 'GITHUB ACTIONS · 2×/DAY · MON–FRI', tr: 'GITHUB ACTIONS · GÜNDE 2× · PZT–CUM' },
  },
  {
    status: 'running',
    statusLabel: { en: 'RUNNING', tr: 'ÇALIŞIYOR' },
    title: { en: 'Agent layer', tr: 'Agent katmanı' },
    description: {
      en: 'Tags topics, scores signal over noise, drops the filler.',
      tr: 'Konuları etiketler, gürültüyü ayıklar, düşük skorluları düşürür.',
    },
    meta: { en: 'LLM + N8N · QUEUED', tr: 'LLM + N8N · SIRADA' },
  },
  {
    status: 'online',
    statusLabel: { en: 'ONLINE', tr: 'ÇEVRİMİÇİ' },
    title: { en: 'Telegram control', tr: 'Telegram kontrol' },
    description: {
      en: 'Ops channel: trigger scrapes, approve digests, health checks, Actions.',
      tr: 'Ops kanalı: scraper tetikle, digest onayla, sağlık ve Actions.',
    },
    meta: { en: 'BOT WEBHOOK · AUTHORIZED CHAT', tr: 'BOT WEBHOOK · YETKİLİ SOHBET' },
  },
  {
    status: 'online',
    statusLabel: { en: 'ONLINE', tr: 'ÇEVRİMİÇİ' },
    title: { en: 'Portfolio chatbot', tr: "Portfolyo chatbot'u" },
    description: {
      en: 'Grounded in my CV, projects and publication.',
      tr: "CV'm, projelerim ve yayınım üzerine kurulu.",
    },
    meta: { en: 'GROQ · VERCEL · SUPABASE', tr: 'GROQ · VERCEL · SUPABASE' },
  },
  {
    status: 'build',
    statusLabel: { en: 'LAST BUILD', tr: 'SON BUILD' },
    title: { en: 'Deploy pipeline', tr: 'Yayın hattı' },
    description: {
      en: 'Push → test → build → edge. No manual step.',
      tr: 'Push → test → build → edge. Elle müdahale yok.',
    },
    meta: { en: 'VERCEL · GREEN', tr: 'VERCEL · YEŞİL' },
  },
];
