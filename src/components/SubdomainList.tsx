import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ExternalLink } from 'lucide-react';

interface SubdomainListProps {
  subdomains: string[];
}

const SubdomainList = ({ subdomains }: SubdomainListProps) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="h-5 w-5 text-cyan-400" />
          Discovered Subdomains ({subdomains.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subdomains.map((subdomain, index) => (
            <a
              key={index}
              href={`https://${subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-800 px-4 py-3 rounded-lg hover:bg-slate-750 transition-colors group"
            >
              <span className="text-slate-300 font-mono text-sm group-hover:text-cyan-400 transition-colors">
                {subdomain}
              </span>
              <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubdomainList;