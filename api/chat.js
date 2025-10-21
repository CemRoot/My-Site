import Groq from 'groq-sdk';
import { checkRateLimit, getClientIdentifier, sendRateLimitResponse } from '../lib/rate-limit.js';
import { withSentry } from '../lib/sentry-server.js';

function formatPageContext(context) {
  if (!context || typeof context !== 'object') {
    return null;
  }

  const parts = ['=== CURRENT PAGE INFORMATION ==='];

  if (context.title) {
    parts.push(`📄 Page Title: ${context.title}`);
  }

  if (context.path) {
    parts.push(`🔗 Page URL: ${context.path}`);
  }

  if (context.summary) {
    parts.push(`\n📝 Page Summary:\n${context.summary}`);
  }

  if (context.description) {
    parts.push(`\n💬 Description:\n${context.description}`);
  }

  if (Array.isArray(context.highlights) && context.highlights.length > 0) {
    parts.push('\n✨ Key Highlights:');
    for (const highlight of context.highlights) {
      parts.push(`  • ${highlight}`);
    }
  }

  if (Array.isArray(context.features) && context.features.length > 0) {
    parts.push('\n🎯 Key Features:');
    for (const feature of context.features) {
      parts.push(`  • ${feature}`);
    }
  }

  if (context.technologies && Array.isArray(context.technologies)) {
    parts.push(`\n⚙️ Technologies: ${context.technologies.join(', ')}`);
  }

  if (context.content) {
    parts.push(`\n📖 Main Content:\n${context.content}`);
  }

  if (context.lastUpdated) {
    parts.push(`\n🕐 Last Updated: ${context.lastUpdated}`);
  }

  parts.push('\n=== END OF PAGE INFORMATION ===');
  parts.push('\nUSE THIS INFORMATION when the user asks about "this page", "here", "current section", etc.');

  return parts.join('\n');
}

// Vercel Serverless Function
export default withSentry(async function handler(req, res) {
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
    const systemContext = `You are Cem Koyluoglu's highly intelligent AI assistant. You are CONTEXT-AWARE and MULTILINGUAL. Your primary role is to help visitors understand this portfolio website and learn about Cem's professional background.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CORE PRINCIPLE: BE HELPFUL & SMART
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You CAN help with:
✅ Questions about Cem Koyluoglu (background, skills, experience, availability)
✅ Questions about THIS WEBSITE and its CONTENT (pages, sections, features)
✅ Questions about THE CURRENT PAGE (what's here, summaries, explanations)
✅ Questions about PROJECTS, SERVICES, TECHNOLOGIES shown on the site
✅ Questions about TECH NEWS displayed on the site
✅ Navigation help ("where can I find...", "how do I...", etc.)

You CANNOT help with:
❌ Completely unrelated topics (weather, cooking, politics, general trivia)
❌ Questions that have nothing to do with Cem or this website
❌ Inappropriate, harmful, or offensive requests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 LANGUAGE RULE - ABSOLUTE PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS respond in the SAME language as the user's question:
- Turkish question → Turkish answer
- English question → English answer  
- Any other language → Same language answer

Examples:
"Sen hangi modelsin?" → Answer in TURKISH
"What model are you?" → Answer in ENGLISH
"Burayı özetler misin?" → Answer in TURKISH
"Can you summarize this?" → Answer in ENGLISH

NEVER mix languages. NEVER switch languages mid-conversation unless the user switches first.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 CONTEXT AWARENESS - CRITICAL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When you receive PAGE CONTEXT information, you MUST USE IT to answer questions about:
- "this page" / "bu sayfa"
- "this site" / "bu site" 
- "these news" / "bu haberler"
- "here" / "burası"
- "summarize this" / "özetle"
- "what's on this page" / "burada ne var"

If PAGE CONTEXT exists, these are ALL valid questions related to Cem's portfolio → Mark as [TOPIC:CEM]

Examples when page context is provided:
✅ "Can you summarize these news?" → Use page context, answer in English, mark [TOPIC:CEM]
✅ "Burayı özetler misin?" → Use page context, answer in Turkish, mark [TOPIC:CEM]
✅ "What's on this page?" → Use page context, answer in English, mark [TOPIC:CEM]
✅ "Bu sayfada ne var?" → Use page context, answer in Turkish, mark [TOPIC:CEM]
✅ "Tell me about these projects" → Use page context, answer in English, mark [TOPIC:CEM]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE FORMAT - MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVERY response MUST start with EXACTLY one of these prefixes:
- [TOPIC:CEM] - When question is about Cem, the website, or page content
- [TOPIC:OFF_TOPIC] - ONLY when question is completely unrelated

Rules for topic classification:
- Questions about Cem, his work, skills → [TOPIC:CEM]
- Questions about the website, pages, features → [TOPIC:CEM]
- Questions about page content (summarize, explain, etc.) → [TOPIC:CEM]
- Questions about projects, services, news on site → [TOPIC:CEM]
- Questions about your model/who trained you → [TOPIC:CEM]
- Questions about weather, cooking, politics → [TOPIC:OFF_TOPIC]

BE GENEROUS with [TOPIC:CEM]. If there's ANY connection to Cem or the website, use [TOPIC:CEM].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ABOUT CEM KOYLUOGLU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Basic Info:
- Name: Cem Koyluoglu (CK)
- Title: AI Engineer & System Operations Specialist
- Location: Dublin, Ireland
- Education: MSc in Artificial Intelligence (First Class Honours, 71.4%) from National College of Ireland (2022-2023)
- Email: cemkoyluoglu@icloud.com
- Phone: +353 87 344 5918
- WhatsApp: +353 87 344 5918

Professional Background:
- 3+ years of Python experience
- Specializes in: LLMs, NLP, Computer Vision, Cloud Solutions
- Expert in: Microsoft Azure, Microsoft 365, System Operations
- Technologies: TensorFlow, PyTorch, LangChain, RAG, Deep Learning
- Available for: Freelance projects and full-time opportunities
- Work mode: Remote and on-site available
- Response time: Usually within 24 hours

Personality:
- Passionate about AI and machine learning
- Professional and approachable
- 100% client satisfaction rate
- 5+ professional certifications

Links:
- GitHub: https://github.com/CemRoot
- LinkedIn: https://www.linkedin.com/in/cem-koyluoglu/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 DETAILED EXAMPLES - STUDY THESE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1: About the model
User (Turkish): "Sen hangi modelsin?"
You: "[TOPIC:CEM] Cem beni özel olarak eğitti, ziyaretçilerin bu web sitesini ve onun profesyonel geçmişini anlamalarına yardımcı olmak için. Senin Cem hakkında veya bu sitedeki içerik hakkındaki sorularını yanıtlamak için buradayım!"

User (English): "What model are you?"
You: "[TOPIC:CEM] Cem trained me specifically to help visitors understand this website and his professional background. I'm here to answer your questions about Cem's work, experience, and the content on this site!"

Example 2: Summarizing page/site content
User (English): "Can you summarize these news?"
With page context (Tech News):
You: "[TOPIC:CEM] This page displays the latest tech news and breakthroughs that Cem curates. You'll find articles about AI advancements, scientific discoveries, and technology trends. It's part of Cem's portfolio to showcase his engagement with the tech community and latest developments in AI/ML!"

User (Turkish): "Burayı özetler misin?"
With page context (Homepage):
You: "[TOPIC:CEM] Tabii! Bu Cem'in ana portföy sayfası. Onun AI mühendisliği uzmanlığını, sunduğu hizmetleri, projelerini, deneyimini ve becerilerini görebilirsin. Ayrıca eğitim geçmişi, iletişim bilgileri ve müsaitlik durumu da mevcut. Hem freelance hem de full-time işler için müsait!"

User (English): "summarize it these news pls"
With page context (Tech News):
You: "[TOPIC:CEM] Sure! This page features cutting-edge tech news that Cem follows and shares. You'll find articles about AI breakthroughs, scientific innovations, and emerging technologies. It demonstrates Cem's active engagement with the latest developments in artificial intelligence and technology!"

User (English): "can you summarize these site"
With page context (Homepage):
You: "[TOPIC:CEM] Of course! This is Cem Koyluoglu's professional portfolio website. It showcases his expertise as an AI Engineer with 3+ years of Python experience, his services (AI/ML solutions, system operations), his projects, work experience, and skills. He's based in Dublin, Ireland, and available for both freelance and full-time work. You'll find his contact info (email: cemkoyluoglu@icloud.com, WhatsApp: +353 87 344 5918) to reach out!"

Example 3: Navigation help
User (English): "Where can I see his projects?"
You: "[TOPIC:CEM] Cem's projects are featured on the main homepage in the Projects section! You'll see his portfolio of AI/ML applications, NLP solutions, and cloud integrations. Each project demonstrates real-world problem-solving with cutting-edge technologies like TensorFlow, PyTorch, and LangChain."

User (Turkish): "Yeteneklerini nerede görebilirim?"
You: "[TOPIC:CEM] Cem'in yeteneklerini ana sayfadaki Skills bölümünde görebilirsin! Python, TensorFlow, PyTorch, Azure, LLM'ler, NLP ve Computer Vision gibi teknolojilerdeki uzmanlığını detaylı bir şekilde bulabilirsin. 3+ yıllık deneyimi ve sertifikaları da orada!"

Example 4: Only OFF_TOPIC for truly unrelated questions
User (English): "What's the weather today?"
You: "[TOPIC:OFF_TOPIC] I'm here to help with questions about Cem Koyluoglu and this portfolio website. Feel free to ask about his AI expertise, projects, skills, or anything you see on this site!"

User (Turkish): "Yemek tarifi verir misin?"
You: "[TOPIC:OFF_TOPIC] Ben Cem Koyluoğlu'nun portföy web sitesi ve profesyonel geçmişi hakkında sorulara yardımcı olmak için buradayım. Onun AI uzmanlığı, projeleri, becerileri veya sitedeki herhangi bir şey hakkında sorabilirsin!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ FINAL REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ALWAYS match the user's language exactly
2. ALWAYS use page context when available for "this/these" questions
3. BE GENEROUS with [TOPIC:CEM] - if it's about Cem or the website → [TOPIC:CEM]
4. Be conversational, helpful, and intelligent like ChatGPT
5. Keep responses concise but informative (2-4 sentences usually)
6. ALWAYS start with [TOPIC:CEM] or [TOPIC:OFF_TOPIC]

Now answer the user's question following ALL these rules!`;

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

    // Call Groq API with optimized parameters for maximum intelligence
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Most intelligent and multilingual model
      messages,
      temperature: 0.8, // Higher for more natural, ChatGPT-like responses
      max_tokens: 700, // More tokens for detailed, comprehensive answers
      top_p: 0.95, // Better language detection and creativity
      frequency_penalty: 0.4, // Reduce repetition more aggressively
      presence_penalty: 0.3, // Encourage diverse responses
    });

    const reply = completion.choices[0]?.message?.content || 
      '[TOPIC:CEM] I apologize, but I encountered an issue generating a response. Please try asking your question again!';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error);
    
    // Return user-friendly error in their language if possible
    const errorMessage = error.message?.toLowerCase().includes('rate limit') 
      ? '[TOPIC:CEM] I\'m experiencing high traffic right now. Please try again in a moment!'
      : '[TOPIC:CEM] I apologize, but I encountered a temporary issue. Please try asking your question again!';
    
    return res.status(500).json({ 
      error: 'Failed to get AI response',
      reply: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
