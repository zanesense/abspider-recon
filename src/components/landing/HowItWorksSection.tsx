import { FileText, Gauge, Search, SlidersHorizontal } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Scope the target',
    body: 'Enter a domain or URL. Choose passive-only, active checks, or custom module selection based on your authorization.',
  },
  {
    num: '02',
    icon: SlidersHorizontal,
    title: 'Tune intensity',
    body: 'Set payload budgets, thread count, proxy routing, and scan mode: conservative, adaptive, or aggressive.',
  },
  {
    num: '03',
    icon: Gauge,
    title: 'Collect evidence',
    body: 'The scanner captures response codes, headers, DNS records, exposed files, and module-specific proof points.',
  },
  {
    num: '04',
    icon: FileText,
    title: 'Report and act',
    body: 'Results are structured for review, export as PDF/DOCX/JSON, security grading, and repeat scans over time.',
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="landing-section surface-main py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="landing-reveal mb-20 max-w-xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Workflow</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Accountable recon in four steps.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Designed so every action stays within your authorization boundary and every finding has clear evidence behind it.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connector line (desktop) */}
        <div
          className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          aria-hidden="true"
        />

        <div data-gsap="stagger-grid" className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.num} className="landing-card relative flex flex-col gap-5">
              {/* Step icon + number */}
              <div className="relative flex h-20 items-start">
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border bg-background shadow-sm">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute right-0 top-0 font-mono text-4xl font-black text-border">{step.num}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLI callout */}
      <div className="landing-reveal mt-14 overflow-hidden rounded-2xl border border-border bg-muted/40 dark:bg-slate-950">
        <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">CLI - same 35 modules, no browser required</p>
            <div className="space-y-2 font-mono text-sm text-foreground">
              <p><span className="text-muted-foreground">$</span> npx abspider example.com --all --mode adaptive</p>
              <p><span className="text-muted-foreground">$</span> abspider example.com --modules dns,sslTls,cors --output report.json</p>
            </div>
          </div>
          <div className="flex items-center border-t border-border bg-muted/30 px-8 lg:border-l lg:border-t-0">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Node.js ≥ 20</span><br />
              No Supabase session required
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
