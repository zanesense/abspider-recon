import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const CSRF_TOKEN_NAMES = [
  'csrf_token', 'csrf', '_csrf', '_token', 'token', 'csrf-token',
  'csrfToken', 'authenticity_token', 'auth_token', 'xsrf-token',
  '__RequestVerificationToken', 'csrfmiddlewaretoken', '_csrf_token',
  'nonce', '_wpnonce', 'wp_nonce',
];

const FORM_REGEX = /<form[\s\S]*?<\/form>/gi;
const INPUT_REGEX = /<input[\s\S]*?\/?>/gi;
const ATTR_REGEX = /(\w+)\s*=\s*"([^"]*)"/g;

export interface FormInput {
  name: string;
  type: string;
}

export interface FormAnalysis {
  action: string;
  method: string;
  hasCSRFToken: boolean;
  inputs: FormInput[];
  tokenField?: string;
}

export interface CSRFDetectionResult {
  forms: FormAnalysis[];
  totalForms: number;
  formsWithoutToken: number;
}

const parseForm = (formHtml: string): FormAnalysis => {
  const actionMatch = formHtml.match(/action\s*=\s*"([^"]*)"/i);
  const methodMatch = formHtml.match(/method\s*=\s*"([^"]*)"/i);

  const form: FormAnalysis = {
    action: actionMatch ? actionMatch[1] : '(no action)',
    method: methodMatch ? methodMatch[1].toUpperCase() : 'GET',
    hasCSRFToken: false,
    inputs: [],
  };

  const inputMatches = formHtml.matchAll(INPUT_REGEX);
  for (const inputMatch of inputMatches) {
    const attrs: Record<string, string> = {};
    let attrMatch;
    const attrRegex = /(\w+)\s*=\s*"([^"]*)"/g;
    while ((attrMatch = attrRegex.exec(inputMatch[0])) !== null) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2];
    }

    const name = attrs['name'] || '';
    const type = attrs['type'] || 'text';
    const hidden = type === 'hidden';

    form.inputs.push({ name, type });

    if (hidden && CSRF_TOKEN_NAMES.some(t => name.toLowerCase().includes(t))) {
      form.hasCSRFToken = true;
      form.tokenField = name;
    }
  }

  return form;
};

export const performCSRFDetection = async (target: string, requestManager: RequestManager): Promise<CSRFDetectionResult> => {
  const domain = extractDomain(target);
  console.log(`[CSRF Detection] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const forms: FormAnalysis[] = [];

  const pagesToCheck = [baseUrl];

  // Also check common pages with forms
  const commonPaths = ['/login', '/signup', '/register', '/contact', '/forgot-password', '/reset-password', '/profile', '/settings'];
  for (const path of commonPaths) {
    pagesToCheck.push(`${baseUrl}${path}`);
  }

  for (const pageUrl of pagesToCheck.slice(0, 5)) {
    try {
      const response = await requestManager.fetch(pageUrl, { timeout: 10000 });
      if (response.status !== 200) continue;

      const html = await response.text();

      // Check for CSRF token in meta tags too
      const metaCsrf = html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i) ||
        html.match(/<meta[^>]*name="_token"[^>]*content="([^"]+)"/i);

      const formMatches = html.matchAll(FORM_REGEX);
      for (const formMatch of formMatches) {
        const form = parseForm(formMatch[0]);
        // If CSRF token was found in meta tag but not in the form, still mark as having token
        if (!form.hasCSRFToken && metaCsrf) {
          form.hasCSRFToken = true;
          form.tokenField = 'meta csrf-token';
        }
        forms.push(form);
      }
    } catch { /* ignore */ }
  }

  return {
    forms,
    totalForms: forms.length,
    formsWithoutToken: forms.filter(f => !f.hasCSRFToken).length,
  };
};
