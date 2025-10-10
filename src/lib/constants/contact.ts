/**
 * Contact Methods & Availability Constants
 */

import { Mail, Phone, MessageCircle, Github, Linkedin, MapPin } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS } from './personal';
import type { ContactMethod } from '../types';

export const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: Mail,
    label: 'Email',
    value: PERSONAL_INFO.email,
    href: `mailto:${PERSONAL_INFO.email}`,
    color: 'primary',
    description: 'Send me an email',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: PERSONAL_INFO.phone,
    href: `tel:${PERSONAL_INFO.phone.replace(/\s/g, '')}`,
    color: 'secondary',
    description: 'Call me anytime',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: 'Chat on WhatsApp',
    href: SOCIAL_LINKS.whatsapp.url,
    color: 'accent',
    description: 'Quick response guaranteed',
    featured: true,
  },
  {
    icon: Github,
    label: 'GitHub',
    value: SOCIAL_LINKS.github.username,
    href: SOCIAL_LINKS.github.url,
    color: 'primary',
    description: 'Check my code',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: SOCIAL_LINKS.linkedin.username,
    href: SOCIAL_LINKS.linkedin.url,
    color: 'secondary',
    description: 'Professional network',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: PERSONAL_INFO.location,
    href: '#',
    color: 'accent',
    description: 'Based in EU',
  },
] as const;

export const AVAILABILITY_STATUS = [
  {
    label: 'Available for new projects',
    active: true,
  },
  {
    label: 'Freelance contracts welcome',
    active: true,
  },
  {
    label: 'Full-time opportunities considered',
    active: true,
  },
  {
    label: 'Remote & on-site (Dublin)',
    active: true,
  },
] as const;
