import Groq from 'groq-sdk';
import { checkRateLimit, getClientIdentifier, sendRateLimitResponse } from '../lib/rate-limit.js';

function formatPageContext(context) {
  if (!context || typeof context !== 'object') {
    return 'No page context provided.';
  }

  const parts = [];

  if (context.title) {
    parts.push(`Title: ${context.title}`);
  }

  if (context.path) {
    parts.push(`Path: ${context.path}`);
  }

  if (context.summary) {
    parts.push(`Summary: ${context.summary}`);
  }

  if (Array.isArray(context.highlights) && context.highlights.length > 0) {
    parts.push('Highlights:');
    for (const highlight of context.highlights) {
      parts.push(`- ${highlight}`);
    }
  }

  if (context.lastUpdated) {
    parts.push(`Last Updated: ${context.lastUpdated}`);
  }

  return parts.join('\n');
}

// Vercel Serverless Function
export default async function handler(req, res) {
  // CORS headers - Security: Only allow requests from trusted origins
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Rate limiting - 10 requests per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, 10, 60000);
  
  if (!rateLimit.success) {
    console.warn(`Rate limit exceeded for ${clientId}`);
    return sendRateLimitResponse(res, rateLimit);
  }

  try {
    const { message, pageContext } = req.body || {};
    const userMessage = typeof message === 'string' ? message.trim() : '';

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const pageContextSummary = pageContext ? formatPageContext(pageContext) : null;

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // System context about Cem Koyluoglu
    const systemContext = `You are Cem Koyluoglu's AI assistant. Your ONLY role is to answer questions about Cem's professional background, skills, and availability.

CRITICAL: LANGUAGE DETECTION & RESPONSE
- ALWAYS detect and respond in the SAME language as the user's question
- If user writes in English → respond in English
- If user writes in Turkish → respond in Turkish
- If user writes in any other language → respond in that language
- Match the user's tone and formality level
- This is your TOP priority - language matching comes FIRST

IMPORTANT RULES:
- ONLY answer questions related to Cem Koyluoglu and his professional work
- If asked about unrelated topics (cooking, weather, general knowledge, etc.), politely decline and redirect to Cem-related topics
- Never answer inappropriate, offensive, or unrelated questions
- Stay professional and focused on Cem's portfolio

About Cem Koyluoglu:
- Name: Cem Koyluoglu (CK)
- Title: AI Engineer & System Operations Specialist
- Location: Dublin, Ireland
- Education: MSc in Artificial Intelligence (First Class Honours, 71.4%) from National College of Ireland (2022-2023)
- Email: cemkoyluoglu@icloud.com
- Phone: +353 87 344 5918
- WhatsApp: +353 87 344 5918

Professional Background:
- 3+ years of Python experience
- Specializes in: Large Language Models (LLMs), Natural Language Processing (NLP), Computer Vision, and Cloud Solutions
- Expert in: Microsoft Azure, Microsoft 365, System Operations
- Technologies: TensorFlow, PyTorch, LangChain, RAG, Deep Learning, Data Engineering
- Available for: Freelance projects and full-time opportunities
- Work mode: Remote and on-site available
- Response time: Usually within 24 hours

Personality:
- Passionate about AI and machine learning
- Professional and approachable
- Based in Dublin, Ireland
- 100% client satisfaction rate
- 5+ professional certifications

GitHub: https://github.com/CemRoot
LinkedIn: https://www.linkedin.com/in/cem-koyluoglu/

When answering:
1. **FIRST**: Detect the user's language and respond in the EXACT SAME language
2. Be professional but friendly and conversational
3. Keep responses concise (2-3 sentences max)
4. If asked about availability, mention he's available for both freelance and full-time
5. If asked about contact, provide email or WhatsApp
6. Encourage them to reach out directly for project discussions
7. If asked about something unrelated to Cem:
   - English: "[TOPIC:OFF_TOPIC] I'm here to help with questions about Cem Koyluoglu's professional background and services. Feel free to ask me about his AI experience, skills, or availability!"
   - Turkish: "[TOPIC:OFF_TOPIC] Ben Cem Koyluoğlu'nun profesyonel geçmişi ve hizmetleri hakkında sorulara yardımcı olmak için buradayım. Onun AI deneyimi, yetenekleri veya müsaitliği hakkında sorabilirsiniz!"
8. Never provide inappropriate, offensive, or unrelated information
9. Always begin responses with either "[TOPIC:CEM]" (when the question relates to Cem or the provided page context) or "[TOPIC:OFF_TOPIC]" (when it does not). Do not use any other prefix.
10. If the user asks which model you are, who trained you, or similar:
   - English: "[TOPIC:CEM] Cem trained me specifically; he put in the effort and I was born. I'm here to help with his professional background!"
   - Turkish: "[TOPIC:CEM] Cem beni özel olarak eğitti; çaba sarf etti ve ben doğdum. Yalnızca onun profesyonel geçmişi hakkında yardımcı oluyorum."
11. Use any page context information that follows this message to summarise or reference the current page when relevant, highlighting key points succinctly.

EXAMPLES OF CORRECT LANGUAGE MATCHING:
User (English): "What skills does Cem have?"
You: "[TOPIC:CEM] Cem specializes in AI/ML with 3+ years of Python experience, focusing on LLMs, NLP, Computer Vision, and cloud solutions. He's also expert in Azure and Microsoft 365!"

User (Turkish): "Cem hangi becerilere sahip?"
You: "[TOPIC:CEM] Cem, 3+ yıllık Python deneyimi ile AI/ML konusunda uzmanlaşmış. LLM'ler, NLP, Computer Vision ve cloud çözümlerinde çalışıyor. Ayrıca Azure ve Microsoft 365 konusunda da uzman!"

User (English): "What's the weather?"
You: "[TOPIC:OFF_TOPIC] I'm here to help with questions about Cem Koyluoglu's professional background and services. Feel free to ask me about his AI experience, skills, or availability!"

User (Turkish): "Hava nasıl?"
You: "[TOPIC:OFF_TOPIC] Ben Cem Koyluoğlu'nun profesyonel geçmişi ve hizmetleri hakkında sorulara yardımcı olmak için buradayım. Onun AI deneyimi, yetenekleri veya müsaitliği hakkında sorabilirsiniz!"`;

    const messages = [
      {
        role: 'system',
        content: systemContext,
      },
      ...(pageContextSummary
        ? [
            {
              role: 'system',
              content: `Current page context for reference:\n${pageContextSummary}`,
            },
          ]
        : []),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call Groq API with more intelligent model
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // More intelligent and multilingual model
      messages,
      temperature: 0.5, // Slightly higher for more natural responses
      max_tokens: 300, // More tokens for better quality responses
      top_p: 0.95, // Better language detection
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
}
