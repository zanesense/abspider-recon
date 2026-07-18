import { z } from 'zod';

const settingsImportSchema = z.object({
  settings: z.object({ discordWebhook: z.string(), proxyList: z.string() }).optional(),
  apiKeys: z.object({
    shodan: z.string().optional(),
    virustotal: z.string().optional(),
    securitytrails: z.string().optional(),
    builtwith: z.string().optional(),
    opencage: z.string().optional(),
  }).optional(),
}).refine(value => value.settings || value.apiKeys, 'No supported settings found');

export const parseSettingsImport = (value: string) => settingsImportSchema.parse(JSON.parse(value));
