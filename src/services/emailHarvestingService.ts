import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const COMMON_PAGES = ['', '/about', '/contact', '/team', '/support', '/privacy', '/terms', '/careers', '/blog'];

export interface EmailEntry {
  email: string;
  source: string;
  context: string;
}

export interface EmailHarvestingResult {
  emails: EmailEntry[];
  totalEmails: number;
  uniqueDomains: string[];
}

const extractEmails = (text: string, source: string): EmailEntry[] => {
  const found = new Map<string, { email: string; source: string; context: string }>();
  const matches = text.matchAll(EMAIL_REGEX);

  for (const m of matches) {
    const email = m[0].toLowerCase();
    const ignored = ['example.com', 'domain.com', 'your@email', '@email.com', '@test.com', '@localhost'];
    if (ignored.some(i => email.includes(i))) continue;
    if (email.length > 50) continue;

    const start = Math.max(0, m.index - 40);
    const ctx = text.substring(start, m.index + email.length + 40).replace(/\s+/g, ' ').trim();

    if (!found.has(email)) {
      found.set(email, { email, source, context: ctx.substring(0, 120) });
    }
  }

  return Array.from(found.values());
};

export const performEmailHarvesting = async (target: string, requestManager: RequestManager): Promise<EmailHarvestingResult> => {
  const domain = extractDomain(target);
  console.log(`[Email Harvesting] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const allEmails = new Map<string, EmailEntry>();

  // Check robots.txt first
  try {
    const robotsResponse = await requestManager.fetch(`${baseUrl}/robots.txt`, { timeout: 8000 });
    if (robotsResponse.status === 200) {
      const text = await robotsResponse.text();
      extractEmails(text, 'robots.txt').forEach(e => allEmails.set(e.email, e));
    }
  } catch { /* ignore */ }

  // Scan common pages
  for (const page of COMMON_PAGES.slice(0, 5)) {
    try {
      const pageUrl = `${baseUrl}${page}`;
      const response = await requestManager.fetch(pageUrl, { timeout: 10000 });
      if (response.status !== 200) continue;

      const html = await response.text();
      // Strip tags to get text
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

      // Check mailto: links
      const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
      let m;
      while ((m = mailtoRegex.exec(html)) !== null) {
        const email = m[1].toLowerCase();
        if (!allEmails.has(email)) {
          allEmails.set(email, { email, source: `${page} (mailto:)`, context: '' });
        }
      }

      extractEmails(text, page || '/').forEach(e => allEmails.set(e.email, e));
    } catch { /* ignore */ }
  }

  const emails = Array.from(allEmails.values());
  const uniqueDomains = [...new Set(emails.map(e => e.email.split('@')[1]).filter(Boolean))];

  return {
    emails,
    totalEmails: emails.length,
    uniqueDomains,
  };
};
