import React, { useState } from 'react';
import { ArrowRight, Github, ShieldCheck, Terminal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCachedLandingStats, LandingStats } from '@/services/landingStatsService';

const fmt = (n: number | null) => {
  if (n === null) return '-';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const PKG_MANAGERS = [
  { key: 'npm', label: 'npm', cmd: 'npm install -g abspider' },
  { key: 'yarn', label: 'yarn', cmd: 'yarn global add abspider' },
  { key: 'bun', label: 'bun', cmd: 'bun install -g abspider' },
] as const;

const InstallTabs = () => {
  const [active, setActive] = useState<string>('npm');
  const current = PKG_MANAGERS.find((p) => p.key === active)!;
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(current.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Install CLI</span>
        <div className="flex gap-0.5">
          {PKG_MANAGERS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActive(p.key)}
              className={`cursor-pointer rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                active === p.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between bg-muted/30 px-4 py-2.5 font-mono text-xs">
        <span className="text-foreground">
          <span className="text-muted-foreground">$</span> {current.cmd}
        </span>
        <button
          onClick={handleCopy}
          className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Copy command"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const TERMINAL_LINES = [
  { prefix: '›', text: 'resolving DNS records…', color: 'text-slate-400' },
  { prefix: '✓', text: 'A 93.184.216.34  CNAME www → origin', color: 'text-emerald-400' },
  { prefix: '›', text: 'checking security headers…', color: 'text-slate-400' },
  { prefix: '⚠', text: 'CSP missing  |  HSTS partial', color: 'text-amber-400' },
  { prefix: '✓', text: 'SSL valid - expires 2026-09-14', color: 'text-emerald-400' },
  { prefix: '›', text: 'scanning subdomains via crt.sh…', color: 'text-slate-400' },
  { prefix: '✓', text: '18 hosts found - 3 stale records', color: 'text-emerald-400' },
  { prefix: '⚠', text: 'DMARC policy: none (risk)', color: 'text-amber-400' },
  { prefix: '✓', text: 'report ready - 12 findings', color: 'text-blue-400' },
];

const HeroSection = ({ onOpenLogin }: { onOpenLogin: () => void }) => {
  const [stats, setStats] = React.useState<LandingStats | null>(null);

  React.useEffect(() => {
    let alive = true;
    getCachedLandingStats()
      .then((s) => { if (alive) setStats(s); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const proof = [
    { value: '35', label: 'recon modules' },
    { value: fmt(stats?.repositoryStars ?? null), label: 'GitHub stars' },
    { value: fmt(stats?.monthlyDownloads ?? null), label: 'npm downloads / mo' },
  ];

  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-36">
      {/* Screenshot background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 dark:opacity-20"
        style={{ backgroundImage: "url('/screenshots/runningscan.png')" }}
        aria-hidden="true"
      />
      {/* Vignette: fades screenshot into bg on all four edges + stronger left fade for copy legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'linear-gradient(to right,  hsl(var(--background)) 0%, hsl(var(--background)/0.85) 35%, transparent 65%)',
            'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 20%, transparent 75%, hsl(var(--background)) 100%)',
            'linear-gradient(to left,   hsl(var(--background)) 0%, hsl(var(--background)/0.5) 20%, transparent 55%)',
          ].join(', '),
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Copy */}
          <div data-gsap="hero-copy" className="space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Authorized attack-surface intelligence
            </div>

            {/* Big headline */}
            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Know your{' '}
              <span className="text-gradient">
                exposure
              </span>
              {' '}before attackers do.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              ABSpider gives security teams 35 recon modules - DNS, headers, cloud exposure, injection probes, email posture - with PDF/JSON reports and a full CLI.
            </p>

            {/* Install CLI */}
            <InstallTabs />

            {/* CTA row */}
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onOpenLogin} className="h-12 cursor-pointer px-6 text-base font-semibold shadow-lg shadow-primary/20">
                Start scanning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 cursor-pointer px-6 text-base font-semibold">
                <a href="https://github.com/zanesense/abspider-recon" target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-5 w-5" />
                  View source
                </a>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" />No evasion or bypass</span>
              <span className="flex items-center gap-1.5"><Terminal className="h-4 w-4 text-primary" />GUI and CLI parity</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" />Evidence-first reports</span>
            </div>

            {/* Proof numbers */}
            <div className="flex flex-wrap gap-6 border-t border-border pt-6">
              {proof.map((p) => (
                <div key={p.label}>
                  <div className="text-2xl font-bold text-foreground">{p.value}</div>
                  <div className="text-xs text-muted-foreground">{p.label}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Terminal widget */}
          <div data-gsap="hero-panel" className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-2xl shadow-slate-950/20 dark:shadow-none">
              {/* Window chrome */}
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-xs text-slate-400">abspider example.com --all</span>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  collecting
                </span>
              </div>

              {/* Output lines */}
              <div className="space-y-2 p-5 font-mono text-[13px]">
                {TERMINAL_LINES.map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 w-4 shrink-0 ${line.color}`}>{line.prefix}</span>
                    <span className={line.color}>{line.text}</span>
                  </div>
                ))}
              </div>

              {/* Summary bar */}
              <div className="border-t border-white/10 bg-slate-900/60 px-5 py-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { val: '35', lbl: 'modules run' },
                    { val: '12', lbl: 'findings' },
                    { val: '9s', lbl: 'scan time' },
                  ].map((m) => (
                    <div key={m.lbl}>
                      <div className="text-xl font-bold text-white">{m.val}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{m.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
