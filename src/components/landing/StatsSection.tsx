import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, GitFork, PackageCheck, ShieldAlert, Star } from 'lucide-react';
import { getCachedLandingStats, LandingStats } from '@/services/landingStatsService';

gsap.registerPlugin(ScrollTrigger);

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
};

const StatsSection = () => {
  const [stats, setStats] = React.useState<LandingStats | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    getCachedLandingStats()
      .then((s) => { if (alive) setStats(s); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Animate counters when they enter viewport
  useEffect(() => {
    if (!stats) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const counters = sectionRef.current?.querySelectorAll<HTMLElement>('[data-count]');
    counters?.forEach((el) => {
      const target = Number(el.dataset.count);
      gsap.fromTo(
        el,
        { innerText: 0 },
        {
          innerText: target,
          duration: 1.6,
          ease: 'power2.out',
          snap: { innerText: 1 },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate() {
            el.innerText = fmt(Math.round(Number(el.innerText)));
          },
          onComplete() {
            el.innerText = fmt(target);
          },
        }
      );
    });
  }, [stats]);

  const metrics = [
    { icon: Star, label: 'GitHub stars', value: stats?.repositoryStars ?? null, source: 'github.com' },
    { icon: GitFork, label: 'Repository forks', value: stats?.repositoryForks ?? null, source: 'github.com' },
    { icon: PackageCheck, label: 'CLI downloads / mo', value: stats?.monthlyDownloads ?? null, source: 'npmjs.com' },
    { icon: ShieldAlert, label: 'Recorded findings', value: stats?.totalFindings ?? null, source: 'supabase' },
  ];

  return (
    <section id="stats" ref={sectionRef} className="landing-section bg-muted/40 py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div className="landing-reveal space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Activity className="h-4 w-4" />
              Live public metrics
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Numbers you can verify, not vanity stats.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Pulled directly from GitHub and npm APIs on each page load. If a source is unavailable the page says so rather than showing stale data.
            </p>
          </div>

          {/* Metric cards */}
          <div data-gsap="stagger-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="landing-card rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <m.icon className="h-5 w-5 text-primary" />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{m.source}</span>
                </div>
                <div className="mt-5">
                  {m.value !== null ? (
                    <span data-count={m.value} className="text-3xl font-bold text-foreground">
                      {fmt(m.value)}
                    </span>
                  ) : (
                    <span className="text-3xl font-bold text-muted-foreground">-</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
