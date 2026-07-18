import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('React documentation content', () => {
  it('bundles every migrated article', () => {
    const directory = resolve(process.cwd(), 'src/content/docs');
    const articles = readdirSync(directory).filter((name) => name.endsWith('.html'));

    expect(articles).toHaveLength(11);
    articles.forEach((name) => {
      const source = readFileSync(resolve(directory, name), 'utf8');
      expect(source).toContain('<article class="article">');
      expect(source).not.toMatch(/[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u);

      const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);

      for (const table of source.matchAll(/<table[\s\S]*?<\/table>/g)) {
        const widths = [...table[0].matchAll(/<tr[\s\S]*?<\/tr>/g)]
          .map((row) => (row[0].match(/<(?:th|td)\b/g) || []).length);
        expect(new Set(widths).size).toBeLessThanOrEqual(1);
      }
    });

    const moduleRows = readFileSync(resolve(directory, 'modules.html'), 'utf8')
      .match(/<h2 id="at-a-glance">[\s\S]*?<\/table>/)?.[0]
      .match(/<tr>/g)?.length;
    expect(moduleRows).toBe(36); // one header plus 35 modules
  });
});
