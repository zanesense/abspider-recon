import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, CheckCircle, Zap, AlertTriangle } from 'lucide-react';
import { Scan } from '@/services/scanService';

interface ScanOverviewCardsProps {
  scans: Scan[];
}

const ScanOverviewCards = ({ scans }: ScanOverviewCardsProps) => {
  const totalScans = scans.length;
  const completedScans = scans.filter(s => s.status === 'completed').length;
  const runningScans = scans.filter(s => s.status === 'running').length;
  const failedScans = scans.filter(s => s.status === 'failed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-card/50 backdrop-blur-sm border border-primary/30 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">Total Scans</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalScans}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm border border-green-500/30 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-400">Completed Scans</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{completedScans}</div>
          <p className="text-xs text-muted-foreground">Successfully finished</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm border border-yellow-500/30 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-400">Running Scans</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{runningScans}</div>
          <p className="text-xs text-muted-foreground">Currently active</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm border border-red-500/30 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-400">Failed Scans</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{failedScans}</div>
          <p className="text-xs text-muted-foreground">With errors</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanOverviewCards;