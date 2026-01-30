import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Server, 
  Eye, 
  CheckCircle, 
  Clock,
  Globe,
  Zap
} from 'lucide-react';

const TrustSection = () => {
  const trustFeatures = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 Type II compliant with end-to-end encryption and zero-trust architecture.',
      features: ['256-bit AES encryption', 'Multi-factor authentication', 'Regular security audits'],
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/5 via-emerald-500/10 to-teal-500/5'
    },
    {
      icon: Server,
      title: 'Infrastructure Reliability',
      description: '99.9% uptime SLA with global CDN and redundant systems across multiple regions.',
      features: ['Global edge locations', 'Auto-scaling infrastructure', '24/7 monitoring'],
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/5 via-blue-500/10 to-cyan-500/5'
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description: 'Your data stays private. We never store sensitive information or share results with third parties.',
      features: ['Zero data retention', 'Anonymous scanning', 'GDPR compliant'],
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/5 via-purple-500/10 to-pink-500/5'
    }
  ];

  const certifications = [
    { name: 'SOC 2 Type II', status: 'Certified' },
    { name: 'ISO 27001', status: 'Compliant' },
    { name: 'GDPR', status: 'Compliant' },
    { name: 'CCPA', status: 'Compliant' }
  ];

  const metrics = [
    {
      icon: Clock,
      value: '99.9%',
      label: 'Uptime SLA',
      description: 'Guaranteed availability'
    },
    {
      icon: Globe,
      value: '15+',
      label: 'Global Regions',
      description: 'Worldwide coverage'
    },
    {
      icon: Zap,
      value: '<2s',
      label: 'Response Time',
      description: 'Lightning fast API'
    },
    {
      icon: CheckCircle,
      value: '24/7',
      label: 'Support',
      description: 'Always available'
    }
  ];

  return (
    <section id="security" className="py-24 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Security & Reliability
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Built for
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Enterprise Trust
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Security isn't an afterthought—it's built into every layer of our platform. 
            Trust the same infrastructure used by Fortune 500 companies.
          </p>
        </div>

        {/* Trust Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {trustFeatures.map((feature, index) => (
            <Card 
              key={index}
              className={`group relative overflow-hidden bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
            >
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <CardContent className="relative z-10 p-8 space-y-6">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-8 w-8 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`} />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Feature List */}
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle className={`h-4 w-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent flex-shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              {/* Hover Effect Border */}
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${feature.gradient} p-[1px]`}>
                <div className="w-full h-full rounded-lg bg-background" />
              </div>
            </Card>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="group text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="inline-flex p-3 rounded-lg bg-gradient-to-r from-blue-600/10 to-cyan-600/10 group-hover:scale-110 transition-transform duration-300">
                  <metric.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {metric.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-8">
            Compliance & Certifications
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {certifications.map((cert, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {cert.name} {cert.status}
              </Badge>
            ))}
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            Audited by leading security firms and compliant with international standards
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;