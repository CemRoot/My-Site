/**
 * Services & Expertise Constants
 */

export const SERVICES = [
  {
    id: 'ai-ml',
    title: 'AI/ML Development',
    description: 'Building intelligent systems powered by cutting-edge machine learning and deep learning technologies.',
    skills: ['LLMs', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'OpenAI API'],
    color: 'primary' as const,
    featured: true,
  },
  {
    id: 'cloud',
    title: 'Cloud Solutions',
    description: 'Architecting and managing scalable cloud infrastructure with Microsoft Azure and Microsoft 365.',
    skills: ['Azure', 'Microsoft 365', 'SharePoint', 'Power Platform', 'Cloud Migration'],
    color: 'secondary' as const,
  },
  {
    id: 'sysops',
    title: 'System Operations',
    description: 'Automating infrastructure, optimizing workflows, and ensuring 24/7 system reliability.',
    skills: ['Automation', 'DevOps', 'CI/CD', 'Monitoring', 'Performance Tuning'],
    color: 'accent' as const,
  },
  {
    id: 'chatbot',
    title: 'Chatbot & Automation',
    description: 'Creating intelligent chatbots and automation solutions that enhance user experience.',
    skills: ['RAG', 'LangChain', 'Conversational AI', 'API Integration', 'Workflow Automation'],
    color: 'primary' as const,
  },
  {
    id: 'data-eng',
    title: 'Data Engineering',
    description: 'Designing robust data pipelines and managing databases for optimal performance.',
    skills: ['Python', 'SQL', 'ETL Pipelines', 'Data Modeling', 'MySQL', 'PostgreSQL'],
    color: 'secondary' as const,
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'Transforming complex data into actionable insights through advanced analytics.',
    skills: ['Data Analysis', 'Power BI', 'Visualization', 'Statistical Modeling', 'Reporting'],
    color: 'accent' as const,
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]['id'];
export type ServiceColor = 'primary' | 'secondary' | 'accent';
