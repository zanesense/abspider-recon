import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ExternalLink } from 'lucide-react';
import { SubdomainResult } from '@/services/subdomainService'; // Import SubdomainResult

interface SubdomainListProps {
  subdomains: SubdomainResult; // Now expects the full object
}

const SubdomainList = ({ subdomains }: SubdomainListProps) => {
  const subdomainArray = subdomains.subdomains || []; // Access the array from the object
  const sources = subdomains.sources || {}; // Access the sources from the object

  if (!Array.isArray(subdomainArray) || subdomainArray.length === 0) {
    return (
      <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Network className="h-5 w-5 text-primary" />
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
    <Card className="bg-card border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Network className="h-5 w-5 text-primary" />
          Discovered Subdomains ({subdomainArray.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(sources).map(([sourceName, count]) => (
            <div key={sourceName} className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground capitalize">{sourceName.replace('crtsh', 'crt.sh')}</span>
              <span className="text-foreground font-medium">{count}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subdomainArray.map((subdomain, index) => (
            <a
              key={index}
              href={`https://${subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-muted px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="flex-1 min-w-0 text-foreground font-mono text-sm group-hover:text-primary transition-colors break-all">
                {subdomain}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground/70 group-hover:text-primary transition-colors ml-2 flex-shrink-0" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubdomainList;