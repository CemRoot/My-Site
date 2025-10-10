/**
 * Utility functions for className management
 */

/**
 * Get color-specific Tailwind classes based on variant
 */
export function getColorClasses(color: 'primary' | 'secondary' | 'accent') {
  const colorMap = {
    primary: {
      bg: 'from-primary/20 to-primary/5',
      border: 'border-primary/30',
      text: 'text-primary',
      iconBg: 'from-primary/20 to-primary/5',
      badge: 'bg-primary/20 text-primary border-primary/30',
      glow: 'group-hover:shadow-primary/20',
    },
    secondary: {
      bg: 'from-secondary/20 to-secondary/5',
      border: 'border-secondary/30',
      text: 'text-secondary',
      iconBg: 'from-secondary/20 to-secondary/5',
      badge: 'bg-secondary/20 text-secondary border-secondary/30',
      glow: 'group-hover:shadow-secondary/20',
    },
    accent: {
      bg: 'from-accent/20 to-accent/5',
      border: 'border-accent/30',
      text: 'text-accent',
      iconBg: 'from-accent/20 to-accent/5',
      badge: 'bg-accent/20 text-accent border-accent/30',
      glow: 'group-hover:shadow-accent/20',
    },
  };

  return colorMap[color];
}
