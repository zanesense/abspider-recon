import { normalizeUrl } from './apiUtils';
import { fetchWithBypass } from './corsProxy';
import { RequestManager } from './requestManager';

export interface Technology {
  name: string;
  version?: string;
  category: string;
  confidence: number;
  evidence?: string;
}

export interface TechStackResult {
  tested: boolean;
  technologies: Technology[];
  corsMetadata?: any; // From fetchWithBypass
}

const TECHNOLOGY_PATTERNS = {
  // Headers
  'server': { category: 'Web Server', patterns: {
    'nginx': { name: 'Nginx', confidence: 1.0 },
    'apache': { name: 'Apache HTTP Server', confidence: 1.0 },
    'microsoft-iis': { name: 'Microsoft IIS', confidence: 1.0 },
    'cloudflare': { name: 'Cloudflare', category: 'CDN/WAF', confidence: 1.0 },
    'gws': { name: 'Google Web Server', confidence: 1.0 },
    'envoy': { name: 'Envoy Proxy', confidence: 1.0 },
  }},
  'x-powered-by': { category: 'Framework/Language', patterns: {
    'php': { name: 'PHP', confidence: 1.0 },
    'asp.net': { name: 'ASP.NET', confidence: 1.0 },
    'express': { name: 'Express.js', confidence: 1.0 },
    'next.js': { name: 'Next.js', confidence: 1.0 },
    'vercel': { name: 'Vercel', confidence: 1.0 },
  }},
  'x-generator': { category: 'CMS/Generator', patterns: {
    'wordpress': { name: 'WordPress', confidence: 1.0 },
    'joomla': { name: 'Joomla', confidence: 1.0 },
    'drupal': { name: 'Drupal', confidence: 1.0 },
    'shopify': { name: 'Shopify', confidence: 1.0 },
    'wix': { name: 'Wix', confidence: 1.0 },
    'squarespace': { name: 'Squarespace', confidence: 1.0 },
  }},
  'content-type': { category: 'Language', patterns: {
    'php': { name: 'PHP', confidence: 0.5 },
    'asp.net': { name: 'ASP.NET', confidence: 0.5 },
  }},
  'via': { category: 'Proxy/CDN', patterns: {
    'cloudflare': { name: 'Cloudflare', confidence: 0.8 },
    'akamai': { name: 'Akamai', confidence: 0.8 },
    'fastly': { name: 'Fastly', confidence: 0.8 },
  }},
  'cf-ray': { category: 'CDN/WAF', patterns: { '.*': { name: 'Cloudflare', confidence: 1.0 } } },
  'x-cache': { category: 'CDN/Cache', patterns: {
    'cloudflare': { name: 'Cloudflare Cache', confidence: 0.8 },
    'cloudfront': { name: 'AWS CloudFront', confidence: 0.8 },
    'varnish': { name: 'Varnish Cache', confidence: 0.8 },
  }},

  // HTML Body / Meta Tags
  'html_body': { category: 'CMS/Framework/Analytics', patterns: {
    'wp-content': { name: 'WordPress', confidence: 0.9, evidence: 'wp-content directory' },
    'wp-includes': { name: 'WordPress', confidence: 0.9, evidence: 'wp-includes directory' },
    'joomla': { name: 'Joomla', confidence: 0.9, evidence: 'Joomla keyword' },
    'drupal': { name: 'Drupal', confidence: 0.9, evidence: 'Drupal keyword' },
    'shopify': { name: 'Shopify', confidence: 0.9, evidence: 'Shopify keyword' },
    'wix.com': { name: 'Wix', confidence: 0.9, evidence: 'Wix.com domain' },
    'squarespace': { name: 'Squarespace', confidence: 0.9, evidence: 'Squarespace keyword' },
    'react-root': { name: 'React', confidence: 0.7, evidence: 'React root element' },
    'vue-app': { name: 'Vue.js', confidence: 0.7, evidence: 'Vue app element' },
    'angular': { name: 'Angular', confidence: 0.7, evidence: 'Angular attributes' },
    'google-analytics': { name: 'Google Analytics', confidence: 0.9, evidence: 'GA script' },
    'gtm.js': { name: 'Google Tag Manager', confidence: 0.9, evidence: 'GTM script' },
    'font-awesome': { name: 'Font Awesome', confidence: 0.8, evidence: 'Font Awesome CSS' },
    'bootstrap.min.css': { name: 'Bootstrap', confidence: 0.8, evidence: 'Bootstrap CSS' },
    'tailwind.min.css': { name: 'Tailwind CSS', confidence: 0.8, evidence: 'Tailwind CSS' },
  }},
  'meta_generator': { category: 'CMS/Framework', patterns: {
    'wordpress': { name: 'WordPress', confidence: 1.0 },
    'joomla': { name: 'Joomla', confidence: 1.0 },
    'drupal': { name: 'Drupal', confidence: 1.0 },
    'shopify': { name: 'Shopify', confidence: 1.0 },
    'wix': { name: 'Wix', confidence: 1.0 },
    'squarespace': { name: 'Squarespace', confidence: 1.0 },
  }},
  'script_src': { category: 'Library/Framework', patterns: {
    'jquery': { name: 'jQuery', confidence: 0.9 },
    'react.production.min.js': { name: 'React', confidence: 0.9 },
    'vue.min.js': { name: 'Vue.js', confidence: 0.9 },
    'angular.min.js': { name: 'Angular', confidence: 0.9 },
    'gsap.min.js': { name: 'GSAP', confidence: 0.8 },
  }},
};

export const performTechStackFingerprinting = async (target: string, requestManager: RequestManager): Promise<TechStackResult> => {
  console.log(`[Tech Stack] Starting fingerprinting for ${target}`);

  const technologies = new Map<string, Technology>();
  let corsMetadata: any;

  try {
    const url = normalizeUrl(target);
    const { response, metadata } = await fetchWithBypass(url, { timeout: 15000, signal: requestManager.scanController?.signal });
    corsMetadata = metadata;
    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Analyze Headers
    response.headers.forEach((value, key) => {
      const headerKey = key.toLowerCase();
      if (TECHNOLOGY_PATTERNS[headerKey as keyof typeof TECHNOLOGY_PATTERNS]) {
        const patterns = (TECHNOLOGY_PATTERNS[headerKey as keyof typeof TECHNOLOGY_PATTERNS] as any).patterns;
        const category = (TECHNOLOGY_PATTERNS[headerKey as keyof typeof TECHNOLOGY_PATTERNS] as any).category;
        for (const pattern in patterns) {
          if (value.toLowerCase().includes(pattern)) {
            const techInfo = patterns[pattern];
            technologies.set(techInfo.name, {
              name: techInfo.name,
              category: category,
              confidence: techInfo.confidence,
              evidence: `Header '${key}': ${value}`,
            });
          }
        }
      }
    });

    // Analyze HTML Body
    for (const patternKey in TECHNOLOGY_PATTERNS.html_body.patterns) {
      if (lowerHtml.includes(patternKey)) {
        const techInfo = (TECHNOLOGY_PATTERNS.html_body.patterns as any)[patternKey];
        technologies.set(techInfo.name, {
          name: techInfo.name,
          category: TECHNOLOGY_PATTERNS.html_body.category,
          confidence: techInfo.confidence,
          evidence: techInfo.evidence,
        });
      }
    }

    // Analyze Meta Generator
    const metaGeneratorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
    if (metaGeneratorMatch) {
      const generatorContent = metaGeneratorMatch[1].toLowerCase();
      for (const patternKey in TECHNOLOGY_PATTERNS.meta_generator.patterns) {
        if (generatorContent.includes(patternKey)) {
          const techInfo = (TECHNOLOGY_PATTERNS.meta_generator.patterns as any)[patternKey];
          technologies.set(techInfo.name, {
            name: techInfo.name,
            category: TECHNOLOGY_PATTERNS.meta_generator.category,
            confidence: techInfo.confidence,
            evidence: `Meta generator: ${metaGeneratorMatch[1]}`,
          });
        }
      }
    }

    // Analyze Script Sources
    const scriptSrcMatches = html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi);
    for (const match of scriptSrcMatches) {
      const src = match[1].toLowerCase();
      for (const patternKey in TECHNOLOGY_PATTERNS.script_src.patterns) {
        if (src.includes(patternKey)) {
          const techInfo = (TECHNOLOGY_PATTERNS.script_src.patterns as any)[patternKey];
          technologies.set(techInfo.name, {
            name: techInfo.name,
            category: TECHNOLOGY_PATTERNS.script_src.category,
            confidence: techInfo.confidence,
            evidence: `Script src: ${match[1]}`,
          });
        }
      }
    }

    console.log(`[Tech Stack] Found ${technologies.size} technologies for ${target}`);
    return {
      tested: true,
      technologies: Array.from(technologies.values()),
      corsMetadata,
    };

  } catch (error: any) {
    console.error('[Tech Stack] Error during fingerprinting:', error);
    return {
      tested: false,
      technologies: [],
      corsMetadata,
    };
  }
};