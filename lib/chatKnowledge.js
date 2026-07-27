/**
 * Curated knowledge pack for the portfolio chat assistant.
 * Kept as plain JS so the Vercel chat API can inject rich, accurate facts
 * without importing React/icon-heavy TS modules.
 */

export const CHAT_KNOWLEDGE_PACK = `
=== AUTHORITATIVE SITE KNOWLEDGE (prefer this over guessing) ===

IDENTITY
- Full name: Cem Koyluoglu
- Role: AI Engineer & System Operations Specialist
- Location: Dublin, Ireland
- Email: cemkoyluoglu@icloud.com | WhatsApp: +353 87 344 5918
- GitHub: https://github.com/CemRoot | LinkedIn: https://www.linkedin.com/in/cem-koyluoglu/
- Site: https://cemkoyluoglu.codes
- Availability: freelance and full-time; remote and on-site; typical response within 24 hours

EDUCATION
- MSc Artificial Intelligence — National College of Ireland, Dublin (Sep 2024 – Sep 2025)
- First Class Honours | 71.4% overall | 3.1/4.0 GPA | 90 ECTS
- Strong modules: Programming for AI (79.1%), Practicum/Thesis DeepFake Detection (77.6%), AI Driven Decision Making (76.8%)
- Also: Engineering and Evaluating AI, Data Analytics for AI, Machine Learning, Intelligent Agents, Process Automation, Data Governance & Ethics
- Business English — Centre of English Studies (CES), Dublin (Jan 2024 – Aug 2024): C1
- BSc Software Engineering — National Technical University of Ukraine 'Kyiv Polytechnic Institute' (Sep 2019 – Jun 2023): Grade 93.4/100 | GPA 3.96/4.00 | DSC KPI Member

EXPERIENCE (high level)
- System Operations Engineer (Contractor), NDA EU client (Sep 2022 – Oct 2025): Entra ID / Azure AD, Intune, Azure, Windows 365 Cloud PC, Conditional Access/MFA, PowerShell automation, VDI, patch/compliance, Google Workspace + M365 interop, runbooks/SOPs
- Junior Python Developer, Art-In Systems, Turkey (Jun 2022 – Mar 2023): Django dashboards for 100+ customers, Oracle/PostgreSQL/MySQL, Selenium/BeautifulSoup/Pandas ETL (~40% efficiency gain)
- Earlier backend internship and FlyBee drone-courier startup leadership (UAV courier concept; later suspended due to Turkish aviation regulation)
- Parallel Ireland pathway role: Security Guard at RFC Security Group (Sep 2023 – Present) — lawful employment pathway toward Stamp 4 while continuing AI/cloud work

FLAGSHIP PROJECTS
1) DeepFake Detection Framework (MSc dissertation): Attention-Enhanced EfficientNetB7, ~97% accuracy on 10K+ synthetic images; CNN/SVM/RF comparison; Streamlit real-time demo
2) YouTube AI Summarizer (Chrome Web Store): privacy-first extension; captions → summary/key points/deep analysis; Groq or Ollama Cloud BYOK; Gemini TTS podcast mode; transcript-grounded chat; open source
3) Ireland Expat Assistant: guidance for IRP/stamps, work permits, Irish tax (PAYE/PRSI/USC), HSE/Medical Card, citizenship — informational only, not legal advice
4) Automated Data Analysis System: Python/Pandas pipelines, ~60% less manual processing, dashboards
5) Customer Dashboard Platform: enterprise Django + Oracle for 100+ customers
6) FlyBee Drone Courier: aviation startup / UAV courier (paused for regulatory reasons)

SERVICES HE OFFERS
- AI/ML development (LLMs, NLP, computer vision, TensorFlow/PyTorch)
- Cloud solutions (Azure, Microsoft 365, SharePoint, Power Platform)
- System operations / DevOps automation and reliability
- Chatbots & automation (RAG, LangChain, conversational AI)
- Data engineering (Python, SQL, ETL, PostgreSQL/MySQL)

SITE FEATURES TO HELP USERS WITH
- Home portfolio sections: About, Skills, Experience, Projects, Services, Contact
- Tech News: English tech articles curated/translated for the site; summarize using PAGE CONTEXT when on an article
- Privacy Policy, Terms, English Learning page, YouTube AI Summarizer static pages under /yt-ai-summarizer/

HOW TO SOUND SMART
- Prefer specific facts (project names, metrics, dates, tools) over generic praise
- If unsure, say what is on the site and offer contact — do not invent employers, degrees, or numbers
- When the user asks "who is Cem", lead with role + location + education highlight, then 1–2 project proofs, then contact/availability
- When asked about hiring/freelance, be concrete about stack and availability and share email/WhatsApp
=== END KNOWLEDGE ===
`.trim();

export const CHAT_MODEL_PRIMARY = process.env.CHAT_GROQ_MODEL || 'llama-3.3-70b-versatile';
export const CHAT_MODEL_FALLBACKS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
].filter((model) => model !== CHAT_MODEL_PRIMARY);

export const CHAT_COMPLETION_OPTIONS = {
  temperature: 0.45,
  max_tokens: 1100,
  top_p: 0.9,
  frequency_penalty: 0.15,
  presence_penalty: 0.1,
};
