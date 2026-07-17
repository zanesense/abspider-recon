import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dns from 'node:dns/promises';
import handler, { createPinnedLookup, isSSRFTarget } from './proxy';
import { parseProviderUrl } from './keys/proxy';

vi.mock('node:dns/promises', () => ({
  default: { lookup: vi.fn() },
}));

describe('proxy SSRF validation', () => {
  beforeEach(() => vi.mocked(dns.lookup).mockReset());
  afterEach(() => vi.restoreAllMocks());

  it('allows public DNS results and blocks private or unresolved targets', async () => {
    vi.mocked(dns.lookup).mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }]);
    await expect(isSSRFTarget(new URL('https://example.com'))).resolves.toBe(false);

    vi.mocked(dns.lookup).mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
    await expect(isSSRFTarget(new URL('https://example.com'))).resolves.toBe(true);

    vi.mocked(dns.lookup).mockRejectedValueOnce(new Error('ENOTFOUND'));
    await expect(isSSRFTarget(new URL('https://missing.invalid'))).resolves.toBe(true);
  });

  it('returns the pinned address in Node multi-address lookup mode', async () => {
    const lookup = createPinnedLookup('93.184.216.34', 4);
    await expect(new Promise((resolve, reject) => lookup('example.com', { all: true }, (error, addresses) =>
      error ? reject(error) : resolve(addresses)
    ))).resolves.toEqual([{ address: '93.184.216.34', family: 4 }]);
  });

  it('restricts authenticated provider requests to the configured HTTPS host', () => {
    expect(parseProviderUrl('shodan', 'https://api.shodan.io/api-info').hostname).toBe('api.shodan.io');
    expect(() => parseProviderUrl('shodan', 'http://api.shodan.io/api-info')).toThrow();
    expect(() => parseProviderUrl('shodan', 'https://internal.example/api-info')).toThrow();
  });

  it('sends upstream HTML as bytes instead of JSON-serializing the buffer', async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const fetchTarget = vi.fn().mockResolvedValue(new Response('<title>Target Site</title>', {
      headers: { server: 'Microsoft-IIS/10.0', 'content-type': 'text/html' },
    }));
    const send = vi.fn();
    const response = { status: vi.fn(), setHeader: vi.fn(), send, end: vi.fn() };

    await handler({
      method: 'GET',
      query: { url: 'https://example.com' },
      headers: {},
      socket: { remoteAddress: '203.0.113.1' },
    }, response, fetchTarget);

    expect(fetchTarget.mock.calls[0][0].address).toBe('93.184.216.34');
    expect(Buffer.isBuffer(send.mock.calls[0][0])).toBe(true);
    expect(send.mock.calls[0][0].toString()).toBe('<title>Target Site</title>');
    expect(response.setHeader).toHaveBeenCalledWith('X-ABSpider-Upstream-Server', 'Microsoft-IIS/10.0');
  });
});
