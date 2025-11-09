import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink } from 'lucide-react';
import { Scan } from '@/services/scanService';

interface RecentScansProps {
  scans: Scan[];
}

const RecentScans = ({ scans }: RecentScansProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'running': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Recent Scans</CardTitle>
        <CardDescription className="text-slate-400">
          Latest reconnaissance activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scans.map((scan) => (
            <Link
              key={scan.id}
              to={`/scan/${scan.id}`}
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                    {scan.target}
                  </h4>
                  <Badge className={getStatusColor(scan.status)}>
                    {scan.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(scan.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Link>
          ))}
          
          {scans.length === 0 && (
            <p className="text-center text-slate-500 py-8">No scans yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentScans;