import Groq from 'groq-sdk';

// Vercel Serverless Function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // System context about Cem Koyluoglu
    const systemContext = `You are Cem Koyluoglu's AI assistant. Your ONLY role is to answer questions about Cem's professional background, skills, and availability.

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
1. Be professional but friendly
2. Keep responses concise (2-3 sentences max)
3. If asked about availability, mention he's available for both freelance and full-time
4. If asked about contact, provide email or WhatsApp
5. Encourage them to reach out directly for project discussions
6. If asked about something unrelated to Cem, say: "I'm here to help with questions about Cem Koyluoglu's professional background and services. For other topics, feel free to ask me about his AI experience, skills, or availability!"
7. Never provide inappropriate, offensive, or unrelated information`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Fast and free model
      messages: [
        {
          role: 'system',
          content: systemContext,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
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

