import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Info } from 'lucide-react';
import CORSBypassIndicator from './CORSBypassIndicator';
import { TechStackResult } from '@/services/techStackService';

interface TechStackInfoProps {
  techStack: TechStackResult;
}

const TechStackInfo = ({ techStack }: TechStackInfoProps) => {
  if (!techStack.tested || techStack.technologies.length === 0) {
    return (
      <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Fingerprint className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Technology Stack Fingerprinting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No technologies detected or scan not performed.</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'web server': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'cms/framework':
      case 'framework/language': return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'cdn/waf':
      case 'cdn/cache': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'analytics': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'library/framework': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  return (
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Fingerprint className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Technology Stack Fingerprinting ({techStack.technologies.length})
          </CardTitle>
          <CORSBypassIndicator metadata={techStack.corsMetadata} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {techStack.technologies.map((tech, index) => (
            <div key={index} className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{tech.name}</span>
                <Badge className={getCategoryColor(tech.category)}>
                  {tech.category}
                </Badge>
              </div>
              {tech.version && (
                <p className="text-sm text-muted-foreground">Version: {tech.version}</p>
              )}
              {tech.evidence && (
                <div className="mt-1 flex items-start gap-2 text-xs">
                  <Info className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-muted-foreground">{tech.evidence}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TechStackInfo;