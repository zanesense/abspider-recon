import { Activity, Cloud, Code2, Database, FileText, MailCheck, Network, ShieldCheck } from 'lucide-react';

const BENTO = [
  {
    icon: Network,
    title: 'Perimeter mapping',
    body: 'DNS, MX, subnet, subdomains via crt.sh, CDN/cloud detection, reverse IP, robots.txt, broken links.',
    span: 'md:col-span-2',
    accent: 'bg-blue-500/8 border-blue-500/15 dark:bg-blue-500/6',
  },
  {
    icon: ShieldCheck,
    title: 'Exploitability checks',
    body: 'SQLi, XSS, LFI, open redirect, CORS, GraphQL exposure, CSRF gaps, rate-limit behavior.',
    span: '',
    accent: 'bg-rose-500/8 border-rose-500/15 dark:bg-rose-500/6',
  },
  {
    icon: Cloud,
    title: 'Cloud & repo exposure',
    body: 'S3 bucket discovery, .git/.env file exposure, cookie flag audits, JavaScript secret extraction.',
    span: '',
    accent: 'bg-amber-500/8 border-amber-500/15 dark:bg-amber-500/6',
  },
  {
    icon: Code2,
    title: 'Stack fingerprinting',
    body: 'Tech detection, WordPress signals, CVE matching on detected versions, SSL/TLS cert analysis.',
    span: '',
    accent: 'bg-violet-500/8 border-violet-500/15 dark:bg-violet-500/6',
  },
  {
    icon: MailCheck,
    title: 'Email posture',
    body: 'SPF, DKIM, DMARC analysis with security scoring. MX record discovery and priority mapping.',
    span: 'md:col-span-2',
    accent: 'bg-teal-500/8 border-teal-500/15 dark:bg-teal-500/6',
  },
];

const EVIDENCE = [
  { icon: Activity, label: 'Adaptive pacing', body: 'Smart scan controls reduce load automatically when errors or latency rise.' },
  { icon: Database, label: 'Persisted history', body: 'Authenticated scans save structured results via Supabase with row-level security.' },
  { icon: FileText, label: 'Export-ready', body: 'PDF, DOCX, and JSON reports built in - no extra tooling needed.' },
];

const FeaturesSection = () => (
  <section id="features" className="landing-section bg-background py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="landing-reveal mb-16 max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Coverage engine</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Investigation-grade coverage, not a checkbox sheet.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          ABSpider organises 35 modules into discovery, exploitability, exposure, and fingerprinting - so you move from map to proof to fix without context-switching.
        </p>
      </div>

      {/* Bento grid */}
      <div data-gsap="stagger-grid" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {BENTO.map((card) => (
          <div
            key={card.title}
            className={`landing-card rounded-2xl border p-6 ${card.span} ${card.accent}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      {/* Evidence strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {EVIDENCE.map((item) => (
          <div key={item.label} className="landing-card flex gap-4 rounded-2xl border border-border bg-muted/30 p-5">
            <div className="shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
