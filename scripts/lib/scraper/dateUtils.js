/**
 * Date parsing and timezone utilities for the news scraper.
 * Handles Turkish date formats and Europe/Istanbul timezone.
 */

const TURKISH_MONTHS = {
  'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4,
  'mayıs': 5, 'haziran': 6, 'temmuz': 7, 'ağustos': 8,
  'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12,
};

export function getTurkeyDate() {
  const now = new Date();
  const turkeyDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
  const [year, month, day] = turkeyDateStr.split('-').map(n => parseInt(n, 10));
  return new Date(year, month - 1, day);
}

export function isFromToday(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    articleDate.setHours(0, 0, 0, 0);

    const today = getTurkeyDate();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return articleDate >= yesterday && articleDate <= today;
  } catch {
    return true;
  }
}

export function isRecent(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    articleDate.setHours(0, 0, 0, 0);

    const today = getTurkeyDate();
    today.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return articleDate >= threeDaysAgo;
  } catch {
    return true;
  }
}

export function getDatePriority(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    articleDate.setHours(0, 0, 0, 0);

    const today = getTurkeyDate();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - articleDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, 100 - (diffDays * 10));
  } catch {
    return 0;
  }
}

/**
 * Parse Turkish date formats to DD/MM/YYYY.
 * Handles absolute ("16 Aralık 2025") and relative ("3 gün önce") formats.
 */
export function parseTurkishDate(dateStr) {
  if (!dateStr) return null;

  const str = dateStr.trim().toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();

  const validateNotFuture = (day, month, year) => {
    if (year < 2020 || year > currentYear) return false;
    const parsed = new Date(year, month - 1, day);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return parsed <= tomorrow;
  };

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/').map(Number);
    return validateNotFuture(day, month, year) ? str : null;
  }

  if (str === 'bugün' || str.includes('bugün')) {
    return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  }

  if (str === 'dün' || str.includes('dün')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  const relativePatterns = [
    { regex: /(\d+)\s*dakika\s*önce/i, unit: 'minutes' },
    { regex: /(\d+)\s*saat\s*önce/i, unit: 'hours' },
    { regex: /(\d+)\s*gün\s*önce/i, unit: 'days' },
    { regex: /(\d+)\s*hafta\s*önce/i, unit: 'weeks' },
    { regex: /(\d+)\s*ay\s*önce/i, unit: 'months' },
  ];

  for (const { regex, unit } of relativePatterns) {
    const match = str.match(regex);
    if (match) {
      const val = parseInt(match[1], 10);
      const d = new Date(now);
      switch (unit) {
        case 'minutes': d.setMinutes(d.getMinutes() - val); break;
        case 'hours': d.setHours(d.getHours() - val); break;
        case 'days': d.setDate(d.getDate() - val); break;
        case 'weeks': d.setDate(d.getDate() - val * 7); break;
        case 'months': d.setMonth(d.getMonth() - val); break;
      }
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
  }

  const absoluteMatch = dateStr.trim().match(/(\d{1,2})\s+([a-zA-ZğüşıöçĞÜŞİÖÇ]+)\s+(\d{4})/i);
  if (absoluteMatch) {
    const day = parseInt(absoluteMatch[1], 10);
    const monthName = absoluteMatch[2].toLowerCase();
    const year = parseInt(absoluteMatch[3], 10);
    const month = TURKISH_MONTHS[monthName];
    if (month && validateNotFuture(day, month, year)) {
      return `${day}/${month}/${year}`;
    }
  }

  return null;
}
