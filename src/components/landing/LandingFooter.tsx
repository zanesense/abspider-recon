import { Link } from 'react-router-dom';
import { Bug, Github, Linkedin, Mail, Twitter } from 'lucide-react';
import StatusIndicator from '@/components/StatusIndicator';

const LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'CLI package', href: 'https://www.npmjs.com/package/abspider', ext: true },
    { label: 'Changelog', href: 'https://github.com/zanesense/abspider-recon/blob/main/CHANGELOG.md', ext: true },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs/', static: true },
    { label: 'Status', href: '/status' },
    { label: 'Security policy', href: 'https://github.com/zanesense/abspider-recon/blob/main/SECURITY.md', ext: true },
    { label: 'Issue tracker', href: 'https://github.com/zanesense/abspider-recon/issues', ext: true },
  ],
  Legal: [
    { label: 'MIT License', href: 'https://github.com/zanesense/abspider-recon/blob/main/LICENSE', ext: true },
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms of use', href: '/terms' },
  ],
};

const SOCIALS = [
  { icon: Github, href: 'https://github.com/zanesense/abspider-recon', label: 'GitHub' },
  { icon: Twitter, href: 'https://twitter.com/ihatesaim', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/in/saaimaly', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:defnotsaim@proton.me', label: 'Email' },
];

const LandingFooter = () => (
  <footer className="border-t border-border bg-muted/40 text-muted-foreground dark:bg-slate-950 dark:text-slate-400">
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div className="col-span-2 space-y-5 md:col-span-1">
          <Link to="/" className="group inline-flex items-center gap-2.5">
            <Bug className="h-6 w-6 text-primary transition-transform duration-200 group-hover:scale-110" />
            <span className="text-base font-bold text-foreground">ABSpider</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed">
            Web reconnaissance for authorized security work - GUI and CLI coverage built around inspectable evidence.
          </p>
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-foreground/5 transition-colors duration-150 hover:bg-foreground/10 hover:text-foreground"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([col, items]) => (
          <div key={col} className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">{col}</h3>
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item.label}>
                  {'static' in item && item.static ? (
                    <a
                      href={item.href}
                      className="cursor-pointer text-sm transition-colors duration-150 hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ) : 'ext' in item && item.ext ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-sm transition-colors duration-150 hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="cursor-pointer text-sm transition-colors duration-150 hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
        <p className="text-sm">© {new Date().getFullYear()} ABSpider. MIT License.</p>
        <div className="flex items-center gap-5 text-sm">
          <span>Use only on assets you own or have written permission to test.</span>
          <Link to="/status" className="cursor-pointer">
            <StatusIndicator size="sm" />
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
