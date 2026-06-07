import React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { History, CheckCircle, Zap, AlertTriangle, StopCircle } from 'lucide-react';
import { Scan } from '@/services/scanService';

interface ScanOverviewCardsProps {
  scans: Scan[];
}

const ScanOverviewCards = ({ scans }: ScanOverviewCardsProps) => {
  const totalScans = scans.length;
  const completedScans = scans.filter(s => s.status === 'completed').length;
  const runningScans = scans.filter(s => s.status === 'running').length;
  const failedScans = scans.filter(s => s.status === 'failed').length;
  const stoppedScans = scans.filter(s => s.status === 'stopped').length; // New: Count stopped scans

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <SurfaceCard color="blue">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Scans</CardTitle>
          <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{totalScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            All time total
          </p>
        </CardContent>
      </SurfaceCard>

      <SurfaceCard color="emerald">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Completed</CardTitle>
          <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{completedScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Successfully finished
          </p>
        </CardContent>
      </SurfaceCard>

      <SurfaceCard color="amber">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Active Scans</CardTitle>
          <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{runningScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Currently scanning
          </p>
        </CardContent>
      </SurfaceCard>

      <SurfaceCard color="rose">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Failed Scans</CardTitle>
          <div className="p-3 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{failedScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            With errors
          </p>
        </CardContent>
      </SurfaceCard>

      <SurfaceCard color="orange">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Stopped Scans</CardTitle>
          <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <StopCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{stoppedScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Manually terminated
          </p>
        </CardContent>
      </SurfaceCard>
    </div>
  );
};

export default ScanOverviewCards;