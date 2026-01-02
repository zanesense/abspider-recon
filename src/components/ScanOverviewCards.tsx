import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Scans</CardTitle>
          <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{totalScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            All time total
          </p>
        </CardContent>
      </Card>
      
      <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-emerald-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Completed</CardTitle>
          <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{completedScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Successfully finished
          </p>
        </CardContent>
      </Card>
      
      <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-yellow-500/10 to-orange-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Active Scans</CardTitle>
          <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{runningScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Currently scanning
          </p>
        </CardContent>
      </Card>
      
      <Card className="group relative overflow-hidden bg-gradient-to-br from-rose-500/5 via-red-500/10 to-pink-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Failed Scans</CardTitle>
          <div className="p-3 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{failedScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            With errors
          </p>
        </CardContent>
      </Card>
      
      <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500/5 via-amber-500/10 to-orange-500/5 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Stopped Scans</CardTitle>
          <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <StopCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{stoppedScans}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Manually terminated
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanOverviewCards;