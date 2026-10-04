export interface ProjectFact {
  slug: string;
  title: string;
  summary: string;
  topics: string[];
  stack: string[];
  metrics: string[];
  problem: string;
  approach: string[];
  outcome: string[];
  links: { github?: string; demo?: string; site?: string };
}

export interface SkillFact {
  slug: string;
  name: string;
  headline: string;
  summary: string;
  keywords: string[];
  projectSlugs: string[];
  experience: string[];
}

export const PROJECT_FACTS: ProjectFact[];
export const SKILL_FACTS: SkillFact[];
export function projectBySlug(slug: string): ProjectFact | null;
export function skillBySlug(slug: string): SkillFact | null;
export function projectsForTopic(topicId: string): ProjectFact[];
export function skillsForTopic(topicId: string): SkillFact[];
