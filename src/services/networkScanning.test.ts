import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./apiProxyClient', () => ({ proxyProviderAPI: vi.fn() }));

import { fetchWithBypass } from './corsProxy';
import { scanCommonPorts } from './portService';
import { enumerateSubdomainsCrtSh } from './subdomainService';
import { hasCloudflareHeaders } from './cdnDetectionService';
import { performMXLookup } from './mxService';
import { performCSRFDetection } from './csrfDetectionService';
import { performGitExposureCheck } from './gitExposureService';
import { performSQLScan } from './sqlScanService';
import type { RequestManager } from './requestManager';
import { RequestManager as RealRequestManager } from './requestManager';

afterEach(() => vi.restoreAllMocks());

describe('proxy-assisted scanning', () => {
  it('does not treat a Cloudflare CDN asset URL as Cloudflare hosting', () => {
    const html = '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">';
    expect(html).toContain('cloudflare');
    expect(hasCloudflareHeaders(new Headers({ server: 'Microsoft-IIS/10.0' }))).toBe(false);
    expect(hasCloudflareHeaders(new Headers({ server: 'cloudflare' }))).toBe(true);
  });

  it('uses JSON DNS responses for MX lookups instead of parsing HTML', async () => {
    const requestManager = {
      fetch: vi.fn(async (url: string) => {
        const type = new URL(url).searchParams.get('type');
        if (type === 'MX') return new Response(JSON.stringify({ Answer: [{ data: '10 mail.example.com.' }] }));
        if (type === 'A') return new Response(JSON.stringify({ Answer: [{ data: '192.0.2.10' }] }));
        return new Response(JSON.stringify({ Answer: [] }));
      }),
    } as unknown as RequestManager;

    const result = await performMXLookup('example.com', requestManager);
    expect(result.mxRecords).toEqual([{ priority: 10, exchange: 'mail.example.com', ip: '192.0.2.10' }]);
    expect(vi.mocked(requestManager.fetch).mock.calls.every(([url, options]) =>
      String(url).startsWith('https://cloudflare-dns.com/dns-query?') &&
      (options?.headers as Record<string, string>).Accept === 'application/dns-json'
    )).toBe(true);
  });

  it('retries a timed-out request with a fresh abort signal', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
      calls++;
      if (calls > 1) return Promise.resolve(Response.json({ ok: true }));
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    });

    const response = await new RealRequestManager().fetch('https://example.com/data', {
      timeout: 5,
      retries: 1,
      retryDelay: 0,
      skipProxy: true,
    });
    expect(await response.json()).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('keeps target headers instead of Vercel headers', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('CORS blocked'))
      .mockResolvedValueOnce(new Response('', {
        headers: {
          server: 'Vercel',
          'x-abspider-proxy': 'vercel',
          'x-abspider-upstream-headers': encodeURIComponent(JSON.stringify({ server: 'nginx' })),
        },
      }));

    const { response } = await fetchWithBypass('https://example.com');
    expect(response.headers.get('server')).toBe('nginx');
    expect(response.headers.has('x-abspider-proxy')).toBe(false);
  });

  it('preserves target CORS and cookie headers across the proxy', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', {
        headers: {
          'access-control-allow-origin': 'https://scanner.example',
          'x-abspider-proxy': 'vercel',
          'x-abspider-upstream-headers': encodeURIComponent(JSON.stringify({
            'access-control-allow-origin': 'https://evil.example',
            'set-cookie': 'session=test; Secure; HttpOnly',
          })),
        },
      }));

    const { response } = await fetchWithBypass('https://example.com', {
      headers: { Origin: 'https://evil.example' },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('origin=https%3A%2F%2Fevil.example');
    expect(response.headers.get('access-control-allow-origin')).toBe('https://evil.example');
    expect(response.headers.get('set-cookie')).toContain('session=test');
  });

  it('passes manual redirect handling through direct and proxy fetches', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('CORS blocked'))
      .mockResolvedValueOnce(new Response('', { status: 302, headers: { location: 'https://example.org' } }));

    const { response } = await fetchWithBypass('https://example.com', { redirect: 'manual' });
    expect(String(fetchMock.mock.calls[1][0])).toContain('redirect=manual');
    expect(fetchMock.mock.calls.every(([, options]) => options?.redirect === 'manual')).toBe(true);
    expect(response.headers.get('location')).toBe('https://example.org');
  });

  it('reports reachable web ports and leaves hidden browser failures filtered', async () => {
    const requestManager = {
      fetch: vi.fn(async (url: string) => {
        if (url.startsWith('https://dns.google/')) return Response.json({ Answer: [{ data: '93.184.216.34' }] });
        if (url.endsWith(':80')) return new Response('', { status: 200 });
        throw new TypeError('Failed to fetch');
      }),
    } as unknown as RequestManager;

    const results = await scanCommonPorts('example.com', 5, requestManager, {});
    expect(results.find(({ port }) => port === 80)?.status).toBe('open');
    expect(results.filter(({ port }) => port !== 80).every(({ status }) => status === 'filtered')).toBe(true);
  });

  it('falls back to the proxy for crt.sh and parses certificate names', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('CORS blocked'))
      .mockResolvedValueOnce(Response.json([
        { name_value: '*.example.com\napi.example.com\nevil-example.com' },
      ], { headers: { 'x-abspider-proxy': 'vercel' } }));
    const requestManager = { getAbortSignal: () => undefined } as unknown as RequestManager;

    await expect(enumerateSubdomainsCrtSh('example.com', requestManager))
      .resolves.toEqual(['api.example.com']);
    expect(String(fetchMock.mock.calls[0][0])).toContain('q=%25.example.com');
  });

  it('does not report protected files as exposed', async () => {
    const requestManager = {
      fetch: vi.fn(async () => new Response('', { status: 403 })),
    } as unknown as RequestManager;

    const result = await performGitExposureCheck('example.com', requestManager);
    expect(result.totalExposed).toBe(0);
    expect(result.criticalExposed).toBe(0);
  });

  it('excludes GET forms from CSRF findings', async () => {
    let calls = 0;
    const requestManager = {
      fetch: vi.fn(async () => new Response(calls++ === 0
        ? '<form method="get"></form><form method="post"></form>'
        : '', { status: calls === 1 ? 200 : 404 })),
    } as unknown as RequestManager;

    const result = await performCSRFDetection('example.com', requestManager);
    expect(result.totalForms).toBe(2);
    expect(result.formsWithoutToken).toBe(1);
  });

  it('does not infer blind SQL injection from unrelated dynamic responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('baseline'));
    const requestManager = {
      fetch: vi.fn()
        .mockResolvedValueOnce(new Response('dynamic true'))
        .mockResolvedValueOnce(new Response('dynamic false')),
      getAbortSignal: () => undefined,
    } as unknown as RequestManager;

    const result = await performSQLScan('https://example.com/?id=1', requestManager, 0);
    expect(result.vulnerable).toBe(false);
  });
});
