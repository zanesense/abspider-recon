import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  BookOpen,
  Boxes,
  Braces,
  ExternalLink,
  FileOutput,
  GitBranch,
  Menu,
  Network,
  Rocket,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';

import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import ModernLogin from '@/components/ModernLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import overview from '@/content/docs/index.html?raw';
import gettingStarted from '@/content/docs/getting-started.html?raw';
import modules from '@/content/docs/modules.html?raw';
import architecture from '@/content/docs/architecture.html?raw';
import cli from '@/content/docs/cli.html?raw';
import configuration from '@/content/docs/configuration.html?raw';
import reports from '@/content/docs/reports.html?raw';
import deployment from '@/content/docs/deployment.html?raw';
import apiReference from '@/content/docs/api-reference.html?raw';
import security from '@/content/docs/security.html?raw';
import troubleshooting from '@/content/docs/troubleshooting.html?raw';

const PAGES = [
  { slug: '', label: 'Overview', source: overview, icon: BookOpen, files: ['README.md', 'package.json'] },
  { slug: 'getting-started', label: 'Getting started', source: gettingStarted, icon: Rocket, files: ['README.md', '.env.example'] },
  { slug: 'modules', label: 'Recon modules', source: modules, icon: Boxes, files: ['src/services/scanService.ts', 'packages/cli/scripts/abspider-cli.mjs'] },
  { slug: 'architecture', label: 'Architecture', source: architecture, icon: Network, files: ['src/App.tsx', 'src/services/scanService.ts', 'backend/main.py'] },
  { slug: 'cli', label: 'CLI reference', source: cli, icon: Terminal, files: ['packages/cli/scripts/abspider-cli.mjs', 'packages/cli/README.md'] },
  { slug: 'configuration', label: 'Configuration', source: configuration, icon: Settings, files: ['.env.example', 'src/services/settingsService.ts'] },
  { slug: 'reports', label: 'Reports', source: reports, icon: FileOutput, files: ['src/services/reportService.ts', 'src/utils/reportUtils.ts'] },
  { slug: 'deployment', label: 'Deployment', source: deployment, icon: Server, files: ['vercel.json', 'docker-compose.yml', 'nginx.conf'] },
  { slug: 'api-reference', label: 'API reference', source: apiReference, icon: Braces, files: ['backend/main.py', 'supabase/migrations'] },
  { slug: 'security', label: 'Security & legal', source: security, icon: ShieldCheck, files: ['SECURITY.md', 'src/components/LegalDisclaimer.tsx'] },
  { slug: 'troubleshooting', label: 'Troubleshooting', source: troubleshooting, icon: Wrench, files: ['README.md', 'backend/main.py'] },
] as const;

const articleHtml = (source: string) => {
  const document = new DOMParser().parseFromString(source, 'text/html');
  const article = document.querySelector('article.article');

  article?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const match = href.match(/^([^#]+)\.html(#.*)?$/);
    if (!match) return;
    const slug = match[1] === 'index' ? '' : match[1];
    link.setAttribute('href', `/docs${slug ? `/${slug}` : ''}${match[2] || ''}`);
  });

  return DOMPurify.sanitize(article?.innerHTML || '<h1>Documentation unavailable</h1>');
};

const DocsPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
  const page = PAGES.find((item) => item.slug === slug);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const html = useMemo(() => page ? articleHtml(page.source) : '', [page]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (location.pathname === '/docs/') return <Navigate to="/docs" replace />;

  const visiblePages = PAGES.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader onOpenLogin={() => setLoginOpen(true)} />
      <main className="surface-main pt-24">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-primary" /> Documentation
            </div>
            <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
              {menuOpen ? <X className="mr-2 h-4 w-4" /> : <Menu className="mr-2 h-4 w-4" />}
              Contents
            </Button>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className={cn('lg:sticky lg:top-24 lg:block', menuOpen ? 'block' : 'hidden')}>
              <div className="mb-4 hidden items-center gap-2 text-sm font-semibold lg:flex">
                <BookOpen className="h-4 w-4 text-primary" /> Documentation
              </div>
              <label className="relative block">
                <span className="sr-only">Filter documentation</span>
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter pages…" className="pl-9" />
              </label>
              <nav aria-label="Documentation" className="mt-4 space-y-1 border-l border-border pl-3">
                {visiblePages.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/docs${item.slug ? `/${item.slug}` : ''}`}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground',
                      item.slug === slug ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <item.icon className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>

            {page ? (
              <div className="min-w-0">
                <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                      <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />
                      Repository sources
                    </div>
                    <div className="flex max-w-2xl flex-wrap gap-1.5">
                      {page.files.map((file) => <code key={file} className="rounded bg-muted px-2 py-1 text-xs text-foreground">{file}</code>)}
                    </div>
                  </div>
                  <a
                    href="https://deepwiki.com/zanesense/abspider-recon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    DeepWiki reference <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
                <article className="docs-article" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ) : (
              <div className="py-20 text-center">
                <h1 className="text-2xl font-bold">Documentation page not found</h1>
                <Button asChild className="mt-6"><Link to="/docs">Back to documentation</Link></Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <LandingFooter />
      <BackToTop />
      <ModernLogin open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default DocsPage;
