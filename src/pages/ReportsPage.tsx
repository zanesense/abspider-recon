import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getScanHistory } from '@/services/scanService';
import { generatePdfReport } from '@/services/reportService'; // Corrected import name
import AppHeader from '@/components/AppHeader';

const Reports = () => {
  const { data: scans = [] } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
  });

  const completedScans = scans.filter(s => s.status === 'completed');

  return (
    <div className="flex flex-col h-full w-full">
      <AppHeader
        title="Reports"
        subtitle="Download and manage scan reports"
      />

      <main className="flex-1 overflow-auto p-6 surface-main">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-4">
            {completedScans.map((scan) => (
              <Card key={scan.id} className="bg-card border-border transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground">{scan.target}</CardTitle>
                      <CardDescription className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(scan.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => generatePdfReport(scan)} // Corrected function call
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>Scan ID: {scan.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.config.headers && <span className="px-2 py-1 bg-muted rounded text-xs">Headers</span>}
                      {scan.config.whois && <span className="px-2 py-1 bg-muted rounded text-xs">WHOIS</span>}
                      {scan.config.subdomains && <span className="px-2 py-1 bg-muted rounded text-xs">Subdomains</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {completedScans.length === 0 && (
              <Card className="bg-card border-border transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No reports available yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Complete a scan to generate reports</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;