/**
 * Groq Translation A/B Test
 * Compare translation quality and speed across models on the same Turkish inputs
 */

import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 70B' },
  { id: 'groq/compound', label: 'Compound' }
];

const SYSTEM_PROMPT = `You are a professional translator specializing in Turkish to English translation for technology news.

TRANSLATION RULES:
- Translate from Turkish to English with high accuracy
- Maintain the original meaning and tone
- Use clear, professional English suitable for tech news
- Keep technical terms and brand names intact (Netflix, AI, OpenAI, etc.)
- Preserve formatting (line breaks, emphasis)
- Use natural, readable English (B2-C1 level)
- DO NOT add any commentary or explanations
- ONLY return the translated text, nothing else`;

// Two realistic samples from Nuvem-style content
const SAMPLES = [
  {
    name: 'Short Title',
    text: "Samsung’un Küçük Yapay Zeka Modeli, Gemini 2.5 Pro Gibi Büyük Dil Modellerini Akıl Yürütme Testlerinde Geride Bıraktı"
  },
  {
    name: 'Paragraph',
    text: `Google, işletmelere yönelik Gemini Enterprise yapay zeka platformunu tanıttı. Yeni çözüm; doküman hazırlama, e-posta yazma, veri analizi ve toplantı özetleme gibi iş süreçlerinde üretkenliği artırmayı hedefliyor. Şirket, güvenlik ve veri gizliliği konularında kurumsal seviyede garantiler sunduğunu belirtiyor.`
  }
];

async function translate(model, text) {
  const start = Date.now();
  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text }
    ]
  });
  const end = Date.now();
  const translated = completion.choices?.[0]?.message?.content ?? '';
  return {
    text: translated.trim(),
    ms: end - start,
    usage: completion.usage || {}
  };
}

async function run() {
  console.log('🚀 Groq Translation A/B Test');
  console.log('='.repeat(72));

  for (const sample of SAMPLES) {
    console.log(`\n📋 Sample: ${sample.name}`);
    console.log('-'.repeat(72));
    console.log(`TR: ${sample.text}\n`);

    for (const m of MODELS) {
      try {
        const res = await translate(m.id, sample.text);
        console.log(`🔎 Model: ${m.label} (${m.id})`);
        console.log(`⏱️  ${res.ms} ms | tokens: ${res.usage.total_tokens ?? 'n/a'}`);
        console.log(`EN: ${res.text}\n`);
      } catch (err) {
        console.log(`❌ ${m.label} error:`, err?.message || err);
      }
    }
  }

  console.log('='.repeat(72));
  console.log('✅ Done');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
