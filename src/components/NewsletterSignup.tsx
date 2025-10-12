import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';

/**
 * Newsletter Signup Component
 * Allows users to subscribe to tech news updates via email
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accepted) {
      toast.error('Please accept the Terms and Conditions');
      return;
    }

    setIsSubscribing(true);

    try {
      // Call newsletter API endpoint
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Successfully subscribed!', {
          description: 'You will receive tech news updates in your inbox.',
        });
        setEmail('');
        setAccepted(false);
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Newsletter Subscribe Card */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        
        {/* Main card */}
        <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Subtle background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl sm:rounded-3xl" />
          <div className="absolute inset-0 liquid-glass border border-white/5" />

          {/* Content */}
          <div className="relative space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl">Subscribe to Newsletter</h2>
                  <p className="text-sm text-muted-foreground">Get weekly tech insights</p>
                </div>
              </div>
            </div>

            {/* Subscribe Form */}
            <form onSubmit={handleSubscribe} className="space-y-4">
              {/* Email Input */}
              <div className="relative group/input">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 sm:h-14 bg-background/60 border border-primary/20 focus:border-primary/40 rounded-xl text-sm sm:text-base px-4 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-xl bg-primary/0 group-focus-within/input:bg-primary/5 blur-lg transition-all duration-300 -z-10 pointer-events-none" />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-background/40 border border-white/5">
                <Checkbox
                  id="terms"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  className="mt-0.5 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor="terms"
                  className="text-xs sm:text-sm leading-relaxed text-muted-foreground cursor-pointer flex-1"
                >
                  I agree to the{' '}
                  <Link 
                    to="/terms" 
                    className="text-primary hover:underline"
                  >
                    Terms
                  </Link>
                  {' '}and{' '}
                  <Link 
                    to="/privacy-policy" 
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Subscribe Button */}
              <Button
                type="submit"
                disabled={isSubscribing}
                className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-black rounded-xl text-sm sm:text-base transition-all duration-300"
              >
                {isSubscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>

              {/* Footer */}
              <p className="text-xs text-center text-muted-foreground pt-1">
                Join 1,200+ subscribers · Weekly updates
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
