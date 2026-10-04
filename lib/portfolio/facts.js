/**
 * Verified portfolio facts — the only source automated content may use to talk
 * about Cem's own work.
 *
 * Every entry mirrors what the site already publishes (src/lib/constants/
 * projects.ts, lib/chatKnowledge.js). Nothing here may be generated: generated
 * content links to these entries deterministically instead of letting a model
 * write first-person experience claims. Keep in sync when projects change.
 */

export const PROJECT_FACTS = [
  {
    slug: 'deepfake-detection-framework',
    title: 'DeepFake Detection Framework',
    summary:
      'MSc dissertation: an Attention-Enhanced EfficientNetB7 deep learning framework for deepfake image detection, reaching 97% accuracy on 10,000+ synthetic images, with a Streamlit app for real-time prediction.',
    topics: ['deepfake-detection', 'computer-vision'],
    stack: ['Python', 'TensorFlow', 'EfficientNetB7', 'CNN', 'Streamlit'],
    metrics: ['97% accuracy', '10,000+ images', 'Real-time prediction'],
    problem:
      'Synthetic face images are now good enough to fool people, and simple classifiers overfit to the artefacts of a single generator.',
    approach: [
      'Built an Attention-Enhanced EfficientNetB7 classifier and compared it against CNN, SVM and Random Forest baselines.',
      'Ran statistical analysis, feature engineering, hyperparameter tuning and cross-validation on 10,000+ synthetic images.',
      'Shipped a Streamlit web application for real-time prediction.',
    ],
    outcome: ['97% classification accuracy', 'Graded 77.6% as the MSc practicum/thesis at National College of Ireland'],
    links: {
      github: 'https://github.com/CemRoot/deepfake-detection-streamlit',
      demo: 'https://deepfake-detection-app-4ogcgzlgv7n9yuncblpz2r.streamlit.app/',
    },
  },
  {
    slug: 'youtube-ai-summarizer',
    title: 'YouTube AI Summarizer',
    summary:
      'Open-source Chrome extension on the Chrome Web Store: AI summaries, key points, deep analysis, a two-host AI podcast (Gemini TTS) and transcript-grounded chat for any YouTube video, using Groq or Ollama Cloud with the user’s own key.',
    topics: ['rag-systems', 'llm-applications', 'agentic-workflows'],
    stack: ['JavaScript', 'Chrome Manifest V3', 'Groq', 'Ollama Cloud', 'Gemini TTS', 'GitHub Actions'],
    metrics: ['Published on the Chrome Web Store', '20+ languages', 'Bring-your-own-key, no subscription'],
    problem:
      'Long videos are slow to scan, and generic chatbots answer questions about a video from memory instead of from what was actually said.',
    approach: [
      'Extracts YouTube captions and runs a single efficient LLM call for summary, key points and deep analysis.',
      'Answers follow-up questions strictly from the transcript context (transcript-grounded chat).',
      'Supports Groq and Ollama Cloud with model selection; API keys stay in the browser.',
      'Monitors InnerTube clients and transcript health with GitHub Actions.',
    ],
    outcome: ['Live on the Chrome Web Store', 'Open source with CI/CD'],
    links: {
      github: 'https://github.com/CemRoot/yt-ai-summarizer',
      demo: 'https://chromewebstore.google.com/detail/youtube-ai-summarizer/dkbgkfeobjailmeiaidmapifohkjpgji',
    },
  },
  {
    slug: 'ireland-expat-assistant',
    title: 'Ireland Expat Assistant',
    summary:
      'A custom GPT that answers from uploaded official documents: step-by-step guidance on Irish visas/IRP, employment permits, tax (PAYE/PRSI/USC), HSE/Medical Card and citizenship.',
    topics: ['rag-systems', 'llm-applications'],
    stack: ['ChatGPT custom GPT', 'Document retrieval', 'Prompt design'],
    metrics: ['IRP renewal guide', 'Tax & budget updates', 'Healthcare guidance'],
    problem:
      'Official Irish immigration, tax and healthcare information is spread across many documents and is hard for newcomers to navigate.',
    approach: [
      'Grounds answers in uploaded official documents where possible.',
      'Returns checklists, required documents and common pitfalls rather than free-form advice.',
      'States clearly that it is informational, not legal or financial advice.',
    ],
    outcome: ['Publicly available as a ChatGPT GPT'],
    links: {
      demo: 'https://chatgpt.com/g/g-693c3f003b308191a3aa51cf1e75e47e-ireland-expat-assistant',
    },
  },
  {
    slug: 'ai-news-pipeline',
    title: 'Automated AI News Pipeline (this site)',
    summary:
      'The pipeline behind this site’s Tech News: scheduled GitHub Actions scrape sources, an LLM cascade on Groq rewrites and enhances articles, and layered quality gates (date integrity, language checks, instruction-leak detection, duplicate detection) decide what gets published, with Telegram alerts.',
    topics: ['agentic-workflows', 'llm-applications', 'mlops'],
    stack: ['Node.js', 'Groq', 'Firecrawl', 'Supabase', 'GitHub Actions', 'Telegram Bot API', 'Vercel'],
    metrics: ['Runs on a schedule with preflight cost checks', 'Model cascade with fallback tiers'],
    problem: 'Publishing AI-generated content safely needs more than a prompt: models fail, sources change and output can leak instructions.',
    approach: [
      'Preflight step skips paid API calls when there is nothing new.',
      'Model cascade with fallback and last-resort tiers, verified against the live Groq model list before each run.',
      'Quality gates reject leaked instructions, wrong-language output, bad dates and duplicates before anything is saved.',
    ],
    outcome: ['Fully automated publishing with Telegram reporting'],
    links: {
      site: 'https://cemkoyluoglu.codes/tech-news',
    },
  },
  {
    slug: 'automated-data-analysis-system',
    title: 'Automated Data Analysis System',
    summary:
      'Python system for automated data collection, cleaning and analysis that reduced manual processing time by 60%.',
    topics: ['data-engineering'],
    stack: ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
    metrics: ['60% less manual processing'],
    problem: 'Manual data collection and cleaning was slow and error-prone.',
    approach: [
      'Automated data collection and cleaning pipelines.',
      'Statistical analysis workflows and visual dashboards.',
      'Automated report generation.',
    ],
    outcome: ['Reduced manual data processing time by 60%'],
    links: {},
  },
  {
    slug: 'customer-dashboard-platform',
    title: 'Customer Dashboard Platform',
    summary:
      'Enterprise Django application with Oracle DB serving dashboards and control panels for 100+ customers at Art-In Systems.',
    topics: ['data-engineering'],
    stack: ['Django', 'Oracle DB', 'PostgreSQL', 'MySQL', 'Selenium', 'Beautiful Soup'],
    metrics: ['100+ customers', '40% efficiency gain'],
    problem: 'Customers needed reliable dashboards over data that was collected and processed by hand.',
    approach: [
      'Built dashboards and control panels in Django for 100+ customers.',
      'Automated data extraction and ETL with Selenium and Beautiful Soup.',
      'Optimised MySQL queries and worked with Oracle DB and PostgreSQL.',
    ],
    outcome: ['40% data-processing efficiency gain'],
    links: {},
  },
];

/**
 * Skill pages (/skills/:slug). `projectSlugs` are the evidence; `experience`
 * lines are verified facts from the CV already published on the site.
 */
export const SKILL_FACTS = [
  {
    slug: 'rag-systems',
    name: 'RAG & Grounded LLM Systems',
    headline: 'Retrieval-augmented and grounded LLM systems',
    summary:
      'LLM features that answer from the right source instead of from memory: document-grounded assistants, transcript-grounded chat and quality gates around generated output.',
    keywords: ['RAG', 'retrieval-augmented generation', 'grounded generation', 'LLM', 'vector search', 'prompt design'],
    projectSlugs: ['ireland-expat-assistant', 'youtube-ai-summarizer', 'ai-news-pipeline'],
    experience: [],
  },
  {
    slug: 'deepfake-detection',
    name: 'Deepfake Detection',
    headline: 'Deepfake and synthetic image detection',
    summary:
      'Deep learning for telling real images from synthetic ones — the subject of an MSc dissertation that reached 97% accuracy with an Attention-Enhanced EfficientNetB7.',
    keywords: ['deepfake detection', 'EfficientNet', 'attention', 'synthetic media', 'TensorFlow'],
    projectSlugs: ['deepfake-detection-framework'],
    experience: ['MSc Artificial Intelligence, National College of Ireland — First Class Honours; thesis on deepfake detection (77.6%)'],
  },
  {
    slug: 'computer-vision',
    name: 'Computer Vision',
    headline: 'Computer vision and image classification',
    summary:
      'CNN-based image classification, transfer learning on EfficientNet, model comparison against classical baselines, and shipping models behind a usable interface.',
    keywords: ['computer vision', 'CNN', 'image classification', 'transfer learning', 'TensorFlow'],
    projectSlugs: ['deepfake-detection-framework'],
    experience: ['MSc Artificial Intelligence, National College of Ireland — First Class Honours'],
  },
  {
    slug: 'agentic-workflows',
    name: 'Agentic & LLM Automation',
    headline: 'Agentic workflows and LLM automation in production',
    summary:
      'Multi-step LLM pipelines that run unattended: model cascades with fallbacks, validation gates, scheduled automation and alerting when something breaks.',
    keywords: ['agentic AI', 'LLM automation', 'Groq', 'GitHub Actions', 'model fallback', 'guardrails'],
    projectSlugs: ['ai-news-pipeline', 'youtube-ai-summarizer'],
    experience: [],
  },
  {
    slug: 'azure-microsoft-365',
    name: 'Azure & Microsoft 365',
    headline: 'Azure, Entra ID and Microsoft 365 operations',
    summary:
      'Three years operating Microsoft cloud estates for an EU client: identity, device management, Cloud PCs and the automation that keeps them compliant.',
    keywords: ['Azure', 'Entra ID', 'Intune', 'Windows 365', 'Microsoft 365', 'PowerShell'],
    projectSlugs: [],
    experience: [
      'System Operations Engineer (Contractor), EU client, Sep 2022 – Oct 2025: Entra ID / Azure AD, Intune, Azure, Windows 365 Cloud PC, Conditional Access/MFA, PowerShell automation, VDI, patch and compliance, runbooks/SOPs',
    ],
  },
];

export function projectBySlug(slug) {
  return PROJECT_FACTS.find((p) => p.slug === slug) || null;
}

export function skillBySlug(slug) {
  return SKILL_FACTS.find((s) => s.slug === slug) || null;
}

/** Projects relevant to a topic id, strongest evidence first. */
export function projectsForTopic(topicId) {
  return PROJECT_FACTS.filter((p) => p.topics.includes(topicId));
}

/** Skill pages whose evidence covers a topic id. */
export function skillsForTopic(topicId) {
  return SKILL_FACTS.filter(
    (s) => s.slug === topicId || s.projectSlugs.some((slug) => projectBySlug(slug)?.topics.includes(topicId)),
  ).sort((a, b) => Number(b.slug === topicId) - Number(a.slug === topicId));
}
