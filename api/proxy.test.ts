import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dns from 'node:dns/promises';
import handler, { isSSRFTarget } from './proxy';

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

  it('sends upstream HTML as bytes instead of JSON-serializing the buffer', async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<title>Target Site</title>', {
      headers: { server: 'Microsoft-IIS/10.0', 'content-type': 'text/html' },
    }));
    const send = vi.fn();
    const response = { status: vi.fn(), setHeader: vi.fn(), send, end: vi.fn() };

    await handler({
      method: 'GET',
      query: { url: 'https://example.com' },
      headers: {},
      socket: { remoteAddress: '203.0.113.1' },
    }, response);

    expect(Buffer.isBuffer(send.mock.calls[0][0])).toBe(true);
    expect(send.mock.calls[0][0].toString()).toBe('<title>Target Site</title>');
    expect(response.setHeader).toHaveBeenCalledWith('X-ABSpider-Upstream-Server', 'Microsoft-IIS/10.0');
  });
});
