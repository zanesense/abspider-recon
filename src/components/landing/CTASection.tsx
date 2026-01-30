import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, CheckCircle, Star } from 'lucide-react';
import { getCachedLandingStats } from '@/services/landingStatsService';

const CTASection = () => {
  const [userCount, setUserCount] = React.useState<number>(1250);

  React.useEffect(() => {
    const loadUserCount = async () => {
      try {
        const stats = await getCachedLandingStats();
        setUserCount(stats.totalUsers);
      } catch (error) {
        console.error('Failed to load user count:', error);
      }
    };
    loadUserCount();
  }, []);
  const benefits = [
    'Start scanning in under 30 seconds',
    'No credit card required for free tier',
    'Access to all core features',
    'Export detailed PDF reports'
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <Star className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Join 100+ Security Professionals
            </span>
          </div>
        </div>

        {/* Main Heading */}
        <div className="space-y-6 mb-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="block text-foreground">Ready to Uncover</span>
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Hidden Intelligence?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Start your first comprehensive web reconnaissance scan today. 
            Discover what others can't see in just minutes.
          </p>
        </div>

        {/* Benefits List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/10"
            >
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30 px-8 py-6 text-lg font-semibold group transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
          >
            <Link to="/login">
              <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Start Free Scan Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="px-8 py-6 text-lg font-semibold border-2 hover:bg-muted/50 group transition-all duration-300"
          >
            View Live Demo
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Trusted by cybersecurity teams
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-500/20 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-3 h-3 bg-cyan-500/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-emerald-500/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-10 w-2 h-2 bg-purple-500/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>
    </section>
  );
};

export default CTASection;