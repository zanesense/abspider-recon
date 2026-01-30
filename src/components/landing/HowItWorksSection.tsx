import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Search, Zap, FileText, CheckCircle } from 'lucide-react';
import { getCachedLandingStats } from '@/services/landingStatsService';

const HowItWorksSection = () => {
  const [stats, setStats] = React.useState<{avgScanTime: number, dataSourcesCount: number, accuracyRate: number} | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const realStats = await getCachedLandingStats();
        setStats({
          avgScanTime: realStats.avgScanTime,
          dataSourcesCount: realStats.dataSourcesCount,
          accuracyRate: realStats.accuracyRate
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({
          avgScanTime: 45,
          dataSourcesCount: 15,
          accuracyRate: 99.9
        });
      }
    };
    loadStats();
  }, []);
  const steps = [
    {
      step: '01',
      icon: Search,
      title: 'Enter Target Domain',
      description: 'Simply input the domain or URL you want to analyze. Our system supports single domains, subdomains, and IP addresses.',
      color: 'blue'
    },
    {
      step: '02',
      icon: Zap,
      title: 'Automated Scanning',
      description: 'Our advanced algorithms perform comprehensive reconnaissance using multiple data sources and scanning techniques.',
      color: 'cyan'
    },
    {
      step: '03',
      icon: FileText,
      title: 'Detailed Analysis',
      description: 'Get comprehensive results including subdomains, technologies, vulnerabilities, and security recommendations.',
      color: 'emerald'
    },
    {
      step: '04',
      icon: CheckCircle,
      title: 'Export & Monitor',
      description: 'Export detailed reports in PDF format and set up continuous monitoring for ongoing security assessment.',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'from-blue-500/5 via-blue-500/10 to-blue-500/5',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/20'
      },
      cyan: {
        gradient: 'from-cyan-500 to-cyan-600',
        bg: 'from-cyan-500/5 via-cyan-500/10 to-cyan-500/5',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500/20'
      },
      emerald: {
        gradient: 'from-emerald-500 to-emerald-600',
        bg: 'from-emerald-500/5 via-emerald-500/10 to-emerald-500/5',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20'
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'from-purple-500/5 via-purple-500/10 to-purple-500/5',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/20'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Get comprehensive web intelligence in four simple steps. 
            Our automated platform handles the complexity while you focus on the insights.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 via-emerald-500/20 to-purple-500/20 transform -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color);
              
              return (
                <div key={index} className="relative">
                  <Card className={`group relative overflow-hidden bg-gradient-to-br ${colors.bg} backdrop-blur-sm border ${colors.border} hover:shadow-xl transition-all duration-500 hover:-translate-y-2`}>
                    <CardContent className="p-8 text-center space-y-6">
                      {/* Step Number */}
                      <div className="relative">
                        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-white font-bold text-lg">{step.step}</span>
                        </div>
                        {/* Pulse Effect */}
                        <div className={`absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${colors.gradient} opacity-20 animate-pulse`} />
                      </div>

                      {/* Icon */}
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${colors.gradient} bg-opacity-10 inline-block group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`h-8 w-8 ${colors.text}`} />
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>

                    {/* Hover Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  </Card>

                  {/* Arrow - Desktop Only */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className="w-6 h-6 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-emerald-500/5 border border-blue-500/10">
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                &lt; {stats?.avgScanTime || 45}s
              </div>
              <div className="text-xs text-muted-foreground">Average Scan Time</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                {stats?.dataSourcesCount || 15}+
              </div>
              <div className="text-xs text-muted-foreground">Data Sources</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                {stats?.accuracyRate || 99.9}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;