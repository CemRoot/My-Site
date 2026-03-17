/**
 * Contact Methods & Availability Constants
 */

import { Mail, Phone, MessageCircle, Github, Linkedin, MapPin } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS } from './personal';
import { GOOGLE_MAPS_DUBLIN_URL } from './urls';
import type { ContactMethod } from '../types';

export const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: Mail,
    label: 'Email',
    value: PERSONAL_INFO.email,
    href: `mailto:${PERSONAL_INFO.email}`,
    color: 'primary',
    description: 'Perfect for detailed project briefs or sharing documents.',
    meta: 'Replies within 12h',
    cta: 'Compose email',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: PERSONAL_INFO.phone,
    href: `tel:${PERSONAL_INFO.phone.replace(/\s/g, '')}`,
    color: 'secondary',
    description: 'Call for quick alignment or urgent updates.',
    meta: 'GMT 09:00 - 18:00',
    cta: 'Call now',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: 'Chat on WhatsApp',
    href: SOCIAL_LINKS.whatsapp.url,
    color: 'accent',
    description: 'Fastest way to get a response for short questions.',
    meta: 'Avg response ~15m',
    cta: 'Start chat',
    featured: true,
  },
  {
    icon: Github,
    label: 'GitHub',
    value: SOCIAL_LINKS.github.username,
    href: SOCIAL_LINKS.github.url,
    color: 'primary',
    description: 'Browse live experiments, agents, and infrastructure tooling.',
    meta: 'Updated weekly',
    cta: 'View projects',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: SOCIAL_LINKS.linkedin.username,
    href: SOCIAL_LINKS.linkedin.url,
    color: 'secondary',
    description: 'Let’s talk about roles, collaborations, or speaking gigs.',
    meta: 'Active daily',
    cta: 'Connect on LinkedIn',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: PERSONAL_INFO.location,
    href: GOOGLE_MAPS_DUBLIN_URL,
    color: 'accent',
    description: 'Based in Dublin with EU/US overlap and remote availability.',
    meta: 'EU & remote-friendly',
    cta: 'View on map',
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
