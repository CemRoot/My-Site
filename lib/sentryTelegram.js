/**
 * Turn a Sentry webhook payload into a Telegram HTML message.
 *
 * Handles the payloads Sentry can send to /api/sentry-webhook:
 * - Internal Integration "issue" webhooks (sentry-hook-resource: issue)
 * - Internal Integration alert-rule actions (sentry-hook-resource: event_alert)
 * - The legacy WebHooks plugin (flat payload with message/url/level)
 *
 * Returns null for payloads that should not produce a notification
 * (installation pings, issue actions other than created/regressed, ...).
 */

const MAX_TITLE = 300;
const MAX_CULPRIT = 200;

const LEVEL_ICON = {
  fatal: '💀',
  error: '🔴',
  warning: '🟠',
  info: '🔵',
  debug: '⚪',
};

const ISSUE_ACTIONS = {
  created: 'YENİ HATA',
  unresolved: 'HATA TEKRAR AÇILDI',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(value, max) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function tagValue(tags, key) {
  if (!Array.isArray(tags)) return undefined;
  const tag = tags.find((t) => Array.isArray(t) ? t[0] === key : t?.key === key);
  return Array.isArray(tag) ? tag[1] : tag?.value;
}

function render({ heading, level, title, culprit, project, environment, release, shortId, url, rule }) {
  const icon = LEVEL_ICON[level] || '🔴';
  const lines = [
    `${icon} <b>SENTRY: ${escapeHtml(heading)}</b>`,
    '',
    `<b>${escapeHtml(truncate(title || 'Untitled error', MAX_TITLE))}</b>`,
  ];

  if (culprit) lines.push(`📍 <code>${escapeHtml(truncate(culprit, MAX_CULPRIT))}</code>`);
  lines.push('');
  if (shortId) lines.push(`🆔 ${escapeHtml(shortId)}`);
  if (project) lines.push(`📦 Proje: ${escapeHtml(project)}`);
  if (level) lines.push(`⚠️ Seviye: ${escapeHtml(level)}`);
  if (environment) lines.push(`🌍 Ortam: ${escapeHtml(environment)}`);
  if (release) lines.push(`🔖 Sürüm: ${escapeHtml(String(release).slice(0, 12))}`);
  if (rule) lines.push(`📏 Kural: ${escapeHtml(rule)}`);
  if (url) lines.push('', `🔗 <a href="${escapeHtml(url)}">Sentry'de aç</a>`);

  return lines.join('\n');
}

/**
 * @param {string | undefined} resource - value of the `sentry-hook-resource` header
 * @param {any} payload - parsed JSON body
 * @returns {string | null}
 */
export function formatSentryTelegramMessage(resource, payload) {
  if (!payload || typeof payload !== 'object') return null;

  if (resource === 'installation') return null;

  if (resource === 'issue') {
    const heading = ISSUE_ACTIONS[payload.action];
    const issue = payload.data?.issue;
    if (!heading || !issue) return null;
    return render({
      heading,
      level: issue.level,
      title: issue.title,
      culprit: issue.culprit,
      project: issue.project?.slug || issue.project?.name,
      shortId: issue.shortId,
      url: issue.web_url || issue.permalink,
    });
  }

  if (resource === 'event_alert') {
    const event = payload.data?.event;
    if (!event) return null;
    return render({
      heading: 'ALARM',
      level: event.level,
      title: event.title || event.message,
      culprit: event.culprit,
      project: event.project_slug || event.project,
      environment: event.environment || tagValue(event.tags, 'environment'),
      release: event.release || tagValue(event.tags, 'release'),
      url: event.web_url || event.issue_url,
      rule: payload.data?.triggered_rule,
    });
  }

  // Legacy WebHooks plugin: no resource header, flat payload.
  if (payload.message || payload.event) {
    const event = payload.event || {};
    return render({
      heading: 'YENİ HATA',
      level: payload.level || event.level,
      title: event.title || payload.message,
      culprit: payload.culprit || event.culprit,
      project: payload.project_slug || payload.project_name || payload.project,
      environment: event.environment || tagValue(event.tags, 'environment'),
      release: event.release || tagValue(event.tags, 'release'),
      url: payload.url,
    });
  }

  return null;
}
