import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./apiProxyClient', () => ({ proxyProviderAPI: vi.fn() }));

import { fetchWithBypass } from './corsProxy';
import { scanCommonPorts } from './portService';
import { enumerateSubdomainsCrtSh } from './subdomainService';
import type { RequestManager } from './requestManager';

afterEach(() => vi.restoreAllMocks());

describe('proxy-assisted scanning', () => {
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
});
