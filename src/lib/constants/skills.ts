/**
 * Skills & Technologies Constants
 * Organized by category for easy maintenance
 */

export const SKILL_CATEGORIES = {
  'AI & Machine Learning': [
    'Large Language Models (LLMs)',
    'Natural Language Processing',
    'Computer Vision',
    'Deep Learning',
    'TensorFlow',
    'PyTorch',
    'OpenAI API',
    'LangChain',
    'RAG Systems',
    'Hugging Face',
  ],
  'Programming & Development': [
    'Python',
    'SQL',
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'REST APIs',
    'Git',
  ],
  'Cloud & DevOps': [
    'Microsoft Azure',
    'Microsoft 365',
    'SharePoint',
    'Power Platform',
    'Docker',
    'CI/CD',
    'Cloud Architecture',
    'System Automation',
  ],
  'Data & Analytics': [
    'Data Engineering',
    'ETL Pipelines',
    'MySQL',
    'PostgreSQL',
    'Power BI',
    'Data Visualization',
    'Statistical Analysis',
  ],
} as const;

export const CERTIFICATIONS = [
  {
    name: 'Microsoft Certified: Azure Fundamentals',
    issuer: 'Microsoft',
    date: '2023',
  },
  {
    name: 'Microsoft 365 Fundamentals',
    issuer: 'Microsoft',
    date: '2023',
  },
  {
    name: 'Power Platform Fundamentals',
    issuer: 'Microsoft',
    date: '2023',
  },
  {
    name: 'Deep Learning Specialization',
    issuer: 'Coursera',
    date: '2022',
  },
  {
    name: 'Machine Learning',
    issuer: 'Stanford Online',
    date: '2022',
  },
] as const;

export type SkillCategory = keyof typeof SKILL_CATEGORIES;
export type Skill = (typeof SKILL_CATEGORIES)[SkillCategory][number];
