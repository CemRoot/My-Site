/**
 * Date parsing and timezone utilities for the news scraper.
 * Handles Turkish date formats and Europe/Istanbul timezone.
 */

const TURKEY_TIME_ZONE = 'Europe/Istanbul';
const DISPLAY_DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TURKISH_MONTHS = {
  'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4,
  'mayıs': 5, 'haziran': 6, 'temmuz': 7, 'ağustos': 8,
  'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12,
};

function pad2(value) {
  return String(value).padStart(2, '0');
}

function getDatePartsInTimeZone(date, timeZone = TURKEY_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  return {
    year: parseInt(parts.find(part => part.type === 'year')?.value || '0', 10),
    month: parseInt(parts.find(part => part.type === 'month')?.value || '0', 10),
    day: parseInt(parts.find(part => part.type === 'day')?.value || '0', 10),
  };
}

function buildDateOnly(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function formatDisplayDate(parts) {
  return `${parts.day}/${parts.month}/${parts.year}`;
}

function formatIsoDate(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function isValidParts(parts) {
  if (!parts) return false;
  const { year, month, day } = parts;
  if (!year || !month || !day) return false;
  const candidate = buildDateOnly(parts);
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() + 1 === month &&
    candidate.getUTCDate() === day
  );
}

function getDiffDaysFromTurkeyToday(parts) {
  const today = getTurkeyDate();
  const candidate = buildDateOnly(parts);
  return Math.round((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function parseDisplayDateParts(raw) {
  if (!DISPLAY_DATE_RE.test(raw)) return null;
  const [day, month, year] = raw.split('/').map(Number);
  const parts = { day, month, year };
  return isValidParts(parts) ? parts : null;
}

function parseIsoDateParts(raw) {
  if (!ISO_DATE_RE.test(raw)) return null;
  const [year, month, day] = raw.split('-').map(Number);
  const parts = { day, month, year };
  return isValidParts(parts) ? parts : null;
}

function parseTurkishAbsoluteDateParts(raw) {
  const match = raw.match(/(\d{1,2})\s+([a-zA-ZğüşıöçĞÜŞİÖÇ]+)\s+(\d{4})/i);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();
  const year = parseInt(match[3], 10);
  const month = TURKISH_MONTHS[monthName];
  if (!month) return null;

  const parts = { day, month, year };
  return isValidParts(parts) ? parts : null;
}

function parseRelativeDateParts(raw) {
  const normalized = raw.toLowerCase().trim();
  const now = new Date();
  const subtractByMs = (ms) => getTurkeyDateParts(new Date(now.getTime() - ms));

  if (
    normalized === 'bugün' ||
    normalized.includes('bugün') ||
    normalized === 'today' ||
    normalized.includes('today')
  ) {
    return getTurkeyDateParts(now);
  }

  if (
    normalized === 'dün' ||
    normalized.includes('dün') ||
    normalized === 'yesterday' ||
    normalized.includes('yesterday')
  ) {
    return subtractByMs(24 * 60 * 60 * 1000);
  }

  const relativePatterns = [
    { regex: /(\d+)\s*(?:dakika|minutes?)\s*(?:önce|ago)/i, unit: 'minutes' },
    { regex: /(\d+)\s*(?:saat|hours?)\s*(?:önce|ago)/i, unit: 'hours' },
    { regex: /(\d+)\s*(?:gün|days?)\s*(?:önce|ago)/i, unit: 'days' },
    { regex: /(\d+)\s*(?:hafta|weeks?)\s*(?:önce|ago)/i, unit: 'weeks' },
    { regex: /(\d+)\s*(?:ay|months?)\s*(?:önce|ago)/i, unit: 'months' },
  ];

  for (const { regex, unit } of relativePatterns) {
    const match = normalized.match(regex);
    if (!match) continue;

    const value = parseInt(match[1], 10);

    switch (unit) {
      case 'minutes':
        return subtractByMs(value * 60 * 1000);
      case 'hours':
        return subtractByMs(value * 60 * 60 * 1000);
      case 'days':
        return subtractByMs(value * 24 * 60 * 60 * 1000);
      case 'weeks':
        return subtractByMs(value * 7 * 24 * 60 * 60 * 1000);
      case 'months': {
        const tp = getTurkeyDateParts(now);
        let m = tp.month - value;
        let y = tp.year;
        while (m <= 0) { m += 12; y -= 1; }
        const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
        return { year: y, month: m, day: Math.min(tp.day, maxDay) };
      }
    }
  }

  return null;
}

function parseNativeDateParts(raw) {
  const candidate = new Date(raw);
  if (Number.isNaN(candidate.getTime())) return null;
  return getTurkeyDateParts(candidate);
}

function createUnknownDateAssessment(rawDate = '', source = 'unknown', confidence = 'low') {
  return {
    rawDate: rawDate || '',
    normalizedDate: null,
    isoDate: null,
    dateStatus: 'unknown',
    dateSource: source,
    dateConfidence: confidence,
    datePriority: 0,
    ageDays: null,
    isToday: false,
    isFuture: false,
  };
}

function createDateAssessment(parts, rawDate = '', source = 'unknown', confidence = 'medium') {
  if (!isValidParts(parts)) {
    return createUnknownDateAssessment(rawDate, source, confidence);
  }

  const diffDays = getDiffDaysFromTurkeyToday(parts);
  const dateStatus = diffDays === 0 ? 'today' : diffDays > 0 ? 'future' : 'stale';
  const datePriority = dateStatus === 'future'
    ? -100
    : dateStatus === 'today'
      ? 100
      : Math.max(0, 100 - (Math.abs(diffDays) * 10));

  return {
    rawDate: rawDate || '',
    normalizedDate: formatDisplayDate(parts),
    isoDate: formatIsoDate(parts),
    dateStatus,
    dateSource: source,
    dateConfidence: confidence,
    datePriority,
    ageDays: Math.abs(diffDays),
    isToday: dateStatus === 'today',
    isFuture: dateStatus === 'future',
  };
}

export function getTurkeyDateParts(date = new Date()) {
  return getDatePartsInTimeZone(date, TURKEY_TIME_ZONE);
}

export function getTurkeyDate() {
  return buildDateOnly(getTurkeyDateParts());
}

export function getTurkeyDisplayDate(date = new Date()) {
  return formatDisplayDate(getTurkeyDateParts(date));
}

export function getTurkeyIsoDate(date = new Date()) {
  return formatIsoDate(getTurkeyDateParts(date));
}

export function normalizeSourceDate(rawDate, options = {}) {
  const { source = 'unknown', confidence = 'medium' } = options;

  if (!rawDate) {
    return createUnknownDateAssessment('', source, 'low');
  }

  if (rawDate instanceof Date) {
    return createDateAssessment(getTurkeyDateParts(rawDate), rawDate.toISOString(), source, confidence);
  }

  const text = String(rawDate).trim();
  if (!text) {
    return createUnknownDateAssessment('', source, 'low');
  }

  const parts =
    parseDisplayDateParts(text) ||
    parseIsoDateParts(text) ||
    parseRelativeDateParts(text) ||
    parseTurkishAbsoluteDateParts(text) ||
    parseNativeDateParts(text);

  return parts
    ? createDateAssessment(parts, text, source, confidence)
    : createUnknownDateAssessment(text, source, 'low');
}

export function isFromToday(dateInput) {
  return normalizeSourceDate(dateInput, { source: 'today-check', confidence: 'low' }).isToday;
}

export function isRecent(dateInput, windowDays = 3) {
  const assessment = normalizeSourceDate(dateInput, { source: 'recent-check', confidence: 'low' });
  return assessment.isToday || (
    assessment.dateStatus === 'stale' &&
    typeof assessment.ageDays === 'number' &&
    assessment.ageDays <= windowDays
  );
}

export function getDatePriority(dateInput) {
  const assessment = dateInput?.dateStatus
    ? dateInput
    : normalizeSourceDate(dateInput, { source: 'priority', confidence: 'low' });

  return assessment.datePriority ?? 0;
}

/**
 * Parse Turkish or metadata date formats to DD/MM/YYYY.
 * Returns null when the date is unknown or invalid.
 */
export function parseTurkishDate(dateStr) {
  return normalizeSourceDate(dateStr, { source: 'parse', confidence: 'low' }).normalizedDate;
}
