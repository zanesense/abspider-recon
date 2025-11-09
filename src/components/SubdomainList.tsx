import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ExternalLink } from 'lucide-react';

interface SubdomainListProps {
  subdomains: string[] | { subdomains: string[] };
}

const SubdomainList = ({ subdomains }: SubdomainListProps) => {
  // Handle both array and object formats
  const subdomainArray = Array.isArray(subdomains) 
    ? subdomains 
    : (subdomains?.subdomains || []);

  if (!Array.isArray(subdomainArray) || subdomainArray.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan-500" />
            Discovered Subdomains (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No subdomains discovered</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-cyan-500" />
          Discovered Subdomains ({subdomainArray.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subdomainArray.map((subdomain, index) => (
            <a
              key={index}
              href={`https://${subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-muted px-4 py-3 rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <span className="text-foreground font-mono text-sm group-hover:text-primary transition-colors">
                {subdomain}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubdomainList;