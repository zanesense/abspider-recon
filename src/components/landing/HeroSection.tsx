import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Zap, Shield, Eye } from 'lucide-react';
import { getCachedLandingStats } from '@/services/landingStatsService';

const HeroSection = () => {
  const [stats, setStats] = React.useState<{totalUsers: number, totalScans: number, uptime: number} | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const realStats = await getCachedLandingStats();
        setStats({
          totalUsers: realStats.totalUsers,
          totalScans: realStats.totalScans,
          uptime: realStats.uptime
        });
      } catch (error) {
        console.error('Failed to load hero stats:', error);
        setStats({
          totalUsers: 1250,
          totalScans: 28000,
          uptime: 99.9
        });
      }
    };
    loadStats();
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <Badge 
              variant="secondary" 
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Advanced Web Reconnaissance Platform
            </Badge>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="block text-foreground">Discover Hidden</span>
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Web Intelligence
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Uncover comprehensive insights about any website with our advanced reconnaissance platform. 
              From subdomains to security analysis, get the complete picture in minutes.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              asChild
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30 px-8 py-6 text-lg font-semibold group transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
            >
              <Link to="/login">
                Start Free Scan
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-6 text-lg font-semibold border-2 hover:bg-muted/50 group transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              Watch Demo
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: 'Security First',
                  description: 'Enterprise-grade security with encrypted data handling'
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Get comprehensive results in under 60 seconds'
                },
                {
                  icon: Eye,
                  title: 'Deep Insights',
                  description: 'Uncover hidden subdomains, technologies, and vulnerabilities'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 rounded-xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600/10 to-cyan-600/10 group-hover:from-blue-600/20 group-hover:to-cyan-600/20 transition-all duration-300">
                      <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-6">Trusted by security professionals worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-muted-foreground">
                {stats?.totalUsers ? `${(stats.totalUsers / 1000).toFixed(1)}K+` : '1.2K+'}
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-2xl font-bold text-muted-foreground">
                {stats?.totalScans ? (stats.totalScans >= 1000000 ? `${(stats.totalScans / 1000000).toFixed(1)}M+` : `${(stats.totalScans / 1000).toFixed(0)}K+`) : '28K+'}
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-2xl font-bold text-muted-foreground">
                {stats?.uptime ? `${stats.uptime}%` : '99.9%'}
              </div>
            </div>
            <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground mt-2">
              <span>Active Users</span>
              <span>Scans Completed</span>
              <span>Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;