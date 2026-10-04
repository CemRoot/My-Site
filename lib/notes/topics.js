/**
 * Topic filter for Engineer's Notes: only stories that sit on the skills this
 * site is meant to rank for are worth writing up. Scores are deterministic
 * keyword weights, so candidate selection is testable and explainable.
 */

export const NOTE_TOPICS = [
  {
    id: 'rag-systems',
    label: 'RAG',
    keywords: ['rag', 'retrieval', 'retrieval-augmented', 'vector database', 'vector search', 'embedding', 'embeddings', 'reranker', 'reranking', 'grounding', 'knowledge base', 'semantic search', 'hybrid search'],
  },
  {
    id: 'agentic-workflows',
    label: 'Agentic AI',
    keywords: ['agent', 'agents', 'agentic', 'tool use', 'tool calling', 'function calling', 'mcp', 'model context protocol', 'multi-agent', 'orchestration', 'workflow automation', 'computer use'],
  },
  {
    id: 'computer-vision',
    label: 'Computer Vision',
    keywords: ['computer vision', 'vision model', 'image classification', 'object detection', 'segmentation', 'vision-language', 'vlm', 'multimodal', 'image recognition'],
  },
  {
    id: 'deepfake-detection',
    label: 'Deepfake Detection',
    keywords: ['deepfake', 'deepfakes', 'synthetic media', 'watermark', 'watermarking', 'content provenance', 'c2pa', 'synthid', 'ai-generated image', 'manipulated media'],
  },
  {
    id: 'mlops',
    label: 'MLOps',
    keywords: ['inference', 'serving', 'latency', 'evaluation', 'evals', 'observability', 'guardrails', 'fine-tuning', 'fine-tune', 'quantization', 'deployment', 'production', 'benchmark', 'cost'],
  },
  {
    id: 'azure-microsoft-365',
    label: 'Azure AI',
    keywords: ['azure', 'azure ai foundry', 'azure openai', 'copilot studio', 'microsoft 365 copilot', 'entra', 'fabric', 'semantic kernel'],
  },
];

/** Business/news noise that rarely contains engineering substance. */
const NEGATIVE = ['funding', 'valuation', 'ipo', 'lawsuit', 'acquisition', 'hiring', 'partnership', 'webinar', 'event recap', 'customer story', 'case study:'];

function count(haystack, needle) {
  const pattern = new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'g');
  return (haystack.match(pattern) || []).length;
}

/**
 * @returns {{ topic: object|null, score: number }} best topic and its score
 */
export function scoreItem({ title = '', summary = '' }) {
  const t = title.toLowerCase();
  const s = summary.toLowerCase();
  let best = { topic: null, score: 0 };

  for (const topic of NOTE_TOPICS) {
    let score = 0;
    for (const keyword of topic.keywords) {
      score += count(t, keyword) * 3 + Math.min(count(s, keyword), 3);
    }
    if (score > best.score) best = { topic, score };
  }

  const penalty = NEGATIVE.reduce((n, word) => n + count(t, word) * 4, 0);
  return { topic: best.topic, score: Math.max(0, best.score - penalty) };
}

export const MIN_TOPIC_SCORE = 4;
