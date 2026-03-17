/**
 * Personal Information Constants
 * Contains all personal data used across the portfolio
 */

export const PERSONAL_INFO = {
  name: 'Cem Koyluoglu',
  initials: 'CK',
  title: 'AI Engineer & System Operations Specialist',
  location: 'Dublin, Ireland',
  email: 'cemkoyluoglu@icloud.com',
  phone: '+353 87 344 5918',
  whatsapp: '+353873445918',
  
  bio: {
    short: 'AI Engineer with MSc in Artificial Intelligence (First Class Honours, 71.4%). Specializing in LLMs, NLP, Computer Vision, and Cloud Solutions.',
    long: 'Passionate AI Engineer and System Operations Specialist with a strong foundation in machine learning, deep learning, and cloud infrastructure. Experienced in building intelligent systems, automating workflows, and architecting scalable solutions. Currently based in Dublin, Ireland, and available for freelance projects and full-time opportunities.',
  },
  
  availability: {
    status: 'available',
    freelance: true,
    fullTime: true,
    remote: true,
    onSite: true,
    responseTime: '24 hours',
  },
  twitterHandle: '@CemKoyluoglu',
  portraitImage: '/portrait.webp',
} as const;

export const SOCIAL_LINKS = {
  github: {
    url: 'https://github.com/CemRoot',
    username: '@CemRoot',
  },
  linkedin: {
    url: 'https://www.linkedin.com/in/cem-koyluoglu/',
    username: '/cem-koyluoglu',
  },
  whatsapp: {
    url: 'https://wa.me/353873445918',
    label: 'Chat on WhatsApp',
  },
} as const;

export const EDUCATION = {
  degree: 'MSc in Artificial Intelligence',
  institution: 'National College of Ireland',
  grade: 71.4,
  classification: 'First Class Honours',
  period: '2022 - 2023',
} as const;

export const STATS = [
  {
    value: 3,
    suffix: '+',
    label: 'Years Python Experience',
    color: 'primary' as const,
  },
  {
    value: 71.4,
    suffix: '%',
    label: 'MSc AI Grade (First Class)',
    color: 'secondary' as const,
    decimals: 1,
  },
  {
    value: 5,
    suffix: '+',
    label: 'Professional Certifications',
    color: 'accent' as const,
  },
  {
    value: 100,
    suffix: '%',
    label: 'Client Satisfaction',
    color: 'primary' as const,
  },
] as const;
