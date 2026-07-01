import { Heart, Mail } from 'lucide-react';
import { Github, Linkedin } from './icons/brand-icons';
import { Link } from 'react-router-dom';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../lib/constants/personal';

const FOOTER_SOCIAL_LINKS = [
  { icon: Github, href: SOCIAL_LINKS.github.url, label: 'GitHub' },
  { icon: Linkedin, href: SOCIAL_LINKS.linkedin.url, label: 'LinkedIn' },
  { icon: Mail, href: `mailto:${PERSONAL_INFO.email}`, label: 'Email' },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 overflow-hidden px-4 sm:px-6 lg:px-8 border-t border-white/5">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo */}


          {/* Social Links */}
          <div className="flex items-center gap-4">
            {FOOTER_SOCIAL_LINKS.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="group p-3 rounded-xl bg-background/30 border border-white/5 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              );
            })}
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link 
              to="/terms" 
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Terms & Conditions
            </Link>
            <span className="text-white/10">•</span>
            <Link 
              to="/privacy-policy" 
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              Made with <Heart className="w-4 h-4 text-primary fill-primary" /> by {PERSONAL_INFO.name}
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} All rights reserved. {PERSONAL_INFO.location} 🇮🇪
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
