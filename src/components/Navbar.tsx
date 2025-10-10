import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import coinLogo from 'figma:asset/5a044018a2d01618456d3b6a76d961bdd5099599.png';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3'
          : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Liquid Glass Container */}
        <div className="relative liquid-glow">
          {/* Animated glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-2xl transition-opacity duration-300 ${
            isScrolled ? 'opacity-100' : 'opacity-0'
          }`} />
          
          {/* Glass Background */}
          <div className={`relative rounded-2xl border transition-all duration-300 liquid-shimmer ${
            isScrolled 
              ? 'liquid-glass-strong neon-border-primary' 
              : 'bg-transparent border-transparent'
          }`}>
            <div className="flex items-center justify-between px-6 py-4">
              {/* Logo - CK Coin */}
              <a href="#" className="group flex items-center space-x-3">
                <div className="w-12 h-12 relative" style={{ perspective: '2000px' }}>
                  <div 
                    className="w-full h-full relative transition-all duration-700 ease-out group-hover:scale-110"
                    style={{
                      transformStyle: 'preserve-3d',
                      animation: 'coinFlip 6s ease-in-out infinite',
                    }}
                  >
                    {/* Coin Image */}
                    <img
                      src={coinLogo}
                      alt="CK Coin"
                      className="w-full h-full object-cover rounded-full"
                      style={{
                        filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.5)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6)) brightness(1.1) contrast(1.15)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    
                    {/* Metallic glow overlay */}
                    <div 
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)',
                        mixBlendMode: 'overlay',
                        animation: 'glowPulse 3s ease-in-out infinite',
                      }}
                    />
                    
                    {/* Rotating accent ring */}
                    <div 
                      className="absolute inset-0 rounded-full border-2 opacity-0 pointer-events-none"
                      style={{
                        display: 'none',
                      }}
                    />
                  </div>
                  
                  <style>{`
                    @keyframes coinFlip {
                      0%, 100% {
                        transform: rotateY(0deg) rotateX(0deg);
                      }
                      25% {
                        transform: rotateY(180deg) rotateX(5deg);
                      }
                      50% {
                        transform: rotateY(360deg) rotateX(0deg);
                      }
                      75% {
                        transform: rotateY(540deg) rotateX(-5deg);
                      }
                    }
                    
                    @keyframes glowPulse {
                      0%, 100% {
                        opacity: 0.6;
                      }
                      50% {
                        opacity: 1;
                      }
                    }
                    
                    @keyframes rotate {
                      from {
                        transform: rotate(0deg);
                      }
                      to {
                        transform: rotate(360deg);
                      }
                    }
                  `}</style>
                </div>
                <span 
                  className="hidden sm:block font-[Space_Grotesk] text-[16px] tracking-wider font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #5BE7FF 0%, #A78BFA 50%, #FFB86C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 8px rgba(91, 231, 255, 0.3))',
                  }}
                >
                  CEM KOYLUOGLU
                </span>
              </a>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-primary/20 px-6 py-4 space-y-2 bg-background/95">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-3 rounded-xl text-sm text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 liquid-shimmer border border-transparent hover:border-primary/30"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
