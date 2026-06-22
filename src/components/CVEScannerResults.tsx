import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, Bug, Shield } from 'lucide-react';
import { CVEScannerResult } from '@/services/cveScannerService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { cveScanner?: CVEScannerResult; isTested: boolean; moduleError?: string }

const severityColor = (s: string) => {
  if (s === 'Critical') return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
  if (s === 'High') return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
  if (s === 'Medium') return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
  return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
};

const CVEScannerResults = ({ cveScanner, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!cveScanner;

  const content = !cveScanner ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No CVE scan data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      {!cveScanner.techStackFound ? (
        <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">Could not detect any technologies to cross-reference against CVEs.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Techs Checked</p><p className="text-lg font-bold text-foreground">{cveScanner.techStackChecked.length}</p></div>
            <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">CVEs Matched</p><p className={`text-lg font-bold ${cveScanner.totalFound > 0 ? 'text-red-500' : 'text-green-500'}`}>{cveScanner.totalFound}</p></div>
          </div>
          {cveScanner.techStackChecked.length > 0 && (
            <div className="flex flex-wrap gap-1">{cveScanner.techStackChecked.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}</div>
          )}
          {cveScanner.totalFound > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {cveScanner.totalFound} known CVE(s) match the detected technologies.</p></div>}
          {cveScanner.matches.map((cve, i) => (
            <div key={i} className="bg-muted rounded-lg p-3 space-y-1 border-l-4 border-red-500">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                <p className="text-sm font-mono font-medium text-foreground">{cve.cveId}</p>
                <Badge className={severityColor(cve.severity)}>{cve.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{cve.description}</p>
              <p className="text-xs text-muted-foreground">{cve.technology}{cve.version ? ` ${cve.version}` : ''}</p>
            </div>
          ))}
          {cveScanner.totalFound === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No known CVEs matched the detected technologies.</p></div>}
        </>
      )}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="CVE Scanner" icon={Shield} iconColorClass={hasData && cveScanner!.totalFound > 0 ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="CVE scan was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default CVEScannerResults;
