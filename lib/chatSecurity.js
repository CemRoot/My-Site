/**
 * Deterministic chat security filters (no external dependencies).
 *
 * Design (inspired by NeMo Guardrails topic control + soft refusal UX):
 * - Hard-block only pure off-topic, pure code-gen, or injection.
 * - Mixed intents (ask about Cem + also ask for code) pass to the LLM so the
 *   on-topic part can be answered with a soft decline of the code part.
 * - Do NOT poison follow-ups by scanning history for old code requests.
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

/** Require generation intent — bare "python" (skills talk) must NOT match */
const CODE_REQUEST_PATTERNS = [
  /\b(write|generate|create|give|show|provide)\s+(me\s+)?(a\s+|some\s+|basic\s+)?(python|javascript|typescript|bash|shell|sql)?\s*(code|script|snippet|program)\b/i,
  /\b(python|javascript|typescript|bash|shell|sql)\s+(code|script|snippet|program|örneği|ornegi|kodu|kod)\b/i,
  /\b(kodu?|code)\s*(yaz|yazar|ver|oluştur|olustur|örneği|ornegi)\b/i,
  /\b(örnek|ornek|sample|basic)\s+(kod|code|script|python)\b/i,
  /\bscript\s*(yaz|yazar|ver|write|generate|create)\b/i,
  /\b(kod|code)\s+(örneği|ornegi|example|snippet)\b/i,
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

/** Strong signals that the user is asking about Cem / this site (not just a city name). */
const ON_TOPIC_SIGNAL_RE =
  /\b(cem|koyluoglu|köylüoğlu|portfolio|this\s+(site|website|page)|your\s+(site|website|creator)|about\s+(him|you|cem)|who\s+is\s+(he|cem|that)|his\s+(work|skills|experience|background|projects|education)|contact|whatsapp|linkedin|github|ai\s+engineer|tech\s+news|article|haber|özet|ozet|proje|deneyim|yetenek|hakkında|hakkinda|kim(dir)?|sen\s+kimsin|bu\s+site)\b/i;

/** Weak location words — alone must NOT override weather/recipe off-topic. */
const WEAK_LOCATION_RE = /\b(dublin|ireland|irlanda)\b/i;

const DB_OR_SECRET_PROBE_PATTERNS = [
  /\b(dump|exfiltrat|leak|steal)\b.{0,40}\b(database|db|supabase|postgres|table|chat_history|system_settings)\b/i,
  /\b(supabase|postgres|database|db)\b.{0,40}\b(dump|exfiltrat|credentials?|password|secret|service[_ -]?role)\b/i,
  /\b(service[_ -]?role|anon[_ -]?key|api[_ -]?key|connection\s+string)\b/i,
  /\bSELECT\s+.+\s+FROM\s+(chat_history|system_settings|users?)\b/i,
  /\b(veritabanı|veritabani).{0,40}\b(dök|dok|göster|goster|dump|api\s*key)\b/i,
  /\b(chat_history|system_settings)\b.{0,30}\b(göster|goster|dump|select|listele)\b/i,
];

const CONTINUATION_RE =
  /^(?:(?:ye|yes|yeah|yep|ok|okay|please|pls|lütfen|lutfen)\s+)?(?:go\s+on|continue|more|tell\s+me\s+more|explain(?:\s+(?:that|more|him|it|cem))?|who\s+is\s+(?:he|that)|what\s+about\s+(?:him|cem)|devam|anlat(?:ır\s+mısın|ir\s+misin)?|kim\s+o|daha\s+fazla)[\s.!?]*$/i;

const OFF_TOPIC_REFUSALS = {
  tr: '[TOPIC:OFF_TOPIC] Ben Cem Koyluoglu\'nun portfolyo sitesi hakkında sorulara yardımcı olmak için buradayım. Onun AI uzmanlığı, projeleri veya sitedeki içerikler hakkında sorabilirsin! 😊',
  en: '[TOPIC:OFF_TOPIC] I\'m here to help with questions about Cem Koyluoglu and this portfolio website. Feel free to ask about his AI expertise, projects, or anything on this site! 😊',
};

const CODE_REFUSALS = {
  tr: '[TOPIC:OFF_TOPIC] Bu asistan kod veya script yazmaz; Cem\'in geçmişi, projeleri veya sitedeki içerikler hakkında sorabilirsin! 😊',
  en: '[TOPIC:OFF_TOPIC] This assistant doesn\'t write code or scripts — ask about Cem\'s background, projects, or anything on this site! 😊',
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

export function isDatabaseOrSecretProbe(message) {
  if (!message || typeof message !== 'string') return false;
  return DB_OR_SECRET_PROBE_PATTERNS.some((pattern) => pattern.test(message));
}

/** Cyrillic / Arabic / CJK / Hangul — reply must stay EN (or TR if user used TR Latin). */
export function isUnsupportedScriptLanguage(message) {
  if (!message || typeof message !== 'string') return false;
  const nonLatin = (message.match(/[\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g) || []).length;
  const latin = (message.match(/[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÖöÜü]/g) || []).length;
  return nonLatin >= 8 && nonLatin > latin;
}

/** Non-EN/TR requests (including DE/FR/ES Latin) that must be answered in English. */
export function needsEnglishOnlyReply(message) {
  if (!message || typeof message !== 'string') return false;
  if (isUnsupportedScriptLanguage(message)) return true;
  if (/[çğıöşüÇĞİÖŞÜ]/.test(message) && /\b(merhaba|selam|kimdir|anlat|hakkında|hakkinda|nedir|lütfen|lutfen|kim|proje)\b/i.test(message)) {
    return false;
  }
  if (/\b(merhaba|selam|kimdir|anlat|hakkında|hakkinda|nedir|lütfen|lutfen)\b/i.test(message)) return false;
  // Avoid \\b after non-ASCII letters (JS \\w is ASCII-only) — it breaks "français"/"español"
  return /(wer\s+ist|erzähl|erzaehl|auf\s+deutsch|parle[-\s]?moi|en\s+fran[cç]ais|qui\s+est|qui[eé]n|en\s+espa[nñ]ol|raccontami|in\s+italiano|fale[-\s]?me|em\s+portugu[eê]s|на\s+русском|بالعربي)/i.test(message);
}

export function isUnsafeAssistantResponse(text) {
  if (!text || typeof text !== 'string') return false;
  return UNSAFE_RESPONSE_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasOnTopicSignal(message) {
  if (!message || typeof message !== 'string') return false;
  return ON_TOPIC_SIGNAL_RE.test(message);
}

export function isConversationalContinuation(message) {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  return CONTINUATION_RE.test(trimmed);
}

/**
 * Classify intent for routing (pre-filter).
 * @returns {'allow'|'code'|'injection'|'off_topic'|'mixed'}
 */
export function classifyUserIntent(message) {
  if (!message || typeof message !== 'string') return 'allow';
  const trimmed = message.trim();
  if (trimmed.length < 2) return 'allow';

  if (isPromptInjection(trimmed)) return 'injection';
  if (isDatabaseOrSecretProbe(trimmed)) return 'injection';

  const wantsCode = isCodeGenerationRequest(trimmed);
  const onTopic = hasOnTopicSignal(trimmed);
  const continuation = isConversationalContinuation(trimmed);

  if (wantsCode && onTopic) return 'mixed';
  if (wantsCode && !onTopic && !continuation) return 'code';

  if (continuation) return 'allow';

  const lower = trimmed.toLowerCase();
  let hitOffTopic = false;
  for (const kw of OFF_TOPIC_KEYWORDS_TR) {
    if (lower.includes(kw)) {
      hitOffTopic = true;
      break;
    }
  }
  if (!hitOffTopic) {
    for (const kw of OFF_TOPIC_KEYWORDS_EN) {
      if (lower.includes(kw)) {
        hitOffTopic = true;
        break;
      }
    }
  }

  // Off-topic keywords win unless there is a STRONG Cem/site signal.
  // Weak location words (Dublin/Ireland) alone must not unlock weather/recipes.
  if (hitOffTopic && !onTopic) return 'off_topic';
  if (hitOffTopic && onTopic && WEAK_LOCATION_RE.test(trimmed) && !/\b(cem|koyluoglu|portfolio|project|proje)\b/i.test(trimmed)) {
    // e.g. "weather in Dublin" — still off-topic
    const strong = /\b(cem|koyluoglu|köylüoğlu|portfolio|tech\s+news|who\s+is|kimdir|proje|deneyim)\b/i.test(trimmed);
    if (!strong) return 'off_topic';
  }

  return 'allow';
}

export function getSecurityRefusal(message, reason = 'off_topic') {
  const lang = detectMessageLanguage(message);
  if (reason === 'code') return CODE_REFUSALS[lang];
  if (reason === 'injection') return INJECTION_REFUSALS[lang];
  return OFF_TOPIC_REFUSALS[lang];
}

export function isObviouslyOffTopic(message) {
  if (!message || typeof message !== 'string') return null;
  const intent = classifyUserIntent(message);
  if (intent === 'off_topic') {
    return OFF_TOPIC_REFUSALS[detectMessageLanguage(message)];
  }
  return null;
}

/**
 * Pre-filter. Returns a refusal payload or null to continue to the LLM.
 * History is only used for injection spanning turns — never to re-block
 * follow-ups because an earlier message asked for code.
 */
export function validateUserMessage(message, history = []) {
  if (!message || typeof message !== 'string') return null;
  const trimmed = message.trim();
  if (trimmed.length < 2) return null;

  const intent = classifyUserIntent(trimmed);

  if (intent === 'injection') {
    return { reply: getSecurityRefusal(trimmed, 'injection'), reason: 'injection' };
  }

  // Mixed: Cem question + code ask → let LLM answer Cem, soft-decline code
  if (intent === 'mixed') {
    return null;
  }

  if (intent === 'code') {
    return { reply: getSecurityRefusal(trimmed, 'code'), reason: 'code' };
  }

  if (intent === 'off_topic') {
    return { reply: getSecurityRefusal(trimmed, 'off_topic'), reason: 'off_topic' };
  }

  // Injection phrases sometimes appear across consecutive user turns
  if (Array.isArray(history) && history.length > 0) {
    const recentUserMessages = history
      .filter((entry) => entry?.role === 'user' && typeof entry.content === 'string')
      .slice(-2)
      .map((entry) => entry.content);
    const combined = [...recentUserMessages, trimmed].join('\n');
    if (isPromptInjection(combined) && !hasOnTopicSignal(trimmed) && !isConversationalContinuation(trimmed)) {
      return { reply: getSecurityRefusal(trimmed, 'injection'), reason: 'chained_injection' };
    }
  }

  return null;
}

function stripUnsupportedScripts(reply) {
  if (!reply || typeof reply !== 'string') return reply;
  const hasHeavyScript = /[\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]{12,}/.test(reply);
  if (!hasHeavyScript) return reply;
  return '[TOPIC:CEM] I can help in English or Turkish only. Cem Koyluoglu is an AI Engineer and System Operations Specialist based in Dublin — ask about his projects, experience, or how to contact him in English or Turkish.';
}

const ENGLISH_ONLY_FALLBACK =
  '[TOPIC:CEM] I can help in English or Turkish only. Cem Koyluoglu is an AI Engineer and System Operations Specialist based in Dublin with a First Class MSc in AI — ask about his projects, experience, or how to contact him in English or Turkish.';

function looksLikeForeignLatinReply(reply) {
  return /\b(Entschuldigung|Désolé|Desole|Je (ne )?peux|Ich kann nur|auf Deutsch|en français|en francais|Cem Koyluoglu ist ein|Cem Koyluoglu est un|basierend|ansässig|ansassig|ingénieur|ingenieur)\b/i.test(reply);
}

export function enforceResponsePolicy(reply, userMessage = '', history = []) {
  const intent = classifyUserIntent(userMessage);

  // Pure code / injection still get a hard refusal even if the model answered
  if (intent === 'code' || intent === 'injection') {
    return getSecurityRefusal(userMessage, intent === 'injection' ? 'injection' : 'code');
  }

  if (intent === 'off_topic') {
    return getSecurityRefusal(userMessage, 'off_topic');
  }

  if (!reply || typeof reply !== 'string') {
    return getSecurityRefusal(userMessage, 'off_topic');
  }

  // Strip executable code from otherwise good replies (esp. mixed intents)
  if (isUnsafeAssistantResponse(reply)) {
    const lang = detectMessageLanguage(userMessage);
    if (intent === 'mixed' || hasOnTopicSignal(userMessage)) {
      const soft =
        lang === 'tr'
          ? '[TOPIC:CEM] Cem hakkında yardımcı olabilirim, ama burada çalıştırılabilir kod veya script paylaşamam. Projeleri, deneyimi veya sitedeki içerikler hakkında sorabilirsin! 😊'
          : '[TOPIC:CEM] Happy to talk about Cem — but I can\'t share executable code or scripts here. Ask about his projects, experience, or anything on this site! 😊';
      return soft;
    }
    return getSecurityRefusal(userMessage, 'code');
  }

  if (needsEnglishOnlyReply(userMessage)) {
    if (/[\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]{8,}/.test(reply)) {
      return ENGLISH_ONLY_FALLBACK;
    }
    if (looksLikeForeignLatinReply(reply)) {
      return ENGLISH_ONLY_FALLBACK;
    }
  }

  if (isUnsupportedScriptLanguage(userMessage) || /[\u0400-\u04FF\u0600-\u06FF]{12,}/.test(reply)) {
    return stripUnsupportedScripts(reply);
  }

  return reply;
}
