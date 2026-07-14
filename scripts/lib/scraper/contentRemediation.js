/**
 * LangChain-style content remediation loop.
 * Diagnoses validation failures, routes them to the responsible agent, and retries.
 */

import {
  hasSourceSocialLeak,
  stripSourceSocialLeaks,
  removeEmbedArtifactNoise,
} from '../../embeds/cleanMarkdownEmbeds.js';
import { validateArticle, autoFixArticle } from '../../validation/smartArticleProcessor.js';

export const REMEDIATION_AGENTS = {
  DETAIL: 'detail',
  SANITIZER: 'sanitizer',
  TRANSLATION: 'translation',
};

export const MAX_REMEDIATION_ROUNDS = 3;

function dedupeIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    const key = `${issue.agent}:${issue.code}:${issue.field || ''}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapErrorToIssue(errorMessage, stage = 'translation') {
  const msg = String(errorMessage || '');
  const issue = {
    message: msg,
    stage,
    fixable: false,
    agent: null,
    code: 'UNKNOWN',
    field: 'content',
  };

  if (/source social|widget placeholders|NuvemMag branding|invalid embed|leaked widget/i.test(msg)) {
    issue.agent = REMEDIATION_AGENTS.SANITIZER;
    issue.code = 'SOURCE_SOCIAL_LEAK';
    issue.fixable = true;
    return issue;
  }

  if (/Turkish|instruction leakage|translation error|Translation failed|garbage text|similar to original/i.test(msg)) {
    issue.agent = REMEDIATION_AGENTS.TRANSLATION;
    issue.code = 'TRANSLATION_QUALITY';
    issue.fixable = true;
    return issue;
  }

  if (/TL;DR-only|TLDR_ONLY|TL;DR only/i.test(msg)) {
    issue.agent = REMEDIATION_AGENTS.TRANSLATION;
    issue.code = 'TLDR_ONLY';
    issue.fixable = true;
    return issue;
  }

  return issue;
}

export function isTldrOnlyContent(content) {
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

export function diagnoseArticle(article, { sourceArticle = null } = {}) {
  const issues = [];

  for (const field of ['title', 'description', 'content']) {
    if (hasSourceSocialLeak(article[field])) {
      issues.push({
        agent: REMEDIATION_AGENTS.SANITIZER,
        code: 'SOURCE_SOCIAL_LEAK',
        field,
        message: `${field} contains source social links or leaked widget tags`,
        fixable: true,
      });
    }
  }

  if (sourceArticle) {
    for (const field of ['title', 'content']) {
      if (hasSourceSocialLeak(sourceArticle[field])) {
        issues.push({
          agent: REMEDIATION_AGENTS.DETAIL,
          code: 'SOURCE_SCRAPE_LEAK',
          field,
          message: `Source scrape ${field} contains social footer widgets — re-extract needed`,
          fixable: true,
        });
      }
    }
  }

  if (isTldrOnlyContent(article.content)) {
    issues.push({
      agent: REMEDIATION_AGENTS.TRANSLATION,
      code: 'TLDR_ONLY',
      field: 'content',
      message: 'TL;DR-only content detected',
      fixable: true,
    });
  }

  const validation = validateArticle({
    ...article,
    originalContent: article.originalContent || sourceArticle?.content,
  });

  if (!validation.isValid) {
    for (const err of validation.errors) {
      const mapped = mapErrorToIssue(err);
      if (!mapped.fixable || !mapped.agent) {
        continue;
      }
      issues.push({
        ...mapped,
        message: err,
        field: mapped.field || 'content',
      });
    }
  }

  return dedupeIssues(issues);
}

export function applySanitizerFix(article) {
  const cleanField = (value) =>
    removeEmbedArtifactNoise(stripSourceSocialLeaks(String(value || '')));

  return {
    ...article,
    title: cleanField(article.title),
    description: cleanField(article.description),
    content: cleanField(article.content),
  };
}

export function buildTranslationHints(issues) {
  const hints = [];

  if (issues.some((i) => i.code === 'SOURCE_SOCIAL_LEAK' || i.code === 'SOURCE_SCRAPE_LEAK')) {
    hints.push(
      'Do NOT include source-site footer social links (Twitter, Instagram, LinkedIn, YouTube). ' +
        'Remove all [TWEET:], [INSTAGRAM:], markdown social link rows, plain "Twitter Instagram Linkedin Youtube" footers, ' +
        'and empty parentheses artifacts. Keep only article body and valid [[EMBED:TIKTOK|TWEET|YOUTUBE:...]] tokens.',
    );
  }

  if (issues.some((i) => i.code === 'TRANSLATION_QUALITY' && /Turkish/i.test(i.message))) {
    hints.push('Output must be 100% English with no Turkish characters or phrases.');
  }

  if (issues.some((i) => /instruction leakage/i.test(i.message))) {
    hints.push('Output ONLY the article text — no notes, reminders, or meta commentary.');
  }

  if (issues.some((i) => i.code === 'TLDR_ONLY')) {
    hints.push(
      'Include the full translated article body after TL;DR and Key Highlights — not summary-only output.',
    );
  }

  return [...new Set(hints)];
}

export function isFixableSaveRejection(errorMessage) {
  const issue = mapErrorToIssue(errorMessage, 'save');
  return issue.fixable;
}

export function prepareArticleForSaveRetry(article) {
  let prepared = applySanitizerFix(article);
  const validation = validateArticle({
    ...prepared,
    originalContent: prepared.originalContent || article.originalContent,
  });

  if (!validation.isValid && validation.fixes.length > 0) {
    const { fixed } = autoFixArticle(prepared, validation.results);
    prepared = { ...prepared, ...fixed };
  }

  return prepared;
}

function isTranslationFailure(translated, source) {
  return (
    !translated ||
    translated.title === source.title ||
    translated.title?.includes('**Translation**') ||
    translated.content?.includes('**Translation**')
  );
}

/**
 * Runs translate → diagnose → remediate loop until clean or rounds exhausted.
 */
export async function runContentPipeline(agents, { url, sourceArticle, log = console.log }) {
  let source = { ...sourceArticle };
  let remediationHints = [];
  const remediationLog = [];

  for (let round = 1; round <= MAX_REMEDIATION_ROUNDS; round++) {
    log(`   🔁 Remediation round ${round}/${MAX_REMEDIATION_ROUNDS}`);

    let translated;
    try {
      translated = await agents.translation.run(source, {
        remediationHints,
        throwOnError: true,
      });
    } catch (err) {
      const issue = mapErrorToIssue(err.message);
      remediationLog.push({ round, action: 'translation_error', error: err.message, issue });

      if (!issue.fixable || round >= MAX_REMEDIATION_ROUNDS) {
        throw new Error(`Translation failed after remediation: ${err.message}`);
      }

      remediationHints = buildTranslationHints([issue]);
      continue;
    }

    if (isTranslationFailure(translated, source)) {
      const issue = mapErrorToIssue('Translation failed or returned original/garbage text');
      remediationLog.push({ round, action: 'translation_garbage', issue });

      if (round >= MAX_REMEDIATION_ROUNDS) {
        throw new Error(issue.message);
      }

      remediationHints = buildTranslationHints([issue]);
      continue;
    }

    let issues = diagnoseArticle(translated, { sourceArticle: source });
    const fixableIssues = issues.filter((i) => i.fixable);

    if (issues.length === 0) {
      remediationLog.push({ round, action: 'validated' });
      return { article: translated, source, remediationLog };
    }

    if (fixableIssues.length === 0) {
      throw new Error(`Unfixable validation issues: ${issues.map((i) => i.message).join('; ')}`);
    }

    const sanitizerIssues = fixableIssues.filter((i) => i.agent === REMEDIATION_AGENTS.SANITIZER);
    if (sanitizerIssues.length > 0) {
      translated = applySanitizerFix(translated);
      remediationLog.push({
        round,
        action: 'sanitizer',
        issues: sanitizerIssues.map((i) => i.code),
      });

      issues = diagnoseArticle(translated, { sourceArticle: source });
      if (issues.length === 0) {
        remediationLog.push({ round, action: 'sanitizer_resolved' });
        return { article: translated, source, remediationLog };
      }
    }

    const scrapeIssues = issues.filter(
      (i) => i.fixable && i.agent === REMEDIATION_AGENTS.DETAIL,
    );
    if (scrapeIssues.length > 0 && agents.detail && url) {
      log(`   🔁 Re-extracting article (source scrape leak detected)`);
      const rescraped = await agents.detail.extract(url);
      if (!rescraped) {
        throw new Error('Re-scrape returned null during remediation');
      }
      source = rescraped;
      remediationHints = buildTranslationHints(scrapeIssues);
      remediationLog.push({ round, action: 're_scrape', url, issues: scrapeIssues.map((i) => i.code) });
      continue;
    }

    const translationIssues = issues.filter(
      (i) => i.fixable && i.agent === REMEDIATION_AGENTS.TRANSLATION,
    );
    if (translationIssues.length > 0) {
      remediationHints = buildTranslationHints(translationIssues);
      remediationLog.push({
        round,
        action: 'retry_translate',
        hints: remediationHints,
        issues: translationIssues.map((i) => i.code),
      });
      continue;
    }

    if (round >= MAX_REMEDIATION_ROUNDS) {
      throw new Error(
        `Remediation exhausted: ${issues.map((i) => i.message).join('; ')}`,
      );
    }
  }

  throw new Error(`Content pipeline exhausted ${MAX_REMEDIATION_ROUNDS} remediation rounds`);
}
