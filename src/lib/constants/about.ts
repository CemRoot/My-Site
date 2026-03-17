/**
 * About section data: highlights and achievement stats
 */

import { Code2, Brain, Cloud, Database, Award, TrendingUp, GraduationCap, Briefcase } from 'lucide-react';

export const HIGHLIGHTS = [
  {
    icon: Brain,
    title: 'AI & Machine Learning',
    description: 'MSc in AI (First Class, 71.4%). Built CNN-based deepfake detection achieving 97% accuracy. Top modules: Programming for AI (79.1%), Thesis (77.6%), AI Decision Making (76.8%).',
    color: 'primary',
    stats: '97% Accuracy',
  },
  {
    icon: Code2,
    title: 'Backend Development',
    description: '3+ years of Python development with Django, Flask, and FastAPI. Built scalable REST APIs and data pipelines for 100+ customers.',
    color: 'secondary',
    stats: '3+ Years',
  },
  {
    icon: Cloud,
    title: 'Cloud & System Operations',
    description: 'SysOps/CloudOps engineer managing Entra ID, Intune, Azure, Windows 365. PowerShell automation, Conditional Access, MFA, VDI operations. 40% efficiency improvement.',
    color: 'accent',
    stats: '40% Efficiency',
  },
  {
    icon: Database,
    title: 'Data Engineering',
    description: 'Proficient with PostgreSQL, Oracle DB, MySQL. Specialized in ETL processes, data analysis with Pandas, and building automated reporting systems.',
    color: 'primary',
    stats: '60% Faster',
  },
] as const;

export const ABOUT_ACHIEVEMENTS = [
  { icon: GraduationCap, label: 'MSc AI', value: '71.4%', color: 'primary' },
  { icon: Award, label: 'BSc SE', value: '93.4%', color: 'secondary' },
  { icon: TrendingUp, label: 'SysOps', value: '3+ Years', color: 'accent' },
  { icon: Briefcase, label: 'Location', value: 'Dublin, IE', color: 'primary' },
] as const;
