import {
  Code, Database, Cloud, Brain, Workflow, BarChart, Shield, Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SkillEntry {
  name: string;
  level: number;
  years: string;
}

export interface SkillCategory {
  title: string;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'accent';
  priority: number;
  skills: SkillEntry[];
}

export interface Methodology {
  name: string;
  color: 'primary' | 'secondary' | 'accent';
}

export interface Certification {
  title: string;
  issuer: string;
  platform: string;
  year: string;
  focus: string;
  type: string;
  color: 'primary' | 'secondary' | 'accent';
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Programming Languages',
    icon: Code,
    color: 'primary',
    priority: 1,
    skills: [
      { name: 'Python', level: 95, years: '3+' },
      { name: 'JavaScript', level: 80, years: '2+' },
      { name: 'SQL', level: 90, years: '3+' },
      { name: 'C++', level: 75, years: '2+' },
      { name: 'C#', level: 70, years: '1+' },
      { name: 'R', level: 65, years: '1+' },
      { name: 'HTML/CSS', level: 85, years: '2+' },
    ],
  },
  {
    title: 'AI & Machine Learning',
    icon: Brain,
    color: 'accent',
    priority: 2,
    skills: [
      { name: 'TensorFlow', level: 90, years: '2+' },
      { name: 'Scikit-learn', level: 85, years: '2+' },
      { name: 'CNN/Deep Learning', level: 95, years: '1+' },
      { name: 'GANs', level: 80, years: '1+' },
      { name: 'Diffusion Models', level: 75, years: '1+' },
      { name: 'LangGraph/Crew AI', level: 80, years: '<1' },
      { name: 'OpenAI/Hugging Face', level: 85, years: '1+' },
    ],
  },
  {
    title: 'Backend & APIs',
    icon: Workflow,
    color: 'secondary',
    priority: 3,
    skills: [
      { name: 'Django', level: 90, years: '2+' },
      { name: 'Flask', level: 95, years: '3+' },
      { name: 'REST APIs', level: 95, years: '3+' },
      { name: 'FastAPI', level: 85, years: '1+' },
      { name: 'Microservices', level: 80, years: '1+' },
      { name: 'Struts Framework', level: 70, years: '1+' },
    ],
  },
  {
    title: 'Cloud & DevOps',
    icon: Cloud,
    color: 'accent',
    priority: 4,
    skills: [
      { name: 'Microsoft Azure', level: 90, years: '3+' },
      { name: 'Entra ID (Azure AD)', level: 95, years: '3+' },
      { name: 'Microsoft 365', level: 95, years: '3+' },
      { name: 'Docker', level: 85, years: '2+' },
      { name: 'CI/CD Pipelines', level: 85, years: '2+' },
      { name: 'Git/GitHub', level: 95, years: '3+' },
      { name: 'AWS', level: 75, years: '1+' },
    ],
  },
  {
    title: 'Databases',
    icon: Database,
    color: 'secondary',
    priority: 5,
    skills: [
      { name: 'PostgreSQL', level: 90, years: '2+' },
      { name: 'Oracle DB', level: 85, years: '1+' },
      { name: 'MySQL', level: 90, years: '3+' },
      { name: 'MS SQL Server', level: 85, years: '2+' },
    ],
  },
  {
    title: 'Data Analysis & Tools',
    icon: BarChart,
    color: 'primary',
    priority: 6,
    skills: [
      { name: 'Pandas', level: 95, years: '3+' },
      { name: 'NumPy', level: 90, years: '3+' },
      { name: 'Selenium', level: 85, years: '2+' },
      { name: 'Beautiful Soup', level: 85, years: '2+' },
      { name: 'Matplotlib/Visualization', level: 80, years: '2+' },
      { name: 'Statistical Analysis', level: 90, years: '2+' },
      { name: 'Excel (Advanced)', level: 90, years: '3+' },
    ],
  },
  {
    title: 'Microsoft Ecosystem',
    icon: Settings,
    color: 'primary',
    priority: 7,
    skills: [
      { name: 'Intune (Endpoint Manager)', level: 95, years: '3+' },
      { name: 'Windows 365 Cloud PC', level: 90, years: '2+' },
      { name: 'PowerShell Automation', level: 90, years: '3+' },
      { name: 'Conditional Access & MFA', level: 95, years: '3+' },
      { name: 'Azure Autopilot', level: 85, years: '2+' },
      { name: 'Google Workspace', level: 80, years: '2+' },
    ],
  },
  {
    title: 'Security & Operations',
    icon: Shield,
    color: 'secondary',
    priority: 8,
    skills: [
      { name: 'Security Baselines', level: 90, years: '3+' },
      { name: 'VDI Operations', level: 85, years: '2+' },
      { name: 'Patch Management', level: 90, years: '3+' },
      { name: 'System Monitoring', level: 90, years: '3+' },
      { name: 'Runbook/SOP Creation', level: 85, years: '3+' },
    ],
  },
];

export const METHODOLOGIES: Methodology[] = [
  { name: 'Agile/Scrum', color: 'primary' },
  { name: 'Test-Driven Development (TDD)', color: 'secondary' },
  { name: 'MVC Architecture', color: 'accent' },
  { name: 'SOLID Principles', color: 'primary' },
  { name: 'OOP', color: 'secondary' },
  { name: 'Data Visualization', color: 'accent' },
  { name: 'A/B Testing', color: 'primary' },
  { name: 'Statistical Modeling', color: 'secondary' },
  { name: 'Root-Cause Analysis', color: 'accent' },
  { name: 'Process Automation', color: 'primary' },
];

export const CERTIFICATIONS: Certification[] = [
  {
    title: 'Generative AI: Working with Large Language Models',
    issuer: 'NASBA',
    platform: 'NASBA',
    year: '2025',
    focus: 'LLMs & Prompt Engineering',
    type: 'Certification',
    color: 'primary',
  },
  {
    title: 'The Complete Agentic AI Engineering Course',
    issuer: 'Udemy',
    platform: 'Udemy',
    year: '2025',
    focus: 'Agentic AI Systems',
    type: 'Certification',
    color: 'secondary',
  },
  {
    title: 'Machine Learning A-Z: AI, Python',
    issuer: 'Udemy',
    platform: 'Udemy',
    year: '2025',
    focus: 'Machine Learning Foundations',
    type: 'Certification',
    color: 'accent',
  },
  {
    title: 'Hands-On Generative AI with Diffusion Models',
    issuer: 'LinkedIn Learning',
    platform: 'LinkedIn Learning',
    year: '2025',
    focus: 'Diffusion & Visual Generation',
    type: 'Certification',
    color: 'primary',
  },
  {
    title: 'Introduction to Generative Adversarial Networks',
    issuer: 'LinkedIn Learning',
    platform: 'LinkedIn Learning',
    year: '2025',
    focus: 'GAN Architectures',
    type: 'Certification',
    color: 'secondary',
  },
  {
    title: 'What Is Generative AI?',
    issuer: 'LinkedIn Learning',
    platform: 'LinkedIn Learning',
    year: '2025',
    focus: 'AI Strategy & Adoption',
    type: 'Certification',
    color: 'accent',
  },
  {
    title: 'AI For Everyone',
    issuer: 'deeplearning.ai',
    platform: 'Coursera',
    year: '2023',
    focus: 'Executive AI Strategy',
    type: 'Certification',
    color: 'primary',
  },
  {
    title: 'Linear Regression with NumPy and Python',
    issuer: 'Coursera',
    platform: 'Coursera',
    year: '2023',
    focus: 'Statistical Modeling',
    type: 'Certification',
    color: 'secondary',
  },
  {
    title: 'Python Pro Bootcamp',
    issuer: 'Udemy',
    platform: 'Udemy',
    year: '2022',
    focus: 'Applied Python Engineering',
    type: 'Certification',
    color: 'accent',
  },
  {
    title: 'Using Git and GitHub with Sourcetree',
    issuer: 'Udemy',
    platform: 'Udemy',
    year: '2021',
    focus: 'Version Control Workflows',
    type: 'Certification',
    color: 'primary',
  },
  {
    title: 'IHA-1 Drone Pilot License',
    issuer: 'SHGM (Turkish DGCA)',
    platform: 'SHGM',
    year: '2021',
    focus: 'Aviation Safety & Operations',
    type: 'License',
    color: 'secondary',
  },
  {
    title: 'Static Security Guard',
    issuer: 'The Security Institute',
    platform: 'The Security Institute',
    year: '2023-2026',
    focus: 'Physical Security & Compliance',
    type: 'License',
    color: 'accent',
  },
];

export const CERTIFICATION_THEMES = {
  primary: {
    border: 'border-primary/20',
    badge: 'border border-primary/30 text-primary bg-primary/10',
    text: 'text-primary',
    iconBg: 'from-primary/25 to-primary/5',
    platformBg: 'bg-primary/5 border-primary/20',
  },
  secondary: {
    border: 'border-secondary/20',
    badge: 'border border-secondary/30 text-secondary bg-secondary/10',
    text: 'text-secondary',
    iconBg: 'from-secondary/25 to-secondary/5',
    platformBg: 'bg-secondary/5 border-secondary/20',
  },
  accent: {
    border: 'border-accent/20',
    badge: 'border border-accent/30 text-accent bg-accent/10',
    text: 'text-accent',
    iconBg: 'from-accent/25 to-accent/5',
    platformBg: 'bg-accent/5 border-accent/20',
  },
} as const;
