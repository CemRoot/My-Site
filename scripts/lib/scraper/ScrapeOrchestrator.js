/**
 * Tech News Scraper — Entry Point (Orchestration Only)
 *
 * Scrapes tech news from Nuvemmag, translates to English, and stores in Supabase.
 * All scraping logic is delegated to ScraperRouter (Firecrawl → Cheerio fallback).
 * Business logic lives in sub-modules under scripts/lib/scraper/.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import { resolveArtifactPath, writeJsonArtifact } from '../config.js';
import { SCRAPER_CONFIG } from './config.js';
import {
  getExistingArticles,
  saveArticle,
  getArticleCount,
  isContentHashDuplicate,
  isSourceUrlDuplicate,
  generateSlug,
  normalizeSourceUrl,
} from './database.js';
import { translateArticle } from './translator.js';
import { ScraperRouter } from './scrapers/ScraperRouter.js';
import { normalizeSourceDate } from './dateUtils.js';

const CONFIG = SCRAPER_CONFIG;
/** Recent window for stale-but-ok articles (days). Single source: SCRAPER_CONFIG.MAX_RECENT_PUBLISH_DAYS */
const MAX_RECENT_PUBLISH_DAYS = CONFIG.MAX_RECENT_PUBLISH_DAYS ?? 3;
const REPLAYABLE_BATCHES = new Set(['rejected', 'failed', 'deleted', 'deferred', 'skipped']);

// ─── Content validation helpers ───

const GARBAGE_CONTENT_PATTERNS = [
  /we use cookies/i,
  /cookie\s*(policy|settings|preferences|consent)/i,
  /çerez\s*(politika|ayar)/i,
  /by clicking .{0,20}accept/i,
  /personalized ads/i,
  /sign\s*in|log\s*in|create\s*account/i,
  /forgot\s*(your\s*)?password/i,
  /şifre(mi)?\s*unuttum/i,
  /giriş\s*yap|kayıt\s*ol|hesap\s*oluştur/i,
  /your\s*cart\s*is\s*empty/i,
  /add\s*to\s*cart/i,
];

const GARBAGE_TITLE_PATTERNS = [
  /^my\s*account$/i,
  /^hesab[ıi]m$/i,
  /^(giriş|kayıt|login|register|sign\s*up|sign\s*in)$/i,
  /^(cart|sepet|checkout|ödeme)$/i,
  /^(contact|iletişim|hakkımızda|about)$/i,
  /^(search|ara|arama)$/i,
  /^(cookie|çerez|privacy|gizlilik)$/i,
  /^(404|page not found|sayfa bulunamadı)$/i,
];

function isGarbageContent(title, content) {
  for (const pattern of GARBAGE_TITLE_PATTERNS) {
    if (pattern.test(title?.trim())) return `Blocked title: "${title}"`;
  }
  const sample = (content || '').substring(0, 1500);
  let hits = 0;
  for (const pattern of GARBAGE_CONTENT_PATTERNS) {
    if (pattern.test(sample)) hits++;
  }
  if (hits >= 2) return `Content matched ${hits} garbage patterns (cookie/login/form)`;
  return null;
}

function getArticleCandidateKey(url) {
  return normalizeSourceUrl(url);
}

function compareArticleCandidates(a, b) {
  if (b.datePriority !== a.datePriority) {
    return b.datePriority - a.datePriority;
  }

  return getArticleCandidateKey(a.url).localeCompare(getArticleCandidateKey(b.url));
}

function selectPreferredCandidate(existing, incoming) {
  if (!existing) return incoming;

  if (incoming.datePriority !== existing.datePriority) {
    return incoming.datePriority > existing.datePriority ? incoming : existing;
  }

  return compareArticleCandidates(incoming, existing) < 0 ? incoming : existing;
}

function mergeArticleCandidates(articles) {
  const bestByUrl = new Map();

  for (const article of articles) {
    const key = getArticleCandidateKey(article.url);
    const existing = bestByUrl.get(key);
    bestByUrl.set(key, selectPreferredCandidate(existing, article));
  }

  return [...bestByUrl.values()].sort(compareArticleCandidates);
}

function createCategoryStat(category, overrides = {}) {
  return {
    tag: category.tag,
    name: category.name,
    slug: category.slug || null,
    url: category.url,
    discovered: 0,
    todayCandidates: 0,
    unknownCandidates: 0,
    alreadyInDb: 0,
    verifiedUnknown: 0,
    staleSkipped: 0,
    futureRejected: 0,
    saved: 0,
    rejected: 0,
    deferred: 0,
    failed: 0,
    ...overrides,
  };
}

function incrementCategoryStat(categoryStats, categoryTag, field, amount = 1) {
  const entry = categoryStats.find(item => item.tag === categoryTag);
  if (!entry) return;
  entry[field] = (entry[field] || 0) + amount;
}

function ensureCandidateDateAssessment(candidate) {
  const assessment = candidate?.dateAssessment?.dateStatus
    ? candidate.dateAssessment
    : normalizeSourceDate(candidate?.normalizedDate || candidate?.rawDate || '', {
        source: candidate?.dateSource || 'candidate',
        confidence: candidate?.dateConfidence || 'low',
      });

  return {
    ...candidate,
    rawDate: candidate?.rawDate || assessment.rawDate || '',
    normalizedDate: assessment.normalizedDate,
    dateSource: candidate?.dateSource || assessment.dateSource,
    dateConfidence: candidate?.dateConfidence || assessment.dateConfidence,
    datePriority: candidate?.datePriority ?? assessment.datePriority,
    dateStatus: assessment.dateStatus,
    dateAssessment: assessment,
  };
}

function partitionCandidatesByDate(candidates, categoryStats) {
  const buckets = {
    today: [],
    unknown: [],
    stale: [],
    future: [],
  };

  for (const rawCandidate of candidates) {
    const candidate = ensureCandidateDateAssessment(rawCandidate);
    const bucket = candidate.dateStatus === 'today'
      ? 'today'
      : candidate.dateStatus === 'future'
        ? 'future'
        : candidate.dateStatus === 'stale'
          ? 'stale'
          : 'unknown';

    buckets[bucket].push(candidate);

    if (bucket === 'today') {
      incrementCategoryStat(categoryStats, candidate.category, 'todayCandidates');
    } else if (bucket === 'unknown') {
      incrementCategoryStat(categoryStats, candidate.category, 'unknownCandidates');
    }
  }

  return buckets;
}

function getSaveResultDisposition(result) {
  if (result?.success) return 'saved';
  if (result?.reason === 'date_integrity_deferred') return 'deferred';
  if (
    result?.reason === 'rejected_content' ||
    result?.reason === 'date_integrity_rejected' ||
    result?.error?.message?.startsWith('Validation failed:')
  ) {
    return 'rejected';
  }

  return 'failed';
}

function isTldrOnlyContent(content) {
  const text = String(content || '').trim();
  if (!text) return true;
  const hasTldrMarker = /\bTL;?DR\b/i.test(text);
  if (!hasTldrMarker) return false;

  const compact = text.replace(/\s+/g, ' ');
  const withoutTldrBlock = compact
    .replace(/\bTL;?DR\b[:\-\s]*/gi, '')
    .replace(/\bKey Highlights?\b[:\-\s]*/gi, '')
    .trim();

  return withoutTldrBlock.length < 400;
}

function mapReasonCode(stage) {
  const codes = {
    unknown_date_verification: 'UNKNOWN_DATE_VERIFICATION_FAILED',
    detail_future_date: 'DETAIL_DATE_FUTURE',
    detail_mismatch_outside_recent_window: 'DETAIL_DATE_MISMATCH',
    unknown_candidate_stale: 'STALE_DETAIL_DATE',
    unknown_candidate_unresolved: 'DETAIL_DATE_UNKNOWN',
    scrape: 'SCRAPE_FAILED',
    detail_unknown_date: 'DETAIL_DATE_UNKNOWN',
    garbage_content: 'GARBAGE_CONTENT',
    content_hash_duplicate: 'DUPLICATE_CONTENT_HASH',
    translation: 'TRANSLATION_FAILED',
    save_rejected: 'SAVE_REJECTED',
    save_deferred: 'SAVE_DEFERRED',
    save: 'SAVE_FAILED',
    stale_candidate: 'STALE_DISCOVERY_DATE',
    future_candidate: 'FUTURE_DISCOVERY_DATE',
    already_in_db: 'DUPLICATE_SOURCE_URL',
    source_url_duplicate: 'DUPLICATE_SOURCE_URL',
    dry_run: 'DRY_RUN',
    already_processed: 'ALREADY_PROCESSED',
    per_run_cap: 'PER_RUN_CAP',
    tldr_only_content: 'TLDR_ONLY_CONTENT',
  };
  return codes[stage] || 'UNSPECIFIED';
}

function getPreferredArticleSlug(article) {
  // Always generate slug from the (translated) English title.
  // Intentionally ignore article.slug which is derived from the Turkish source URL.
  return generateSlug(article?.title || '');
}

function getProcessingDateDecision(candidate, article) {
  const detailAssessment = article?.dateAssessment?.dateStatus
    ? article.dateAssessment
    : normalizeSourceDate(article?.date || article?.rawDate || '', {
        source: article?.dateSource || 'detail',
        confidence: article?.dateConfidence || 'medium',
      });

  const discoveryAssessment = candidate?.dateAssessment?.dateStatus
    ? candidate.dateAssessment
    : candidate?.discoveryDateAssessment?.dateStatus
      ? candidate.discoveryDateAssessment
      : null;

  if (detailAssessment.dateStatus === 'future') {
    return {
      action: 'reject',
      stage: 'detail_future_date',
      reason: `Detail publish date is in the future (${detailAssessment.isoDate || detailAssessment.rawDate || 'unknown'})`,
      assessment: detailAssessment,
    };
  }

  if (detailAssessment.dateStatus === 'unknown' || !detailAssessment.isoDate) {
    return {
      action: 'defer',
      stage: 'detail_unknown_date',
      reason: 'Detail publish date is unknown',
      assessment: detailAssessment,
    };
  }

  if (
    discoveryAssessment?.isoDate &&
    detailAssessment.isoDate &&
    discoveryAssessment.isoDate !== detailAssessment.isoDate
  ) {
    // Trust detail metadata over list hints, but only if detail is within MAX_RECENT_PUBLISH_DAYS.
    const maxDays = CONFIG.MAX_RECENT_PUBLISH_DAYS ?? 3;
    const detailRecentEnough =
      detailAssessment.dateStatus === 'today' ||
      (detailAssessment.dateStatus === 'stale' &&
        typeof detailAssessment.ageDays === 'number' &&
        detailAssessment.ageDays <= maxDays);

    if (!detailRecentEnough) {
      return {
        action: 'reject',
        stage: 'detail_mismatch_outside_recent_window',
        reason:
          `List vs detail date mismatch; detail publish date outside ${maxDays}d window ` +
          `(${detailAssessment.isoDate || detailAssessment.rawDate || 'unknown'}, ` +
          `${detailAssessment.ageDays ?? '?'}d old)`,
        assessment: detailAssessment,
      };
    }

    return {
      action: 'process',
      assessment: detailAssessment,
    };
  }

  return {
    action: 'process',
    assessment: detailAssessment,
  };
}

function getCliArg(flag, argv = process.argv) {
  const index = argv.indexOf(flag);
  return index !== -1 ? argv[index + 1] : null;
}

function getRequestedRunLabel(argv = process.argv) {
  return getCliArg('--run-label', argv) || process.env.TECH_NEWS_RUN_LABEL || null;
}

function getRequestedRunDate(argv = process.argv) {
  return getCliArg('--run-date', argv) || process.env.TECH_NEWS_RUN_DATE || null;
}

function normalizeReplayStatuses(value) {
  const requested = String(value || 'rejected,failed,deleted')
    .split(',')
    .map(status => status.trim().toLowerCase())
    .filter(Boolean);

  const valid = requested.filter(status => REPLAYABLE_BATCHES.has(status));
  return valid.length > 0 ? [...new Set(valid)] : ['rejected', 'failed', 'deleted'];
}

function createRunMetrics() {
  return {
    rawDiscovered: 0,
    rawFound: 0,
    uniqueCandidates: 0,
    todayCandidates: 0,
    recentStaleCandidates: 0,
    unknownCandidates: 0,
    verifiedUnknown: 0,
    staleSkipped: 0,
    futureRejected: 0,
    rejectedDateMismatch: 0,
    alreadyInDb: 0,
    newAfterDbCheck: 0,
    replayCandidates: 0,
    skippedExisting: 0,
    skippedAlreadyProcessed: 0,
    skippedSourceUrl: 0,
    skippedHashDuplicate: 0,
    deferred: 0,
    rejectedGarbage: 0,
    rejectedSave: 0,
    saved: 0,
    scrapeFailed: 0,
    translationFailed: 0,
    saveFailed: 0,
    circuitBreakerTrips: 0,
  };
}

function createRunReport({ mode, scraperName, sourceArtifact = null, replayStatuses = [], runLabel = null, runDate = null }) {
  return {
    version: 2,
    type: 'tech-news-scrape-run',
    runId: crypto.randomUUID(),
    mode,
    startedAt: new Date().toISOString(),
    scraper: scraperName,
    runLabel,
    runDate,
    sourceArtifact,
    replayStatuses,
    config: {
      maxArticlesPerRun: CONFIG.MAX_ARTICLES_PER_RUN,
      maxConsecutiveFailures: CONFIG.MAX_CONSECUTIVE_FAILURES,
      maxRecentPublishDays: CONFIG.MAX_RECENT_PUBLISH_DAYS,
      maxArticlesPerCategory: CONFIG.MAX_ARTICLES_PER_CATEGORY,
      categoryArchiveMaxPages: CONFIG.CATEGORY_ARCHIVE_MAX_PAGES,
      categories: CONFIG.CATEGORIES.map(({ tag, name, slug, url }) => ({ tag, name, slug, url })),
    },
    metrics: createRunMetrics(),
    categories: [],
    batches: {
      saved: [],
      skipped: [],
      rejected: [],
      failed: [],
      deferred: [],
    },
  };
}

function recordRunBatch(report, batch, payload) {
  if (!report.batches[batch]) {
    report.batches[batch] = [];
  }

  const resolvedReasonCode = payload.reasonCode || mapReasonCode(payload.stage);

  report.batches[batch].push({
    timestamp: new Date().toISOString(),
    ...payload,
    reasonCode: resolvedReasonCode,
  });
}

class DiscoveryAgent {
  constructor(scraperRouter) {
    this.scraperRouter = scraperRouter;
  }

  async discover() {
    return scrapeAllCategories(this.scraperRouter);
  }

  partition(candidates, categoryStats) {
    return partitionCandidatesByDate(candidates, categoryStats);
  }
}

class DetailExtractionAgent {
  constructor(scraperRouter) {
    this.scraperRouter = scraperRouter;
  }

  async extract(url, prefetchedArticle = null) {
    return prefetchedArticle || await this.scraperRouter.scrapeArticleDetails(url);
  }
}

class TranslationAgent {
  async run(article) {
    return translateArticle(article);
  }
}

class EnhancementAgent {
  ensureFullContent(article) {
    if (!article || !article.content) {
      return { ok: false, reason: 'Translated content is empty', stage: 'tldr_only_content' };
    }
    if (isTldrOnlyContent(article.content)) {
      return { ok: false, reason: 'TL;DR-only content detected', stage: 'tldr_only_content' };
    }
    return { ok: true };
  }
}

class QualityGateAgent {
  getDateDecision(candidate, article) {
    return getProcessingDateDecision(candidate, article);
  }

  getGarbageReason(title, content) {
    return isGarbageContent(title, content);
  }

  getSaveDisposition(result) {
    return getSaveResultDisposition(result);
  }
}

class PersistenceAgent {
  async getArticleCount() {
    return getArticleCount();
  }

  async getExistingArticles(urls) {
    return getExistingArticles(urls);
  }

  async isSourceDuplicate(url) {
    return isSourceUrlDuplicate(url);
  }

  async isHashDuplicate(title) {
    return isContentHashDuplicate(title);
  }

  async save(articleData) {
    return saveArticle(articleData);
  }
}

function createAgents(scraperRouter) {
  return {
    discovery: new DiscoveryAgent(scraperRouter),
    detail: new DetailExtractionAgent(scraperRouter),
    translation: new TranslationAgent(),
    enhancement: new EnhancementAgent(),
    quality: new QualityGateAgent(),
    persistence: new PersistenceAgent(),
  };
}

function finalizeRunReport(report, { databaseCountBefore = null, databaseCountAfter = null, circuitBreakerTriggered = false }) {
  const metrics = report.metrics;
  report.finishedAt = new Date().toISOString();
  report.durationMs = new Date(report.finishedAt).getTime() - new Date(report.startedAt).getTime();
  report.databaseCountBefore = databaseCountBefore;
  report.databaseCountAfter = databaseCountAfter;
  report.circuitBreakerTriggered = circuitBreakerTriggered;

  metrics.rawFound = metrics.rawDiscovered;
  metrics.rejected = metrics.rejectedGarbage + metrics.rejectedSave;
  metrics.skipped =
    metrics.skippedExisting +
    metrics.skippedAlreadyProcessed +
    metrics.skippedSourceUrl +
    metrics.skippedHashDuplicate +
    metrics.staleSkipped;
  metrics.rejected += metrics.futureRejected + metrics.rejectedDateMismatch;
  metrics.failed = metrics.scrapeFailed + metrics.translationFailed + metrics.saveFailed;
}

async function persistRunReport(report, label) {
  const artifactPath = await writeJsonArtifact(label, report);
  console.log(`🧾 Run report saved: ${artifactPath}`);
  return artifactPath;
}

function buildReplayCandidates(payload, statuses) {
  const batches = payload?.batches || {};
  const replayCandidates = [];
  const seen = new Set();

  for (const status of statuses) {
    const items = Array.isArray(batches[status]) ? batches[status] : [];

    for (const item of items) {
      const url = item.url || item.sourceUrl || item.source_url;
      if (!url) continue;

      const key = getArticleCandidateKey(url);
      if (seen.has(key)) continue;
      seen.add(key);

      replayCandidates.push({
        url,
        category: item.category || item.originalCategory || 'Replay',
        replayBatch: status,
        replayReason: item.reason || item.stage || 'replay',
      });
    }
  }

  return replayCandidates;
}

// ─── Category aggregation ───

async function scrapeAllCategories(router) {
  const collectedArticles = [];
  const categoryStats = [];

  for (const category of CONFIG.CATEGORIES) {
    try {
      const articles = await router.scrapeArticleList(category.url, category.tag);
      collectedArticles.push(...articles);
      categoryStats.push(createCategoryStat(category, {
        discovered: articles.length,
      }));

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error scraping category ${category.tag}: ${error.message}`);
      categoryStats.push(createCategoryStat(category, {
        discovered: 0,
        error: error.message,
      }));
    }
  }

  const mergedArticles = mergeArticleCandidates(collectedArticles);
  const dedupedCount = collectedArticles.length - mergedArticles.length;

  if (dedupedCount > 0) {
    console.log(`♻️  Deduplicated ${dedupedCount} repeated URL(s) across categories before DB checks.`);
  }

  console.log(`🗂️  Collected ${mergedArticles.length} unique article candidates from ${collectedArticles.length} raw links.`);
  return {
    articles: mergedArticles,
    rawCount: collectedArticles.length,
    dedupedCount,
    categoryStats,
  };
}

async function verifyUnknownCandidates(candidates, agents, runReport) {
  const verifiedCandidates = [];

  for (const candidate of candidates) {
    const urlLabel = candidate.url.split('/').filter(Boolean).pop() || candidate.url;
    console.log(`🕵️  [${candidate.category}] Verifying unknown-date candidate: ${urlLabel}`);

    const article = await agents.detail.extract(candidate.url);
    if (!article) {
      runReport.metrics.scrapeFailed++;
      incrementCategoryStat(runReport.categories, candidate.category, 'failed');
      recordRunBatch(runReport, 'failed', {
        url: candidate.url,
        category: candidate.category,
        stage: 'unknown_date_verification',
        reason: 'scrapeArticleDetails returned null during unknown-date verification',
      });
      continue;
    }

    article.discoveryDateAssessment = candidate.dateAssessment;
    const decision = agents.quality.getDateDecision(candidate, article);

    const MAX_RECENT_DAYS = MAX_RECENT_PUBLISH_DAYS;
    const isRecentEnough = decision.assessment.dateStatus === 'today' ||
      (decision.assessment.dateStatus === 'stale' &&
       typeof decision.assessment.ageDays === 'number' &&
       decision.assessment.ageDays <= MAX_RECENT_DAYS);

    if (decision.action === 'process' && isRecentEnough) {
      runReport.metrics.verifiedUnknown++;
      incrementCategoryStat(runReport.categories, candidate.category, 'verifiedUnknown');
      verifiedCandidates.push({
        ...candidate,
        dateAssessment: decision.assessment,
        normalizedDate: decision.assessment.normalizedDate,
        rawDate: article.rawDate || candidate.rawDate,
        prefetchedArticle: {
          ...article,
          dateAssessment: decision.assessment,
          normalizedDate: decision.assessment.normalizedDate,
          date: decision.assessment.normalizedDate,
          discoveryDateAssessment: candidate.dateAssessment,
        },
      });
      const label = decision.assessment.dateStatus === 'today' ? 'today' : `recent (${decision.assessment.ageDays}d old)`;
      console.log(`✅ [${candidate.category}] Unknown candidate verified as ${label}\n`);
      continue;
    }

    if (decision.action === 'reject') {
      if (decision.stage === 'detail_future_date') {
        runReport.metrics.futureRejected++;
        incrementCategoryStat(runReport.categories, candidate.category, 'futureRejected');
      } else {
        runReport.metrics.rejectedDateMismatch++;
        incrementCategoryStat(runReport.categories, candidate.category, 'rejectedDateMismatch');
      }
      recordRunBatch(runReport, 'rejected', {
        url: candidate.url,
        category: candidate.category,
        stage: decision.stage,
        reason: decision.reason,
        rawDate: article.rawDate || candidate.rawDate,
        normalizedDate: decision.assessment.normalizedDate,
      });
      console.log(`🚫 [${candidate.category}] Unknown candidate rejected: ${decision.reason}\n`);
      continue;
    }

    if (decision.assessment.dateStatus === 'stale' &&
        (typeof decision.assessment.ageDays !== 'number' || decision.assessment.ageDays > MAX_RECENT_DAYS)) {
      runReport.metrics.staleSkipped++;
      incrementCategoryStat(runReport.categories, candidate.category, 'staleSkipped');
      recordRunBatch(runReport, 'skipped', {
        url: candidate.url,
        category: candidate.category,
        stage: 'unknown_candidate_stale',
        reason: `Detail publish date is stale (${decision.assessment.isoDate}, ${decision.assessment.ageDays ?? '?'}d old, exceeds ${MAX_RECENT_DAYS}d window)`,
        rawDate: article.rawDate || candidate.rawDate,
        normalizedDate: decision.assessment.normalizedDate,
      });
      console.log(`⏭️  [${candidate.category}] Unknown candidate resolved as stale (${decision.assessment.ageDays ?? '?'}d old)\n`);
      continue;
    }

    runReport.metrics.deferred++;
    incrementCategoryStat(runReport.categories, candidate.category, 'deferred');
    recordRunBatch(runReport, 'deferred', {
      url: candidate.url,
      category: candidate.category,
      stage: decision.stage || 'unknown_candidate_unresolved',
      reason: decision.reason || 'Unknown-date candidate could not be verified as today',
      rawDate: article.rawDate || candidate.rawDate,
      normalizedDate: decision.assessment?.normalizedDate || null,
    });
    console.log(`⏸️  [${candidate.category}] Unknown candidate deferred: ${decision.reason}\n`);
  }

  return verifiedCandidates;
}

async function processArticleQueue(articleQueue, agents, runReport, options = {}) {
  const { dryRun = false } = options;
  let consecutiveFailures = 0;
  let circuitBreakerTriggered = false;
  const processedInThisRun = new Set();

  for (const rawCandidate of articleQueue) {
    const candidate = ensureCandidateDateAssessment(rawCandidate);
    const {
      url,
      category,
      replayBatch = null,
      replayReason = null,
      prefetchedArticle = null,
    } = candidate;
    const articleKey = getArticleCandidateKey(url);
    const urlLabel = url.split('/').filter(Boolean).pop() || url;

    if (processedInThisRun.has(articleKey)) {
      runReport.metrics.skippedAlreadyProcessed++;
      recordRunBatch(runReport, 'skipped', {
        url,
        category,
        stage: 'already_processed',
        reason: 'Already processed in this run',
        replayBatch,
        replayReason,
      });
      console.log(`⏭️  [${category}] Skipping (already processed in this run): ${urlLabel}`);
      continue;
    }

    if (consecutiveFailures >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
      console.log(`\n🚨 Circuit breaker activated: ${consecutiveFailures} consecutive failures`);
      circuitBreakerTriggered = true;
      runReport.metrics.circuitBreakerTrips++;
      break;
    }

    console.log(`📰 [${category}] Processing: ${url}`);
    processedInThisRun.add(articleKey);

    const sourceUrlAlreadyExists = await agents.persistence.isSourceDuplicate(url);
    if (sourceUrlAlreadyExists) {
      runReport.metrics.skippedSourceUrl++;
      recordRunBatch(runReport, 'skipped', {
        url,
        category,
        stage: 'source_url_duplicate',
        reason: 'source_url already exists before scrape',
        replayBatch,
        replayReason,
      });
      console.log(`⏭️  [${category}] Skipping — source_url already exists before scrape: ${urlLabel}\n`);
      continue;
    }

    const article = await agents.detail.extract(url, prefetchedArticle);

    if (!article) {
      runReport.metrics.scrapeFailed++;
      consecutiveFailures++;
      incrementCategoryStat(runReport.categories, category, 'failed');
      recordRunBatch(runReport, 'failed', {
        url,
        category,
        stage: 'scrape',
        reason: 'scrapeArticleDetails returned null',
        consecutiveFailures,
        replayBatch,
        replayReason,
      });
      console.log(`❌ Failed (${consecutiveFailures} consecutive failures)\n`);
      continue;
    }

    article.discoveryDateAssessment = candidate.dateAssessment || article.discoveryDateAssessment || null;

    const dateDecision = agents.quality.getDateDecision(candidate, article);
    if (dateDecision.action === 'reject') {
      if (dateDecision.stage === 'detail_future_date') {
        runReport.metrics.futureRejected++;
        incrementCategoryStat(runReport.categories, category, 'futureRejected');
      } else {
        runReport.metrics.rejectedDateMismatch++;
        incrementCategoryStat(runReport.categories, category, 'rejectedDateMismatch');
      }
      recordRunBatch(runReport, 'rejected', {
        url,
        category,
        stage: dateDecision.stage,
        reason: dateDecision.reason,
        rawDate: article.rawDate || candidate.rawDate,
        normalizedDate: dateDecision.assessment.normalizedDate,
        replayBatch,
        replayReason,
      });
      console.log(`🚫 [${category}] Rejected before translation: ${dateDecision.reason}\n`);
      continue;
    }

    if (dateDecision.action === 'defer') {
      runReport.metrics.deferred++;
      incrementCategoryStat(runReport.categories, category, 'deferred');
      recordRunBatch(runReport, 'deferred', {
        url,
        category,
        stage: dateDecision.stage,
        reason: dateDecision.reason,
        rawDate: article.rawDate || candidate.rawDate,
        normalizedDate: dateDecision.assessment.normalizedDate,
        replayBatch,
        replayReason,
      });
      console.log(`⏸️  [${category}] Deferred before translation: ${dateDecision.reason}\n`);
      continue;
    }

    article.dateAssessment = dateDecision.assessment;
    article.date = dateDecision.assessment.normalizedDate;
    article.normalizedDate = dateDecision.assessment.normalizedDate;
    article.dateSource = dateDecision.assessment.dateSource;
    article.dateConfidence = dateDecision.assessment.dateConfidence;

    const garbageReason = agents.quality.getGarbageReason(article.title, article.content);
    if (garbageReason) {
      runReport.metrics.rejectedGarbage++;
      incrementCategoryStat(runReport.categories, category, 'rejected');
      recordRunBatch(runReport, 'rejected', {
        url,
        category,
        stage: 'garbage_content',
        reason: garbageReason,
        title: article.title,
        replayBatch,
        replayReason,
      });
      console.log(`🚫 [${category}] Rejected garbage page: ${garbageReason}\n`);
      continue;
    }

    const isHashDup = await agents.persistence.isHashDuplicate(article.title);
    if (isHashDup) {
      runReport.metrics.skippedHashDuplicate++;
      recordRunBatch(runReport, 'skipped', {
        url,
        category,
        stage: 'content_hash_duplicate',
        reason: 'same article already exists in DB (hash match)',
        title: article.title,
        replayBatch,
        replayReason,
      });
      console.log(`⏭️  [${category}] Skipping — same article already in DB (hash match): ${urlLabel}\n`);
      continue;
    }

    consecutiveFailures = 0;

    try {
      const translatedArticle = await agents.translation.run(article);

      if (!translatedArticle || translatedArticle.title === article.title ||
          translatedArticle.title.includes('**Translation**') ||
          translatedArticle.content.includes('**Translation**')) {
        throw new Error('Translation failed or returned original/garbage text');
      }

      const enhancementGate = agents.enhancement.ensureFullContent(translatedArticle);
      if (!enhancementGate.ok) {
        runReport.metrics.rejectedSave++;
        incrementCategoryStat(runReport.categories, category, 'rejected');
        recordRunBatch(runReport, 'rejected', {
          url,
          category,
          title: translatedArticle?.title || article.title,
          stage: enhancementGate.stage,
          reasonCode: 'TLDR_ONLY_CONTENT',
          reason: enhancementGate.reason,
          replayBatch,
          replayReason,
        });
        console.log(`🚫 [${category}] Article rejected by enhancement gate: ${enhancementGate.reason}\n`);
        continue;
      }

      const articleData = {
        ...translatedArticle,
        category,
        slug: getPreferredArticleSlug(translatedArticle),
        discoveryDateAssessment: candidate.dateAssessment || null,
      };

      if (dryRun) {
        recordRunBatch(runReport, 'skipped', {
          url,
          category,
          title: articleData.title,
          slug: articleData.slug,
          stage: 'dry_run',
          reason: 'Dry run skipped database save',
          replayBatch,
          replayReason,
        });
        console.log(`🧪 [${category}] Dry run — skipped database save\n`);
        continue;
      }

      const result = await agents.persistence.save(articleData);
      const disposition = agents.quality.getSaveDisposition(result);

      if (disposition === 'saved') {
        runReport.metrics.saved++;
        incrementCategoryStat(runReport.categories, category, 'saved');
        recordRunBatch(runReport, 'saved', {
          url,
          category,
          title: articleData.title,
          slug: result.data?.slug || articleData.slug,
          articleId: result.data?.id || null,
          replayBatch,
          replayReason,
        });
        console.log(`✅ [${category}] Article added successfully to Supabase!\n`);
      } else if (disposition === 'rejected') {
        if (result?.reason === 'date_integrity_rejected') {
          runReport.metrics.futureRejected++;
          incrementCategoryStat(runReport.categories, category, 'futureRejected');
        } else {
          runReport.metrics.rejectedSave++;
          incrementCategoryStat(runReport.categories, category, 'rejected');
        }

        recordRunBatch(runReport, 'rejected', {
          url,
          category,
          title: articleData.title,
          slug: articleData.slug,
          stage: 'save_rejected',
          reason: result.error?.message || result.reason || 'Article rejected by save pipeline',
          replayBatch,
          replayReason,
        });
        console.log(`🚫 [${category}] Article rejected by save pipeline\n`);
      } else if (disposition === 'deferred') {
        runReport.metrics.deferred++;
        incrementCategoryStat(runReport.categories, category, 'deferred');
        recordRunBatch(runReport, 'deferred', {
          url,
          category,
          title: articleData.title,
          slug: articleData.slug,
          stage: 'save_deferred',
          reason: result.error?.message || result.reason || 'Article deferred by save pipeline',
          replayBatch,
          replayReason,
        });
        console.log(`⏸️  [${category}] Article deferred by save pipeline\n`);
      } else {
        runReport.metrics.saveFailed++;
        incrementCategoryStat(runReport.categories, category, 'failed');
        recordRunBatch(runReport, 'failed', {
          url,
          category,
          title: articleData.title,
          slug: articleData.slug,
          stage: 'save',
          reason: result.error?.message || result.reason || 'Failed to save article',
          replayBatch,
          replayReason,
        });
        console.log(`❌ [${category}] Failed to save article to database\n`);
      }
    } catch (translationError) {
      runReport.metrics.translationFailed++;
      incrementCategoryStat(runReport.categories, category, 'failed');
      recordRunBatch(runReport, 'failed', {
        url,
        category,
        stage: 'translation',
        reason: translationError.message,
        replayBatch,
        replayReason,
      });
      console.log(`❌ [${category}] Translation failed: ${translationError.message}\n`);
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
  }

  return { circuitBreakerTriggered };
}

// ─── Main orchestrator ───

async function scrapeNews(argv = process.argv) {
  const scraperRouter = new ScraperRouter(CONFIG.FIRECRAWL_API_KEY);
  const agents = createAgents(scraperRouter);
  const runLabel = getRequestedRunLabel(argv);
  const runDate = getRequestedRunDate(argv);
  const dryRun = argv.includes('--dry-run');
  const runReport = createRunReport({
    mode: 'scrape',
    scraperName: scraperRouter.getActiveScraperName(),
    runLabel,
    runDate,
  });
  let currentCount = 0;
  let finalCount = 0;
  let circuitBreakerTriggered = false;

  console.log('🚀 Starting Multi-Category Tech News Scraper...\n');
  console.log('='.repeat(60));
  console.log(`📂 Categories to scrape: ${CONFIG.CATEGORIES.length}`);
  console.log(`🔧 Scraper: ${scraperRouter.getActiveScraperName()}`);
  CONFIG.CATEGORIES.forEach(cat => console.log(`   • ${cat.tag}: ${cat.name}`));
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('🔍 DRY RUN — database saves and Telegram notifications are disabled\n');
  }

  currentCount = await agents.persistence.getArticleCount();
  console.log(`\n📊 Current database: ${currentCount} articles\n`);

  const scrapeSummary = await agents.discovery.discover();
  const articleCandidates = scrapeSummary.articles.map(ensureCandidateDateAssessment);
  runReport.metrics.rawDiscovered = scrapeSummary.rawCount;
  runReport.metrics.uniqueCandidates = articleCandidates.length;
  runReport.categories = scrapeSummary.categoryStats;

  if (articleCandidates.length === 0) {
    console.log('⚠️ No articles found in any category. Exiting.');
    finalCount = currentCount;
    finalizeRunReport(runReport, {
      databaseCountBefore: currentCount,
      databaseCountAfter: finalCount,
      circuitBreakerTriggered: false,
    });
    await persistRunReport(runReport, runLabel ? `tech-news-scrape-run-${runLabel}` : 'tech-news-scrape-run');
    return;
  }

  console.log(`📝 Found ${articleCandidates.length} unique article candidates...\n`);

  const partitionedCandidates = agents.discovery.partition(articleCandidates, runReport.categories);
  runReport.metrics.todayCandidates = partitionedCandidates.today.length;
  runReport.metrics.unknownCandidates = partitionedCandidates.unknown.length;

  const MAX_RECENT_DAYS = MAX_RECENT_PUBLISH_DAYS;
  const recentStaleCandidates = [];

  for (const candidate of partitionedCandidates.stale) {
    const ageDays = candidate.dateAssessment?.ageDays;
    if (typeof ageDays === 'number' && ageDays <= MAX_RECENT_DAYS) {
      recentStaleCandidates.push(candidate);
    } else {
      runReport.metrics.staleSkipped++;
      incrementCategoryStat(runReport.categories, candidate.category, 'staleSkipped');
      recordRunBatch(runReport, 'skipped', {
        url: candidate.url,
        category: candidate.category,
        title: candidate.title,
        stage: 'stale_candidate',
        reason: `Discovery date is stale (${candidate.dateAssessment.isoDate || candidate.rawDate || 'unknown'}, ${ageDays ?? '?'}d old, exceeds ${MAX_RECENT_DAYS}d window)`,
        rawDate: candidate.rawDate,
        normalizedDate: candidate.normalizedDate,
      });
    }
  }

  runReport.metrics.recentStaleCandidates = recentStaleCandidates.length;

  for (const candidate of partitionedCandidates.future) {
    runReport.metrics.futureRejected++;
    incrementCategoryStat(runReport.categories, candidate.category, 'futureRejected');
    recordRunBatch(runReport, 'rejected', {
      url: candidate.url,
      category: candidate.category,
      title: candidate.title,
      stage: 'future_candidate',
      reason: `Discovery date is in the future (${candidate.dateAssessment.isoDate || candidate.rawDate || 'unknown'})`,
      rawDate: candidate.rawDate,
      normalizedDate: candidate.normalizedDate,
    });
  }

  console.log(
    `📅 Candidate partition: today=${partitionedCandidates.today.length} | ` +
    `recent=${recentStaleCandidates.length} | ` +
    `unknown=${partitionedCandidates.unknown.length} | ` +
    `stale=${partitionedCandidates.stale.length - recentStaleCandidates.length} | future=${partitionedCandidates.future.length}`
  );

  const actionableCandidates = [
    ...partitionedCandidates.today,
    ...recentStaleCandidates,
    ...partitionedCandidates.unknown,
  ];

  if (actionableCandidates.length === 0) {
    console.log('ℹ️  No today or unknown candidates remain after date partitioning.');
    finalCount = currentCount;
    finalizeRunReport(runReport, {
      databaseCountBefore: currentCount,
      databaseCountAfter: finalCount,
      circuitBreakerTriggered: false,
    });
    await persistRunReport(runReport, runLabel ? `tech-news-scrape-run-${runLabel}` : 'tech-news-scrape-run');
    return;
  }

  console.log(`🔍 Checking which actionable articles already exist in database...`);
  const existingUrls = await agents.persistence.getExistingArticles(actionableCandidates.map(a => a.url));
  const existingCandidates = actionableCandidates.filter(candidate => existingUrls.has(candidate.url));
  const missingCandidates = actionableCandidates.filter(candidate => !existingUrls.has(candidate.url));

  runReport.metrics.alreadyInDb = existingCandidates.length;
  runReport.metrics.skippedExisting = existingCandidates.length;
  runReport.metrics.newAfterDbCheck = missingCandidates.length;

  for (const candidate of existingCandidates) {
    incrementCategoryStat(runReport.categories, candidate.category, 'alreadyInDb');
    recordRunBatch(runReport, 'skipped', {
      url: candidate.url,
      category: candidate.category,
      title: candidate.title,
      stage: 'already_in_db',
      reason: 'Candidate already exists in DB before detail scrape',
      rawDate: candidate.rawDate,
      normalizedDate: candidate.normalizedDate,
    });
  }

  console.log(`✅ Missing after DB check: ${missingCandidates.length}`);
  console.log(`⏭️  Already in DB: ${existingCandidates.length}`);

  const todayMissingCandidates = missingCandidates.filter(candidate => candidate.dateStatus === 'today');
  const recentStaleMissing = missingCandidates.filter(candidate =>
    candidate.dateStatus === 'stale' &&
    typeof candidate.dateAssessment?.ageDays === 'number' &&
    candidate.dateAssessment.ageDays <= MAX_RECENT_DAYS
  );
  const unknownMissingCandidates = missingCandidates.filter(candidate => candidate.dateStatus === 'unknown');
  const verifiedUnknownCandidates = await verifyUnknownCandidates(unknownMissingCandidates, agents, runReport);
  const promotableCandidates = [...todayMissingCandidates, ...recentStaleMissing, ...verifiedUnknownCandidates];
  const newArticles = promotableCandidates.slice(0, CONFIG.MAX_ARTICLES_PER_RUN);
  const deferredByCap = promotableCandidates.slice(CONFIG.MAX_ARTICLES_PER_RUN);

  runReport.metrics.deferred += deferredByCap.length;

  if (deferredByCap.length > 0) {
    console.log(`⏸️  Deferring ${deferredByCap.length} candidate(s) due to per-run cap (${CONFIG.MAX_ARTICLES_PER_RUN}).`);
    deferredByCap.forEach(candidate => {
      incrementCategoryStat(runReport.categories, candidate.category, 'deferred');
      recordRunBatch(runReport, 'deferred', {
        url: candidate.url,
        category: candidate.category,
        title: candidate.title,
        stage: 'per_run_cap',
        reason: `Deferred because MAX_ARTICLES_PER_RUN=${CONFIG.MAX_ARTICLES_PER_RUN}`,
        rawDate: candidate.rawDate,
        normalizedDate: candidate.normalizedDate,
      });
    });
  }
  console.log('');

  if (newArticles.length === 0) {
    console.log('ℹ️  No verified today candidates remain after DB checks and date verification.');
    finalCount = currentCount;
    finalizeRunReport(runReport, {
      databaseCountBefore: currentCount,
      databaseCountAfter: finalCount,
      circuitBreakerTriggered: false,
    });
    await persistRunReport(runReport, runLabel ? `tech-news-scrape-run-${runLabel}` : 'tech-news-scrape-run');
    return;
  }

  const processResult = await processArticleQueue(newArticles, agents, runReport, {
    dryRun,
  });
  circuitBreakerTriggered = processResult.circuitBreakerTriggered;

  if (!dryRun && circuitBreakerTriggered) {
    const rejectedCount = runReport.metrics.rejectedGarbage + runReport.metrics.rejectedSave + runReport.metrics.futureRejected + runReport.metrics.rejectedDateMismatch;
    const failedCount = runReport.metrics.scrapeFailed + runReport.metrics.translationFailed + runReport.metrics.saveFailed;
    const remaining = Math.max(0, newArticles.length - (
      runReport.metrics.saved +
      runReport.metrics.rejectedGarbage +
      runReport.metrics.rejectedSave +
      runReport.metrics.futureRejected +
      runReport.metrics.rejectedDateMismatch +
      runReport.metrics.scrapeFailed +
      runReport.metrics.translationFailed +
      runReport.metrics.saveFailed +
      runReport.metrics.deferred +
      runReport.metrics.skippedAlreadyProcessed +
      runReport.metrics.skippedSourceUrl +
      runReport.metrics.skippedHashDuplicate
    ));

    console.log(`🚨 Circuit breaker triggered: ${CONFIG.MAX_CONSECUTIVE_FAILURES} consecutive failures exceeded`);
    console.log(`📊 Saved: ${runReport.metrics.saved} | Rejected: ${rejectedCount} | Failed: ${failedCount} | Remaining: ${remaining}`);
  }

  finalCount = await agents.persistence.getArticleCount();
  finalizeRunReport(runReport, {
    databaseCountBefore: currentCount,
    databaseCountAfter: finalCount,
    circuitBreakerTriggered,
  });

  console.log('='.repeat(60));
  console.log(`🎉 Multi-Category Scraping Completed!`);
  console.log(`📊 Saved: ${runReport.metrics.saved} | Rejected: ${runReport.metrics.rejected} | Skipped: ${runReport.metrics.skipped} | Deferred: ${runReport.metrics.deferred} | Failed: ${runReport.metrics.failed} | Total: ${finalCount}`);
  console.log(`🔧 Scraper used: ${scraperRouter.getActiveScraperName()}`);
  console.log('='.repeat(60));
  await persistRunReport(runReport, runLabel ? `tech-news-scrape-run-${runLabel}` : 'tech-news-scrape-run');

  if (!dryRun && !circuitBreakerTriggered) {
    const totalProcessed = runReport.metrics.saved + runReport.metrics.rejected + runReport.metrics.failed;
    const successRate = totalProcessed > 0 ? Math.round((runReport.metrics.saved / totalProcessed) * 100) : 0;
    const hasUnsavedActionableCandidates =
      runReport.metrics.saved === 0 && runReport.metrics.newAfterDbCheck > 0;

    let statusEmoji = runReport.metrics.saved > 0 ? '✅' : 'ℹ️';
    if (runReport.metrics.failed > 0 && runReport.metrics.saved === 0) statusEmoji = '❌';
    else if (hasUnsavedActionableCandidates) statusEmoji = '⚠️';
    else if (runReport.metrics.failed > runReport.metrics.saved) statusEmoji = '⚠️';

    // Telegram notification is handled by GitHub Actions (telegram-tech-news-success-message.cjs)
    // to avoid duplicate messages. Only console output here for CI logs.
    console.log(`${statusEmoji} Scraper completed — Saved: ${runReport.metrics.saved} | Success: ${successRate}% | Total: ${finalCount}`);
  }
}

async function replayBatch(filePath, argv = process.argv) {
  const resolvedPath = resolveArtifactPath(filePath);
  const replayStatuses = normalizeReplayStatuses(getCliArg('--replay-status', argv) || getCliArg('--replay-statuses', argv));
  const runLabel = getRequestedRunLabel(argv);
  const runDate = getRequestedRunDate(argv);
  const raw = await fs.readFile(resolvedPath, 'utf8');
  const payload = JSON.parse(raw);
  const replayCandidates = buildReplayCandidates(payload, replayStatuses);
  const scraperRouter = new ScraperRouter(CONFIG.FIRECRAWL_API_KEY);
  const agents = createAgents(scraperRouter);
  const runReport = createRunReport({
    mode: 'replay',
    scraperName: scraperRouter.getActiveScraperName(),
    sourceArtifact: resolvedPath,
    replayStatuses,
    runLabel,
    runDate,
  });

  let currentCount = await agents.persistence.getArticleCount();
  let finalCount = currentCount;
  runReport.metrics.replayCandidates = replayCandidates.length;

  console.log(`\n♻️  REPLAY MODE`);
  console.log(`🧾 Source artifact: ${resolvedPath}`);
  console.log(`🎯 Replay batches: ${replayStatuses.join(', ')}`);
  console.log(`📰 Replay candidates: ${replayCandidates.length}`);
  console.log(`🔧 Scraper: ${scraperRouter.getActiveScraperName()}`);
  console.log('='.repeat(60));

  console.log(`♻️ Replay started — ${resolvedPath.split('/').pop()} | Statuses: ${replayStatuses.join(', ')} | Candidates: ${replayCandidates.length} | Scraper: ${scraperRouter.getActiveScraperName()}`);

  if (replayCandidates.length === 0) {
    finalizeRunReport(runReport, {
      databaseCountBefore: currentCount,
      databaseCountAfter: finalCount,
      circuitBreakerTriggered: false,
    });
    await persistRunReport(runReport, runLabel ? `tech-news-replay-run-${runLabel}` : 'tech-news-replay-run');
    console.log('ℹ️  No replayable URLs found in artifact.');
    return;
  }

  const processResult = await processArticleQueue(replayCandidates, agents, runReport);
  finalCount = await agents.persistence.getArticleCount();
  finalizeRunReport(runReport, {
    databaseCountBefore: currentCount,
    databaseCountAfter: finalCount,
    circuitBreakerTriggered: processResult.circuitBreakerTriggered,
  });

  console.log('='.repeat(60));
  console.log(`🎉 Replay Completed!`);
  console.log(`📊 Saved: ${runReport.metrics.saved} | Rejected: ${runReport.metrics.rejected} | Skipped: ${runReport.metrics.skipped} | Failed: ${runReport.metrics.failed} | Total: ${finalCount}`);
  console.log('='.repeat(60));
  await persistRunReport(runReport, runLabel ? `tech-news-replay-run-${runLabel}` : 'tech-news-replay-run');
}

// ─── Single-article test mode ───

async function testSingleUrl(url) {
  const scraperRouter = new ScraperRouter(CONFIG.FIRECRAWL_API_KEY);
  const agents = createAgents(scraperRouter);

  console.log(`\n🧪 TEST MODE — Single article pipeline`);
  console.log(`📰 URL: ${url}`);
  console.log(`🔧 Scraper: ${scraperRouter.getActiveScraperName()}`);
  console.log('='.repeat(60));

  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('🔍 DRY RUN — will not save to database\n');

  console.log('\n1️⃣  scrapeArticleDetails()...');
  const article = await agents.detail.extract(url);

  if (!article) {
    console.error('❌ scrapeArticleDetails returned null — scraping failed');
    process.exit(1);
  }

  console.log(`   ✅ Title: "${article.title.substring(0, 70)}"`);
  console.log(`   ✅ Content: ${article.content.length} chars`);
  console.log(`   ✅ Source: ${article.originalSource}`);
  console.log(`   ✅ Slug: ${article.slug}`);

  console.log('\n2️⃣  isGarbageContent()...');
  const garbageReason = agents.quality.getGarbageReason(article.title, article.content);
  if (garbageReason) {
    console.error(`   ❌ GARBAGE REJECTED: ${garbageReason}`);
    process.exit(1);
  }
  console.log('   ✅ Passed — no garbage detected');

  console.log('\n3️⃣  translateArticle()...');
  const translatedArticle = await agents.translation.run(article);

  if (!translatedArticle || translatedArticle.title === article.title) {
    console.error('   ❌ Translation failed or returned original text');
    process.exit(1);
  }

  const enhancementGate = agents.enhancement.ensureFullContent(translatedArticle);
  if (!enhancementGate.ok) {
    console.error(`   ❌ ${enhancementGate.reason}`);
    process.exit(1);
  }

  console.log(`   ✅ Title: "${translatedArticle.title}"`);
  console.log(`   ✅ Description: "${translatedArticle.description.substring(0, 100)}..."`);
  console.log(`   ✅ Content: ${translatedArticle.content.length} chars`);

  console.log('\n── Translated content (first 500 chars) ──');
  console.log(translatedArticle.content.substring(0, 500));
  console.log('── end preview ──\n');

  const category = process.argv.find((a, i) => process.argv[i - 1] === '--category') || 'News';
  const articleData = {
    ...translatedArticle,
    category,
    slug: getPreferredArticleSlug(translatedArticle),
    discoveryDateAssessment: article.dateAssessment || null,
  };

  if (dryRun) {
    console.log('4️⃣  saveArticle() — SKIPPED (dry run)');
    console.log(`   Slug would be: ${articleData.slug}`);
    console.log('\n✅ DRY RUN COMPLETE — pipeline works!\n');
    return;
  }

  console.log('4️⃣  saveArticle()...');
  const result = await agents.persistence.save(articleData);

  if (result.success) {
    console.log(`   ✅ Saved! (ID: ${result.data?.id})`);
    console.log(`\n🎉 TEST COMPLETE — article live at:`);
    console.log(`   https://cemkoyluoglu.codes/tech-news/${articleData.slug}\n`);
  } else {
    console.error(`   ❌ Save failed: ${result.error?.message || result.reason}`);
    process.exit(1);
  }
}

// ─── Force URL ingest mode ───
//
// Directly processes one or more source URLs without running discovery.
// Applies the full pipeline: detail extract → quality → translate → enhance → persist.
// The date gate is relaxed for forced URLs: any article date is accepted as long as
// it is not future-dated. This allows ingesting recent articles missed by discovery.

async function forceIngestUrls(urls, argv = process.argv) {
  const scraperRouter = new ScraperRouter(CONFIG.FIRECRAWL_API_KEY);
  const agents = createAgents(scraperRouter);
  const runLabel = getRequestedRunLabel(argv);
  const runDate = getRequestedRunDate(argv);
  const dryRun = argv.includes('--dry-run');

  console.log(`\n🎯 FORCE-INGEST MODE — ${urls.length} URL(s) provided`);
  console.log(`🔧 Scraper: ${scraperRouter.getActiveScraperName()}`);
  console.log('='.repeat(60));
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('🔍 DRY RUN — database saves and Telegram notifications are disabled\n');
  }

  const runReport = createRunReport({
    mode: 'force_ingest',
    scraperName: scraperRouter.getActiveScraperName(),
    runLabel,
    runDate,
  });

  const currentCount = await agents.persistence.getArticleCount();
  console.log(`\n📊 Current database: ${currentCount} articles\n`);

  // Build candidates with a forced category; duplicate handling still applies.
  const forcedCandidates = urls.map(url => ({
    url,
    category: 'News',
    replayBatch: 'force_ingest',
    replayReason: 'Manually forced via workflow_dispatch force_urls input',
    prefetchedArticle: null,
    dateStatus: 'unknown', // relaxed gate — let detail scrape resolve
    dateAssessment: { dateStatus: 'unknown', datePriority: 50 },
    datePriority: 50,
  }));

  runReport.categories = [{
    tag: 'ForcedIngest',
    name: 'Forced Ingest',
    slug: null,
    url: '',
    discovered: forcedCandidates.length,
    todayCandidates: 0,
    unknownCandidates: forcedCandidates.length,
    alreadyInDb: 0,
    verifiedUnknown: 0,
    staleSkipped: 0,
    futureRejected: 0,
    saved: 0,
    rejected: 0,
    deferred: 0,
    failed: 0,
  }];

  runReport.metrics.rawDiscovered = forcedCandidates.length;
  runReport.metrics.uniqueCandidates = forcedCandidates.length;

  // Check which are already in DB (force mode still respects duplicate detection).
  console.log('🔍 Checking which URLs already exist in database...');
  const existingUrls = await agents.persistence.getExistingArticles(forcedCandidates.map(c => c.url));
  const alreadyInDb = forcedCandidates.filter(c => existingUrls.has(c.url));
  const toProcess = forcedCandidates.filter(c => !existingUrls.has(c.url));

  runReport.metrics.alreadyInDb = alreadyInDb.length;
  runReport.metrics.skippedExisting = alreadyInDb.length;
  runReport.metrics.newAfterDbCheck = toProcess.length;

  for (const c of alreadyInDb) {
    recordRunBatch(runReport, 'skipped', {
      url: c.url,
      category: c.category,
      stage: 'already_in_db',
      reason: 'Force-ingest: source_url already exists in DB',
    });
    console.log(`⏭️  Already in DB — skipping: ${c.url}`);
  }

  if (toProcess.length === 0) {
    console.log('\nℹ️  All provided URLs already exist in the database.\n');
    const finalCount = await agents.persistence.getArticleCount();
    finalizeRunReport(runReport, { databaseCountBefore: currentCount, databaseCountAfter: finalCount });
    await persistRunReport(runReport, runLabel ? `tech-news-force-ingest-run-${runLabel}` : 'tech-news-force-ingest-run');
    return;
  }

  console.log(`\n✅ URLs to process: ${toProcess.length}\n`);

  let consecutiveFailures = 0;

  for (const candidate of toProcess) {
    const { url } = candidate;
    const urlLabel = url.split('/').filter(Boolean).pop() || url;

    if (consecutiveFailures >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
      console.log(`\n🚨 Circuit breaker activated: ${consecutiveFailures} consecutive failures`);
      runReport.metrics.circuitBreakerTrips = (runReport.metrics.circuitBreakerTrips || 0) + 1;
      break;
    }

    console.log(`📰 [Force] Processing: ${url}`);

    const article = await agents.detail.extract(url);
    if (!article) {
      runReport.metrics.scrapeFailed++;
      recordRunBatch(runReport, 'failed', {
        url, category: candidate.category,
        stage: 'detail_extraction',
        reason: 'scrapeArticleDetails returned null',
        replayBatch: candidate.replayBatch,
      });
      console.log(`❌ [Force] Failed to scrape: ${urlLabel}\n`);
      consecutiveFailures++;
      continue;
    }

    // Date check: reject future-dated articles but accept today/stale/unknown.
    const dateDecision = getProcessingDateDecision(candidate, article);
    if (dateDecision.action === 'reject' && dateDecision.stage === 'detail_future_date') {
      runReport.metrics.futureRejected++;
      recordRunBatch(runReport, 'rejected', {
        url, category: candidate.category,
        stage: dateDecision.stage,
        reason: dateDecision.reason,
        replayBatch: candidate.replayBatch,
      });
      console.log(`🚫 [Force] Rejected — future date: ${urlLabel}\n`);
      consecutiveFailures = 0;
      continue;
    }

    const garbageReason = agents.quality.getGarbageReason(article.title, article.content);
    if (garbageReason) {
      runReport.metrics.rejectedGarbage++;
      recordRunBatch(runReport, 'rejected', {
        url, category: candidate.category,
        stage: 'garbage_content',
        reason: garbageReason,
        replayBatch: candidate.replayBatch,
      });
      console.log(`🚫 [Force] Rejected garbage: ${garbageReason.substring(0, 80)}\n`);
      consecutiveFailures = 0;
      continue;
    }

    const isHashDup = await agents.persistence.isHashDuplicate(article.title);
    if (isHashDup) {
      runReport.metrics.skippedHashDuplicate++;
      recordRunBatch(runReport, 'skipped', {
        url, category: candidate.category,
        stage: 'content_hash_duplicate',
        reason: 'same article already exists in DB (hash match)',
        title: article.title,
        replayBatch: candidate.replayBatch,
      });
      console.log(`⏭️  [Force] Skipping — content hash duplicate: ${urlLabel}\n`);
      consecutiveFailures = 0;
      continue;
    }

    consecutiveFailures = 0;

    try {
      const translatedArticle = await agents.translation.run(article);

      if (!translatedArticle || translatedArticle.title === article.title ||
          translatedArticle.title.includes('**Translation**') ||
          translatedArticle.content.includes('**Translation**')) {
        throw new Error('Translation failed or returned original/garbage text');
      }

      const enhancementGate = agents.enhancement.ensureFullContent(translatedArticle);
      if (!enhancementGate.ok) {
        runReport.metrics.rejectedSave++;
        recordRunBatch(runReport, 'rejected', {
          url, category: candidate.category,
          title: translatedArticle?.title || article.title,
          stage: enhancementGate.stage,
          reasonCode: 'TLDR_ONLY_CONTENT',
          reason: enhancementGate.reason,
          replayBatch: candidate.replayBatch,
        });
        console.log(`🚫 [Force] Rejected by enhancement gate: ${enhancementGate.reason}\n`);
        continue;
      }

      const articleData = {
        ...translatedArticle,
        category: candidate.category,
        slug: getPreferredArticleSlug(translatedArticle),
        discoveryDateAssessment: article.dateAssessment || null,
      };

      if (dryRun) {
        recordRunBatch(runReport, 'skipped', {
          url, category: candidate.category,
          title: articleData.title,
          slug: articleData.slug,
          stage: 'dry_run',
          reason: 'Dry run skipped database save',
          replayBatch: candidate.replayBatch,
        });
        console.log(`🧪 [Force] Dry run — slug would be: ${articleData.slug}\n`);
        continue;
      }

      const result = await agents.persistence.save(articleData);
      const disposition = agents.quality.getSaveDisposition(result);

      if (disposition === 'saved') {
        runReport.metrics.saved++;
        recordRunBatch(runReport, 'saved', {
          url, category: candidate.category,
          title: articleData.title,
          slug: result.data?.slug || articleData.slug,
          articleId: result.data?.id || null,
          replayBatch: candidate.replayBatch,
        });
        console.log(`✅ [Force] Saved: "${articleData.title.substring(0, 60)}"\n`);
      } else {
        runReport.metrics.rejectedSave++;
        recordRunBatch(runReport, disposition === 'deferred' ? 'deferred' : 'rejected', {
          url, category: candidate.category,
          title: articleData.title,
          slug: articleData.slug,
          stage: 'save',
          reason: result.error?.message || result.reason || 'Failed to save',
          replayBatch: candidate.replayBatch,
        });
        console.log(`🚫 [Force] Not saved (${disposition}): ${result.error?.message || result.reason}\n`);
      }
    } catch (translationError) {
      runReport.metrics.translationFailed++;
      recordRunBatch(runReport, 'failed', {
        url, category: candidate.category,
        stage: 'translation',
        reason: translationError.message,
        replayBatch: candidate.replayBatch,
      });
      console.log(`❌ [Force] Translation failed: ${translationError.message}\n`);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
  }

  const finalCount = await agents.persistence.getArticleCount();
  finalizeRunReport(runReport, {
    databaseCountBefore: currentCount,
    databaseCountAfter: finalCount,
  });

  console.log('='.repeat(60));
  console.log(`🎉 Force Ingest Completed!`);
  console.log(`📊 Saved: ${runReport.metrics.saved} | Rejected: ${runReport.metrics.rejected} | Skipped: ${runReport.metrics.skipped} | Failed: ${runReport.metrics.failed}`);
  console.log('='.repeat(60));

  await persistRunReport(runReport, runLabel ? `tech-news-force-ingest-run-${runLabel}` : 'tech-news-force-ingest-run');
}

export async function runScraperCli(argv = process.argv) {
  const replayFile = getCliArg('--replay-file', argv);
  const testUrlIndex = argv.indexOf('--test-url');
  const forceUrlsArg = getCliArg('--force-urls', argv) || process.env.TECH_NEWS_FORCE_URLS || '';

  if (replayFile) {
    return replayBatch(replayFile, argv);
  }

  if (testUrlIndex !== -1 && argv[testUrlIndex + 1]) {
    return testSingleUrl(argv[testUrlIndex + 1]);
  }

  if (forceUrlsArg) {
    const urls = forceUrlsArg.split(',').map(u => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      return forceIngestUrls(urls, argv);
    }
  }

  return scrapeNews(argv);
}
