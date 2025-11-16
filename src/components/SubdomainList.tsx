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
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="h-5 w-5 text-cyan-400" />
            Discovered Subdomains (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">No subdomains discovered</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Network className="h-5 w-5 text-cyan-400" />
          Discovered Subdomains ({subdomainArray.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(sources).map(([sourceName, count]) => (
            <div key={sourceName} className="bg-slate-800 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm text-slate-400 capitalize">{sourceName.replace('crtsh', 'crt.sh')}</span>
              <span className="text-white font-medium">{count}</span>
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
              className="flex items-center justify-between bg-slate-800 px-4 py-3 rounded-lg hover:bg-slate-750 transition-colors group"
            >
              <span className="text-white font-mono text-sm group-hover:text-cyan-400 transition-colors">
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