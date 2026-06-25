import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileCheck, Lock, Scale, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import ModernLogin from '@/components/ModernLogin';

type LegalPageKind = 'terms' | 'privacy';

interface LegalPageProps {
  kind: LegalPageKind;
}

const TERMS_SECTIONS = [
  {
    title: 'Authorized Use',
    body: 'ABSpider is provided for defensive reconnaissance, security validation, research, and education on systems you own or have explicit written permission to test.',
  },
  {
    title: 'User Responsibility',
    body: 'You are responsible for target authorization, scan configuration, traffic volume, payload selection, data handling, and compliance with laws, contracts, platform rules, and bug bounty scopes.',
  },
  {
    title: 'Prohibited Activity',
    body: 'Do not use ABSpider to disrupt services, bypass access controls, exfiltrate data, attack third-party systems, or run scans outside approved scope.',
  },
  {
    title: 'No Warranty',
    body: 'Results are provided as technical evidence and may be incomplete, delayed, or affected by target defenses, browser restrictions, API limits, and network conditions.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: 'Data You Provide',
    body: 'The dashboard stores account, settings, and scan history data needed to operate the product experience. Targets, results, and reports are tied to your authenticated workspace.',
  },
  {
    title: 'Security Signals',
    body: 'Scans may collect HTTP headers, DNS records, certificate metadata, public links, and other evidence returned by the target or configured third-party APIs.',
  },
  {
    title: 'Third-Party Services',
    body: 'Supabase, configured API providers, browser networking, and optional proxy infrastructure may process requests required for authentication, persistence, and scanner modules.',
  },
  {
    title: 'Your Controls',
    body: 'You can delete scan records from the dashboard, manage API keys in settings, avoid optional integrations, and export reports only when you choose to do so.',
  },
];

const PAGE_COPY: Record<LegalPageKind, {
  badge: string;
  title: string;
  description: string;
  icon: typeof Scale;
  sections: typeof TERMS_SECTIONS;
}> = {
  terms: {
    badge: 'Terms of use',
    title: 'Use ABSpider only for authorized security work.',
    description: 'These terms define acceptable use for the ABSpider dashboard, CLI, scanner modules, reports, and documentation.',
    icon: Scale,
    sections: TERMS_SECTIONS,
  },
  privacy: {
    badge: 'Privacy policy',
    title: 'Privacy practices for scan data and account records.',
    description: 'This policy explains what ABSpider processes while you use the dashboard and how control stays with your workspace.',
    icon: Lock,
    sections: PRIVACY_SECTIONS,
  },
};

const commitments = [
  { icon: ShieldCheck, label: 'Permission-first scanning' },
  { icon: FileCheck, label: 'Inspectable evidence' },
  { icon: Lock, label: 'Workspace-scoped records' },
];

const LegalPage = ({ kind }: LegalPageProps) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const copy = PAGE_COPY[kind];
  const Icon = copy.icon;

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader onOpenLogin={() => setLoginOpen(true)} />
      <main className="surface-main pt-28">
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild className="cursor-pointer gap-1.5 text-muted-foreground">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                ABSpider
              </Link>
            </Button>
            <Badge variant="outline" className="border-primary/20 bg-primary/8 text-primary">
              Updated June 2026
            </Badge>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
              <div className="relative max-w-3xl">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="mb-4 border-border bg-background/70 text-muted-foreground">
                  {copy.badge}
                </Badge>
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  {copy.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  {copy.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {commitments.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {copy.sections.map((section) => (
              <section key={section.title} className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold tracking-tight text-foreground">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-muted/40 p-6">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Contact</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Questions about these policies, responsible disclosure, or abuse reports can be sent to{' '}
              <a href="mailto:defnotsaim@proton.me" className="font-medium text-primary hover:underline">
                defnotsaim@proton.me
              </a>
              . For security guidance, review the documentation and security policy before running active scans.
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
      <BackToTop />
      <ModernLogin open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default LegalPage;
