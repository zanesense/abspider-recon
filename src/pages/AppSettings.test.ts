import { describe, expect, it } from 'vitest';
import { parseSettingsImport } from '@/services/settingsImportService';

describe('settings import', () => {
  it('accepts supported values and rejects unsupported-only files', () => {
    expect(parseSettingsImport('{"settings":{"discordWebhook":"","proxyList":"http://proxy.test"}}').settings?.proxyList)
      .toBe('http://proxy.test');
    expect(() => parseSettingsImport('{"settings":{"language":"en"}}')).toThrow();
  });
});
