import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getScanHistory } from '@/services/scanService';
import { generatePDFReport } from '@/services/reportService';

const Reports = () => {
  const { data: scans = [] } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
  });

  const completedScans = scans.filter(s => s.status === 'completed');

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl"> {/* Updated background */}
        <SidebarTrigger className="text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Download and manage scan reports</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"> {/* Updated background */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-4">
            {completedScans.map((scan) => (
              <Card key={scan.id} className="bg-card border-border"> {/* Updated background and border */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground">{scan.target}</CardTitle>
                      <CardDescription className="text-muted-foreground flex items-center gap-2 mt-1"> {/* Updated text color */}
                        <Calendar className="h-3 w-3" />
                        {new Date(scan.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => generatePDFReport(scan)}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground"> {/* Updated text color */}
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>Scan ID: {scan.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.config.headers && <span className="px-2 py-1 bg-muted rounded text-xs">Headers</span>} {/* Updated background */}
                      {scan.config.whois && <span className="px-2 py-1 bg-muted rounded text-xs">WHOIS</span>} {/* Updated background */}
                      {scan.config.subdomains && <span className="px-2 py-1 bg-muted rounded text-xs">Subdomains</span>} {/* Updated background */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {completedScans.length === 0 && (
              <Card className="bg-card border-border"> {/* Updated background and border */}
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" /> {/* Updated text color */}
                  <p className="text-muted-foreground">No reports available yet</p> {/* Updated text color */}
                  <p className="text-sm text-muted-foreground/70 mt-1">Complete a scan to generate reports</p> {/* Updated text color */}
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