import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { BookOpen, Menu, Search, X } from 'lucide-react';

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
  { slug: '', label: 'Overview', source: overview },
  { slug: 'getting-started', label: 'Getting started', source: gettingStarted },
  { slug: 'modules', label: 'Recon modules', source: modules },
  { slug: 'architecture', label: 'Architecture', source: architecture },
  { slug: 'cli', label: 'CLI reference', source: cli },
  { slug: 'configuration', label: 'Configuration', source: configuration },
  { slug: 'reports', label: 'Reports', source: reports },
  { slug: 'deployment', label: 'Deployment', source: deployment },
  { slug: 'api-reference', label: 'API reference', source: apiReference },
  { slug: 'security', label: 'Security & legal', source: security },
  { slug: 'troubleshooting', label: 'Troubleshooting', source: troubleshooting },
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

  return article?.innerHTML || '<h1>Documentation unavailable</h1>';
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
    setMenuOpen(false);
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
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground',
                      item.slug === slug ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>

            {page ? (
              <article className="docs-article min-w-0" dangerouslySetInnerHTML={{ __html: html }} />
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
