import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  Shield, 
  Zap, 
  Eye, 
  Lock, 
  Activity,
  Search,
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Globe,
      title: 'Subdomain Discovery',
      description: 'Uncover hidden subdomains using advanced enumeration techniques with 15+ data sources including DNS brute-forcing and certificate transparency logs.',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/5 via-blue-500/10 to-cyan-500/5'
    },
    {
      icon: Shield,
      title: 'Security Analysis',
      description: 'Comprehensive vulnerability scanning including SQL injection, XSS, LFI, CORS misconfigurations, and SSL/TLS security assessment.',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/5 via-emerald-500/10 to-teal-500/5'
    },
    {
      icon: Search,
      title: 'Technology Stack Detection',
      description: 'Identify frameworks, libraries, servers, CMS platforms, and analytics tools powering any website with advanced fingerprinting.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/5 via-purple-500/10 to-pink-500/5'
    },
    {
      icon: Activity,
      title: 'Port & Service Scanning',
      description: 'Scan common ports, detect running services, and identify potential attack vectors with intelligent service fingerprinting.',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/5 via-orange-500/10 to-red-500/5'
    },
    {
      icon: FileText,
      title: 'Detailed Reports',
      description: 'Generate comprehensive PDF reports with security grades, actionable insights, and executive summaries for stakeholders.',
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-500/5 via-indigo-500/10 to-blue-500/5'
    },
    {
      icon: Zap,
      title: 'Smart Scanning',
      description: 'Adaptive scanning with intelligent throttling, proxy rotation, and performance optimization for reliable results.',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-500/5 via-yellow-500/10 to-orange-500/5'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Powerful Features for
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Complete Reconnaissance
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Everything you need to gather comprehensive intelligence about any web target, 
            from basic enumeration to advanced security analysis.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`group relative overflow-hidden bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
            >
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.gradient} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-foreground transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>

              {/* Hover Effect Border */}
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${feature.gradient} p-[1px]`}>
                <div className="w-full h-full rounded-lg bg-background" />
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              New features added monthly
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;