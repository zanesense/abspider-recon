import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('React documentation content', () => {
  it('bundles every migrated article', () => {
    const directory = resolve(process.cwd(), 'src/content/docs');
    const articles = readdirSync(directory).filter((name) => name.endsWith('.html'));

    expect(articles).toHaveLength(11);
    articles.forEach((name) => expect(readFileSync(resolve(directory, name), 'utf8')).toContain('<article class="article">'));
  });
});
