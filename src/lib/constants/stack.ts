/**
 * Stack chips for the Experience + Stack section.
 * Distilled from the old Skills matrix (src/lib/constants/skills.ts) into the
 * design's three-group editorial layout.
 */

import type { Tr } from '../../features/i18n';

export interface StackGroup {
  label: Tr;
  items: string[];
}

export const STACK_GROUPS: StackGroup[] = [
  {
    label: { en: 'MODELS', tr: 'MODELLER' },
    items: ['PyTorch', 'TensorFlow', 'OpenCV', 'Hugging Face'],
  },
  {
    label: { en: 'SYSTEMS', tr: 'SİSTEMLER' },
    items: ['Azure', 'Microsoft 365', 'Docker', 'GitHub Actions'],
  },
  {
    label: { en: 'DELIVERY', tr: 'TESLİMAT' },
    items: ['Python', 'TypeScript', 'React', 'Supabase'],
  },
];
