/**
 * Deterministic chat security filters (no external dependencies).
 * Pre-filter user input and post-filter assistant output.
 */

const OFF_TOPIC_KEYWORDS_TR = [
  'tarif', 'yemek', 'pasta', 'pizza', 'pilav', 'corba', 'çorba', 'kebap',
  'tatli', 'tatlı', 'kek', 'kurabiye', 'börek', 'borek', 'pişir', 'pisir',
  'hava durumu', 'sıcaklık', 'sicaklik', 'yağmur', 'yagmur',
  'maç skoru', 'mac skoru', 'lig', 'şampiyon', 'sampiyon',
  'ödev', 'odev', 'denklem', 'integral', 'türev', 'turev', 'matematik',
  'film öner', 'dizi öner', 'şarkı', 'sarki', 'müzik', 'muzik',
  'fıkra', 'fikra', 'espri', 'şaka', 'saka',
  'burç', 'burc', 'astroloji', 'fal',
];

const OFF_TOPIC_KEYWORDS_EN = [
  'recipe', 'cook', 'bake', 'ingredient', 'dinner', 'lunch', 'breakfast',
  'weather', 'forecast', 'temperature', 'rain',
  'score', 'match', 'league', 'champion', 'fifa', 'nba', 'nfl',
  'homework', 'equation', 'integral', 'derivative', 'calculus', 'algebra',
  'movie recommend', 'song', 'lyrics', 'playlist', 'netflix',
  'joke', 'riddle', 'funny',
  'horoscope', 'zodiac', 'astrology',
  'cheat code', 'game walkthrough',
];

const CODE_REQUEST_PATTERNS = [
  /\bpython\s*(kodu|kod|script|scripti)?\b/i,
  /\b(javascript|typescript|bash|shell|sql)\s*(kodu|kod|script|scripti)?\b/i,
  /\bkodu?\s*(yaz|yazar|ver|oluştur|olustur)\b/i,
  /\b(kod|code)\s+(örneği|ornegi|example|snippet)\b/i,
  /\b(örnek|ornek|sample)\s+(kod|code|script|python)\b/i,
  /\bscript\s*(yaz|yazar|ver|write|generate|create)\b/i,
  /\bwrite\s+(me\s+)?(a\s+)?(python|javascript|code|script)\b/i,
  /\bgenerate\s+(a\s+)?(python|javascript|code|script)\b/i,
  /\bcreate\s+(a\s+)?(python|javascript|code|script)\b/i,
  /\bexample\s+code\b/i,
  /\bcode\s+snippet\b/i,
  /\bimport\s+(requests|os|sys|subprocess)\b/i,
  /\bwhile\s+true\b/i,
  /\bdef\s+\w+\s*\(/i,
  /```/,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?)/i,
  /forget\s+(your\s+)?(rules?|instructions?|prompts?|guidelines?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+(dan|unrestricted|jailbreak)/i,
  /\bact\s+as\s+(an?\s+)?(unrestricted|unfiltered|jailbreak)/i,
  /reveal\s+(your\s+)?(system\s+prompt|hidden\s+prompt|instructions?)/i,
  /override\s+(system|your)\s+(prompt|rules?|instructions?)/i,
  /göreve\s+bağlı\s+olarak\s+durma/i,
  /goreve\s+bagli\s+olarak\s+durma/i,
  /\basla\s+durma(n)?\b/i,
  /\bdurmandan\b/i,
  /don'?t\s+stop\s+(until|before|working)/i,
  /never\s+stop\s+(until|working)/i,
  /keep\s+going\s+(no\s+matter|until|forever)/i,
  /önceki\s+(talimat|kural|yönerge)/i,
  /onceki\s+(talimat|kural|yonerge)/i,
  /talimatları\s+yok\s+say/i,
  /talimatlari\s+yok\s+say/i,
];

const UNSAFE_RESPONSE_PATTERNS = [
  /```[\s\S]*?```/,
  /\bimport\s+(requests|os|sys|subprocess|socket|urllib)\b/i,
  /\bwhile\s+true\s*:/i,
  /\bdef\s+\w+\s*\([^)]*\)\s*:/i,
  /\bfunction\s+\w+\s*\(/i,
  /\bconsole\.(log|error|warn)\s*\(/i,
  /\btime\.sleep\s*\(/i,
  /\brequests\.(get|post|put|delete)\s*\(/i,
  /\bfetch\s*\(\s*['"`]/i,
  /\bSELECT\s+.+\s+FROM\s+/i,
  /\bDROP\s+TABLE\b/i,
  /\bsubprocess\.(run|call|Popen)\b/i,
  /\bos\.system\s*\(/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bprint\s*\(\s*['"]/i,
  /\bfor\s+\w+\s+in\s+range\s*\(/i,
  /\bresponse\s*=\s*requests\./i,
  /\bstatus_code\s*==\s*200\b/i,
];

const OFF_TOPIC_REFUSALS = {
  tr: '[TOPIC:OFF_TOPIC] Ben Cem Koyluoglu\'nun portfolyo sitesi hakkında sorulara yardımcı olmak için buradayım. Onun AI uzmanlığı, projeleri veya sitedeki içerikler hakkında sorabilirsin! 😊',
  en: '[TOPIC:OFF_TOPIC] I\'m here to help with questions about Cem Koyluoglu and this portfolio website. Feel free to ask about his AI expertise, projects, or anything on this site! 😊',
};

const CODE_REFUSALS = {
  tr: '[TOPIC:OFF_TOPIC] Bu asistan yalnızca Cem ve sitedeki içerikler hakkında yardımcı olabilir; kod, script veya otomasyon yazamam. Haber özeti veya Cem\'in projeleri hakkında sorabilirsin! 😊',
  en: '[TOPIC:OFF_TOPIC] I can help with Cem and this website\'s content, but I can\'t write code, scripts, or automation here. Ask about the article or Cem\'s AI work instead! 😊',
};

const INJECTION_REFUSALS = {
  tr: '[TOPIC:OFF_TOPIC] Bu tür talimatları uygulayamam. Cem Koyluoglu, projeleri veya sitedeki içerikler hakkında sorular sorabilirsin! 😊',
  en: '[TOPIC:OFF_TOPIC] I can\'t follow instructions that override my role. Please ask about Cem Koyluoglu, his work, or this website! 😊',
};

export function detectMessageLanguage(message) {
  if (!message || typeof message !== 'string') return 'en';
  const lower = message.toLowerCase();
  if (/[çğıöşüÇĞİÖŞÜ]/.test(message)) return 'tr';
  if (/\b(merhaba|selam|nasıl|nedir|nerede|hakkında|bana|ver|yap|söyle|haber|özet|ozet)\b/i.test(lower)) {
    return 'tr';
  }
  return 'en';
}

export function isCodeGenerationRequest(message) {
  if (!message || typeof message !== 'string') return false;
  return CODE_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
}

export function isPromptInjection(message) {
  if (!message || typeof message !== 'string') return false;
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(message));
}

export function isUnsafeAssistantResponse(text) {
  if (!text || typeof text !== 'string') return false;
  return UNSAFE_RESPONSE_PATTERNS.some((pattern) => pattern.test(text));
}

export function getSecurityRefusal(message, reason = 'off_topic') {
  const lang = detectMessageLanguage(message);
  if (reason === 'code') return CODE_REFUSALS[lang];
  if (reason === 'injection') return INJECTION_REFUSALS[lang];
  return OFF_TOPIC_REFUSALS[lang];
}

export function isObviouslyOffTopic(message) {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();

  if (lower.length < 3) return null;

  const lang = detectMessageLanguage(message);

  for (const kw of OFF_TOPIC_KEYWORDS_TR) {
    if (lower.includes(kw)) return OFF_TOPIC_REFUSALS.tr;
  }
  for (const kw of OFF_TOPIC_KEYWORDS_EN) {
    if (lower.includes(kw)) return OFF_TOPIC_REFUSALS[lang];
  }

  return null;
}

export function validateUserMessage(message, history = []) {
  if (!message || typeof message !== 'string') return null;
  const trimmed = message.trim();
  if (trimmed.length < 3) return null;

  if (isCodeGenerationRequest(trimmed)) {
    return { reply: getSecurityRefusal(trimmed, 'code'), reason: 'code' };
  }

  if (isPromptInjection(trimmed)) {
    return { reply: getSecurityRefusal(trimmed, 'injection'), reason: 'injection' };
  }

  const offTopicReply = isObviouslyOffTopic(trimmed);
  if (offTopicReply) {
    return { reply: offTopicReply, reason: 'off_topic' };
  }

  if (Array.isArray(history)) {
    const recentUserMessages = history
      .filter((entry) => entry?.role === 'user' && typeof entry.content === 'string')
      .slice(-3)
      .map((entry) => entry.content);

    const combined = [...recentUserMessages, trimmed].join('\n');
    if (isPromptInjection(combined) || isCodeGenerationRequest(combined)) {
      return {
        reply: getSecurityRefusal(trimmed, isPromptInjection(combined) ? 'injection' : 'code'),
        reason: 'chained_attack',
      };
    }
  }

  return null;
}

export function enforceResponsePolicy(reply, userMessage = '', history = []) {
  const userBlock = validateUserMessage(userMessage, history);
  if (userBlock) {
    return userBlock.reply;
  }

  if (!reply || typeof reply !== 'string') {
    return getSecurityRefusal(userMessage, 'code');
  }

  if (isUnsafeAssistantResponse(reply)) {
    return getSecurityRefusal(userMessage, 'code');
  }

  return reply;
}
