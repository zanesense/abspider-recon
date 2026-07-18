import { describe, expect, it } from 'vitest';

import { performOpenRedirectCheck } from './openRedirectService';

const managerFor = (location: string) => ({
  fetch: async () => new Response('', { status: 404, headers: { location } }),
});

describe('open redirect detection', () => {
  it('accepts only the controlled test origin, not a URL containing it', async () => {
    const confirmed = await performOpenRedirectCheck('https://target.test', managerFor('https://example.com/path') as never);
    const embedded = await performOpenRedirectCheck('https://target.test', managerFor('https://evil.test/https://example.com') as never);

    expect(confirmed.vulnerableCount).toBe(15);
    expect(embedded.vulnerableCount).toBe(0);
  });
});
