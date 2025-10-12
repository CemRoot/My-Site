import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!accepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setLoading(true);

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
        setSubscribed(true);
        toast.success('Successfully subscribed! 🎉');
        setEmail('');
        setAccepted(false);
        
        // Reset after 3 seconds
        setTimeout(() => setSubscribed(false), 3000);
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-background/80 shadow-[0_25px_80px_-35px_rgba(32,118,255,0.45)] backdrop-blur">
        <div className="pointer-events-none absolute -top-24 right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-secondary/25 blur-3xl" />

        <div className="relative space-y-8 p-8 sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/40 flex items-center justify-center">
                <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Weekly digest
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">
                  Stay updated with curated tech news
                </h2>
                <p className="text-sm text-muted-foreground">
                  One concise email each week covering AI breakthroughs, product launches, and industry analysis.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:text-sm">
              <div className="rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-center">
                <p className="font-semibold text-foreground">5,000+</p>
                <p>Subscribers</p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-center">
                <p className="font-semibold text-foreground">No spam</p>
                <p>Cancel anytime</p>
              </div>
            </div>
          </div>

          {subscribed ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Subscription confirmed!
                </p>
                <p className="text-xs text-emerald-300/80">
                  We’ve sent a welcome email with the latest edition. See you in your inbox.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group/input">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-primary/25 bg-input-background/90 pr-16 text-base transition-all group-hover/input:border-primary/40 focus:border-primary/50"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <Checkbox
                  id="terms"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  disabled={loading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed text-muted-foreground cursor-pointer"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                  {' '}and understand that I can unsubscribe at any time.
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={loading || !accepted}
                  className="w-full sm:w-auto h-14 rounded-2xl bg-primary text-black text-base font-semibold shadow-[0_18px_45px_-20px_rgba(32,118,255,0.65)] transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-[0_25px_55px_-25px_rgba(32,118,255,0.75)] disabled:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
                <p className="w-full text-center text-xs text-muted-foreground sm:text-left sm:text-sm sm:w-auto">
                  Curated every Monday. Zero fluff, just the need-to-know stories.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
