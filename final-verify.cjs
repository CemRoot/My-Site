
const tests = [
  { input: "YZ'nin önemi", expected: "AI's önemi" },
  { input: "YZ’nin gücü", expected: "AI's gücü" },
  { input: "YZ'ye göre", expected: "AI göre" },
  { input: "YZ'den gelen", expected: "AI gelen" },
  { input: "YZ teknolojisi", expected: "AI teknolojisi" },
  { input: "yapay zeka çalışmaları", expected: "AI çalışmaları" },
  { input: "yapay zekanın gücü", expected: "AI's gücü" },
  { input: "yapay zekaya olan güven", expected: "AI olan güven" },
  { input: "yapay zekayı anlamak", expected: "AI anlamak" },
  { input: "yapay zekada devrim", expected: "AI devrim" },
  { input: "yapay zekadan kaçış", expected: "AI kaçış" }
];

function cleanTranslation(cleaned) {
  // BUG 1 FIX: Replace "YZ" with "AI" (since LLMs sometimes leave the Turkish acronym)
  // Handle possessive forms first, then other suffixes, then base form
  cleaned = cleaned.replace(/\bYZ['’]nin\b/g, "AI's");
  cleaned = cleaned.replace(/\bYZ['’](?:ye|yi|ya|yu|da|de|dan|den|in|un|ün|le|li|lere|lerin)\b/g, 'AI');
  cleaned = cleaned.replace(/\bYZ\b/g, 'AI');

  // Also handle full Turkish term 'yapay zeka' and its suffixes
  cleaned = cleaned.replace(/\byapay zeka(?:n[\u0131i]n)\b/gi, "AI's");
  cleaned = cleaned.replace(/\byapay zeka(?:y[\u0131i]|y[ae]|d[ae]n?)\b/gi, 'AI');
  cleaned = cleaned.replace(/\byapay zeka\b/gi, 'AI');

  return cleaned;
}

let failed = false;
tests.forEach(t => {
  const result = cleanTranslation(t.input);
  if (result !== t.expected) {
    console.error(`❌ FAIL: "${t.input}"\n   Expected: "${t.expected}"\n   Actual:   "${result}"`);
    failed = true;
  } else {
    console.log(`✅ PASS: "${t.input}" => "${result}"`);
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log("\n✨ All tests passed!");
}
