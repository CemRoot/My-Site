/**
 * Project data displayed on the portfolio
 */

import { Eye, Database, Bot, Plane, Globe } from 'lucide-react';
import { PROJECT_URLS } from './urls';

export const PROJECTS = [
  {
    title: 'DeepFake Detection Framework',
    description: 'MSc Dissertation: Novel deep learning framework using Attention-Enhanced EfficientNetB7 achieving 97% accuracy on 10,000+ synthetic images.',
    icon: Eye,
    tags: ['Python', 'TensorFlow', 'CNN', 'Streamlit', 'Machine Learning'],
    color: 'primary',
    stats: ['97% Accuracy', '10K+ Images', 'Real-time Prediction'],
    details: 'Developed a comprehensive deep learning framework for deepfake detection as part of my MSc dissertation. Conducted statistical analysis, feature engineering, and hyperparameter tuning on a dataset of over 10,000 synthetic images.',
    highlights: [
      'Achieved 97% classification accuracy through advanced CNN architecture',
      'Evaluated multiple ML models: CNN, SVM, Random Forest',
      'Performed comprehensive statistical analysis and cross-validation',
      'Built Streamlit web application for real-time prediction',
      'Applied feature engineering and model performance analysis',
    ],
    github: PROJECT_URLS.deepfakeGithub,
    link: PROJECT_URLS.deepfakeDemo,
  },
  {
    title: 'Ireland Expat Assistant',
    description: 'AI-powered assistant for expats in Ireland, providing step-by-step guidance on visa/IRP, tax (PAYE/PRSI/USC), healthcare (HSE/Medical Card), social welfare, and citizenship processes.',
    icon: Globe,
    tags: ['ChatGPT', 'GPT', 'NLP', 'RAG', 'Immigration', 'Irish Tax', 'Healthcare'],
    color: 'secondary',
    stats: ['IRP Renewal Guide', 'Tax & Budget Updates', 'Healthcare Guidance'],
    details: 'Ireland Expat Assistant provides practical, official-source-based guidance for people who have moved to or are planning to move to Ireland. It summarizes IRP card renewals, stamp permits, work permits (General/Critical Skills), tax system (PAYE, PRSI, USC, tax credits), budget changes like rent tax credit, Medical Card/GP Visit Card applications, social supports, and citizenship application requirements in an understandable way. The assistant references official uploaded documents when possible, providing checklists, required documents, and critical points to watch out for. (For informational purposes only; not legal/financial advice.)',
    highlights: [
      'IRP Renewal: Clarifies which documents to upload by stamp type, helping reduce delays',
      'Employment Permits: Provides checklist-based document/condition tracking for General and Critical Skills applications',
      'Tax & Budget Changes: Summarizes updates like Rent Tax Credit extension and USC adjustments clearly',
      'Medical Card/GP Visit Card: Explains application steps, required evidence/documents, and assessment framework',
      'Citizenship Application: Guides on residence proof "points" logic and common mistakes leading to rejection',
      'Family Reunification: Frames the policy framework and assessment approach clearly',
    ],
    link: PROJECT_URLS.irelandExpatAssistant,
  },
  {
    title: 'Automated Data Analysis System',
    description: 'Python-based system for automated data collection, cleaning, and analysis reducing manual processing time by 60%.',
    icon: Database,
    tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Data Visualization'],
    color: 'secondary',
    stats: ['60% Time Saved', 'Automated Workflows', 'Visual Dashboards'],
    details: 'Built a comprehensive automated data analysis system implementing statistical analysis workflows and data visualization dashboards for efficient data processing.',
    highlights: [
      'Reduced manual data processing time by 60%',
      'Implemented automated data collection and cleaning pipelines',
      'Created interactive dashboards using Matplotlib',
      'Applied statistical analysis and data visualization techniques',
      'Automated report generation and insights delivery',
    ],
  },
  {
    title: 'Customer Dashboard Platform',
    description: 'Enterprise Django application with Oracle DB serving 100+ customers with comprehensive dashboards and control panels.',
    icon: Bot,
    tags: ['Django', 'Oracle DB', 'PostgreSQL', 'REST API', 'Web Scraping'],
    color: 'accent',
    stats: ['100+ Customers', '40% Efficiency Gain', 'Enterprise Scale'],
    details: 'Developed comprehensive dashboards and control panels for over 100 customers at Art-In Systems, enhancing data presentation and accessibility with enterprise-grade solutions.',
    highlights: [
      'Built scalable dashboards for 100+ customers using Django',
      'Enhanced data processing efficiency by 40% with Selenium & Beautiful Soup',
      'Optimized MySQL queries for improved data retrieval',
      'Implemented automated data extraction and ETL pipelines',
      'Conducted exploratory data analysis for business insights',
      'Worked with Oracle DB and PostgreSQL for secure data storage',
    ],
  },
  {
    title: 'FlyBee Drone Courier',
    description: 'Aviation start-up project leveraging UAV technology for rotary-wing courier services. Suspended due to Turkish Aviation Laws.',
    icon: Plane,
    tags: ['TensorFlow', 'AI', 'Business Development', 'Aviation Tech'],
    color: 'primary',
    stats: ['Start-up Owner', 'Jan 2021 - Dec 2022', 'Innovation Focus'],
    details: 'Led FlyBee Delivery from concept to execution, focusing on innovative UAV courier solutions. Developed business models, built diverse teams, and implemented advanced AI technologies.',
    highlights: [
      'Developed robust business model for aviation delivery industry',
      'Led diverse team fostering innovation culture',
      'Implemented TensorFlow, AI, and ML for operational efficiency',
      'Conducted financial analysis and account management',
      'Navigated complex aviation regulatory landscape',
      'Project suspended due to Turkish aviation law challenges',
    ],
  },
] as const;
