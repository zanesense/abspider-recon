import { ArrowRight, BookOpen, Github, LockKeyhole, ScrollText, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRUST = [
  { icon: LockKeyhole, title: 'Authorization-first', body: 'Scan language and CLI framing enforce authorized testing at every step.' },
  { icon: Github, title: 'Open source', body: 'Scanner logic, payloads, and reporting code are fully inspectable on GitHub.' },
  { icon: ScrollText, title: 'Evidence over guesswork', body: 'Every finding includes response status, exposed paths, and module-specific detail.' },
];

const CTASection = ({ onOpenLogin }: { onOpenLogin: () => void }) => (
  <section id="security" className="landing-section bg-background py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Trust trio */}
      <div className="landing-reveal mb-20">
        <div className="mb-10 max-w-xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Trust model</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Professional by being precise about what we do.
          </h2>
        </div>
        <div data-gsap="stagger-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="landing-card rounded-2xl border border-border bg-muted/25 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 text-base font-bold text-foreground">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Big CTA banner */}
      <div className="landing-reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-cyan-600 p-px">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-primary/90 via-blue-600/90 to-cyan-600/90 px-8 py-14 text-white sm:px-12 sm:py-16">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-white/8 blur-3xl" aria-hidden="true" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium">
                <Terminal className="h-4 w-4" />
                GUI and CLI - same coverage target
              </div>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Start with a scoped scan.<br />Keep the evidence.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-blue-100">
                ABSpider is strongest as a repeatable first-pass recon system: document what exists, confirm what's exposed, and hand clear remediation notes to the people who own the service.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={onOpenLogin}
                  className="h-12 cursor-pointer bg-white px-6 text-base font-bold text-primary hover:bg-white/90 shadow-lg">
                  Open scanner
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 cursor-pointer border-white/30 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <a href="https://www.npmjs.com/package/abspider" target="_blank" rel="noreferrer">
                    Install CLI
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="h-12 cursor-pointer px-6 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="/docs/">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Read the docs
                  </a>
                </Button>
              </div>
            </div>

            {/* Side stats */}
            <div className="hidden flex-col gap-4 lg:flex">
              {[
                { val: '35', lbl: 'recon modules' },
                { val: 'MIT', lbl: 'open source license' },
                { val: '100%', lbl: 'browser-side scanning' },
              ].map((s) => (
                <div key={s.lbl} className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur-sm">
                  <div className="text-3xl font-black text-white">{s.val}</div>
                  <div className="mt-1 text-xs font-medium text-blue-100">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
