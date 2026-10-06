/**
 * Decides whether translated text is still Turkish.
 *
 * A single Turkish letter is not evidence of a failed translation: proper nouns
 * such as "Şanlıurfa", "Selçuk Bayraktar" or "TEKNOFEST Güneydoğu" correctly
 * survive into the English output. Rejecting on any [ğüşıöç] made every model
 * fail on such articles, forever. Instead we look for words that only appear
 * when Turkish prose is left untranslated: Turkish function words, and
 * lowercase (i.e. non-proper-noun) words that carry Turkish letters.
 */

const TURKISH_CHAR = /[ğüşıöçĞÜŞİÖÇ]/;

// Function words that never occur in English prose.
const TURKISH_STOPWORDS = new Set([
  've', 'bir', 'bu', 'için', 'ile', 'çok', 'daha', 'olarak', 'gibi', 'değil',
  'kadar', 'sonra', 'şimdi', 'olan', 'oldu', 'ise', 'veya', 'ancak', 'artık',
  'yeni', 'tüm', 'göre', 'ilk', 'büyük', 'şu', 'ki',
]);

function isLowercaseWord(word) {
  const first = word[0];
  return first !== first.toLocaleUpperCase('tr');
}

/**
 * @param {string} text
 * @returns {{ untranslated: boolean, hits: string[] }}
 */
export function detectTurkishResidue(text) {
  const value = String(text || '');
  if (!TURKISH_CHAR.test(value)) return { untranslated: false, hits: [] };

  const words = value.match(/[\p{L}]+/gu) || [];
  const hits = words.filter((word) =>
    TURKISH_STOPWORDS.has(word.toLocaleLowerCase('tr')) ||
    (TURKISH_CHAR.test(word) && isLowercaseWord(word)),
  );

  // Headlines and descriptions: one Turkish word is already a leak. Long bodies
  // may quote a short Turkish phrase, so allow ~1% before calling it untranslated.
  const threshold = words.length < 40 ? 1 : Math.max(2, Math.ceil(words.length * 0.01));
  return { untranslated: hits.length >= threshold, hits };
}

export function isStillTurkish(text) {
  return detectTurkishResidue(text).untranslated;
}
