#!/usr/bin/env node
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import net from 'node:net';
import tls from 'node:tls';
import { performance } from 'node:perf_hooks';

const VERSION = '2.0.0';
const USER_AGENT = `ABSpider-CLI/${VERSION} (Authorized Security Scanner)`;
const WEB_PORTS = [80, 443, 8000, 8080, 8443, 8888, 3000, 5000, 9000, 2082, 2083];
const COMMON_PORTS = [
  20, 21, 22, 23, 25, 26, 37, 43, 53, 67, 68, 69, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 99, 110, 111, 113,
  119, 123, 135, 137, 138, 139, 143, 161, 162, 179, 194, 389, 443, 445, 465, 500, 515, 520, 554, 587, 591,
  593, 631, 636, 873, 902, 989, 990, 993, 995, 1025, 1080, 1099, 1194, 1433, 1521, 1723, 1883, 1900, 2049,
  2082, 2083, 2086, 2087, 2095, 2096, 2375, 2376, 2483, 2484, 3000, 3128, 3306, 3389, 3690, 4443, 4567,
  5000, 5432, 5601, 5672, 5900, 5984, 5985, 5986, 6000, 6379, 6443, 6667, 7001, 7002, 8000, 8008, 8080,
  8081, 8082, 8088, 8090, 8181, 8443, 8500, 8834, 8888, 9000, 9090, 9200, 9300, 9418, 10000, 11211, 15672,
  27017, 27018, 27019,
];
const WEB_PORT_PROFILE = [80, 81, 443, 8000, 8008, 8080, 8081, 8088, 8090, 8181, 8443, 8888, 9000, 9090, 9443];
const FULL_PORT_PROFILE = Array.from({ length: 1024 }, (_, index) => index + 1);
const DEFAULT_PORTS = [...COMMON_PORTS];
const SERVICE_NAMES = new Map([
  [20, 'FTP-DATA'], [21, 'FTP'], [22, 'SSH'], [23, 'Telnet'], [25, 'SMTP'], [53, 'DNS'], [80, 'HTTP'],
  [110, 'POP3'], [111, 'RPCBind'], [135, 'MS RPC'], [139, 'NetBIOS-SSN'], [143, 'IMAP'], [389, 'LDAP'],
  [443, 'HTTPS'], [445, 'SMB'], [465, 'SMTPS'], [587, 'Submission'], [636, 'LDAPS'], [993, 'IMAPS'],
  [995, 'POP3S'], [1433, 'MSSQL'], [1521, 'Oracle SQL'], [1883, 'MQTT'], [2049, 'NFS'], [2082, 'cPanel'],
  [2083, 'cPanel SSL'], [2375, 'Docker'], [2376, 'Docker TLS'], [3000, 'Node/HTTP'], [3128, 'HTTP Proxy'],
  [3306, 'MySQL'], [3389, 'RDP'], [5000, 'HTTP/UPnP'], [5432, 'PostgreSQL'], [5601, 'Kibana'], [5672, 'AMQP'],
  [5900, 'VNC'], [5985, 'WinRM'], [5986, 'WinRM TLS'], [6379, 'Redis'], [6443, 'Kubernetes API'],
  [8000, 'HTTP-Alt'], [8080, 'HTTP-Proxy'], [8443, 'HTTPS-Alt'], [8834, 'Nessus'], [9000, 'HTTP-Alt'],
  [9200, 'Elasticsearch'], [11211, 'Memcached'], [27017, 'MongoDB'],
]);
const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'webmail', 'smtp', 'pop', 'ns1', 'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig',
  'm', 'imap', 'test', 'blog', 'pop3', 'dev', 'www2', 'admin', 'forum', 'news', 'vpn', 'ns3', 'mail2', 'mysql',
  'old', 'lists', 'support', 'mobile', 'mx', 'static', 'docs', 'beta', 'shop', 'secure', 'demo', 'calendar',
  'wiki', 'web', 'media', 'email', 'images', 'img', 'www1', 'portal', 'video', 'dns2', 'api', 'cdn', 'stats',
  'dns1', 'staging', 'qa', 'prod', 'uat', 'int', 'external', 'internal', 'app', 'dashboard', 'panel', 'login',
  'auth', 'sso', 'id', 'account', 'user', 'client', 'partner', 'store', 'checkout', 'pay', 'billing', 'invoice',
  'order', 'status', 'track', 'delivery', 'help', 'faq', 'knowledge', 'kb', 'manual', 'guide', 'learn', 'academy',
  'event', 'meet', 'chat', 'message', 'community', 'live', 'media', 'gallery', 'assets', 'upload', 'uploads',
  'download', 'downloads', 'data', 'analytics', 'metrics', 'monitor', 'health', 'uptime', 'alert', 'notify',
  'log', 'audit', 'security', 'scan', 'recon', 'build', 'ci', 'deploy', 'git', 'repo', 'infra', 'server', 'host',
  'cloud', 'aws', 'azure', 'gcp', 'vps', 'network', 'gateway', 'loadbalancer', 'lb', 'cache', 'storage', 's3',
  'backup', 'db', 'sql', 'mongo', 'redis', 'search', 'queue', 'webhook', 'bot', 'worker', 'service', 'docker',
  'k8s', 'kubernetes', 'sandbox', 'preprod', 'production', 'public', 'private', 'vendor', 'root', 'primary',
  'secondary', 'replica', 'dr', 'cluster', 'node', 'edge', 'zone', 'geo', 'iot', 'ai', 'ml', 'lab', 'prototype',
  'alpha', 'gamma', 'delta',
];
const SQL_ERRORS = [
  /you have an error in your sql syntax/i, /warning.*mysql/i, /mysqli/i, /mysql_fetch/i, /mysql_num_rows/i,
  /postgresql.*error/i, /pg_query/i, /unterminated quoted string/i, /syntax error at or near/i,
  /microsoft sql server/i, /odbc sql server driver/i, /unclosed quotation mark/i, /incorrect syntax near/i,
  /ora-\d{5}/i, /oracle error/i, /quoted string not properly terminated/i, /sqlite.*error/i,
  /unrecognized token/i, /database error/i, /query failed/i,
];
const LFI_MARKERS = [
  /root:x:0:0:/i, /daemon:x:1:1:/i, /bin:x:2:2:/i, /nobody:x:/i, /\[boot loader\]/i, /\[extensions\]/i,
  /\[fonts\]/i, /DOCUMENT_ROOT/i, /LoadModule/i, /allow_url_include/i, /failed to open stream/i,
  /No such file or directory/i, /Permission denied/i, /include_path/i, /Warning.*include/i,
];
const MODE_DEFAULTS = {
  conservative: { payloads: 5, delay: 750, threads: 6, ddosRequests: 5, ports: WEB_PORT_PROFILE, subdomainLimit: 50, ct: true },
  adaptive: { payloads: 20, delay: 250, threads: 20, ddosRequests: 20, ports: COMMON_PORTS, subdomainLimit: 140, ct: true },
  aggressive: { payloads: 75, delay: 75, threads: 50, ddosRequests: 60, ports: FULL_PORT_PROFILE, subdomainLimit: COMMON_SUBDOMAINS.length, ct: true },
};

const PASSIVE_MODULES = ['siteInfo', 'headers', 'whois', 'geoip', 'dns', 'mx', 'subnet', 'subdomains', 'reverseip', 'virustotal', 'sslTls', 'techStack', 'seo'];
const ACTIVE_MODULES = ['ports', 'sqlinjection', 'xss', 'lfi', 'wordpress', 'brokenLinks', 'corsMisconfig', 'ddosFirewall'];
const ALL_MODULES = [...PASSIVE_MODULES, ...ACTIVE_MODULES];
const DEFAULT_MODULES = [...PASSIVE_MODULES];

const MODULE_ALIASES = {
  site: 'siteInfo',
  siteinfo: 'siteInfo',
  header: 'headers',
  ssl: 'sslTls',
  ssltls: 'sslTls',
  tech: 'techStack',
  techstack: 'techStack',
  seo: 'seo',
  links: 'brokenLinks',
  brokenlinks: 'brokenLinks',
  cors: 'corsMisconfig',
  corsmisconfig: 'corsMisconfig',
  sqli: 'sqlinjection',
  sql: 'sqlinjection',
  sqlinjection: 'sqlinjection',
  xss: 'xss',
  lfi: 'lfi',
  wp: 'wordpress',
  wordpress: 'wordpress',
  ddos: 'ddosFirewall',
  ddosfirewall: 'ddosFirewall',
  port: 'ports',
  ports: 'ports',
  vt: 'virustotal',
  virustotal: 'virustotal',
  reverse: 'reverseip',
  reverseip: 'reverseip',
  subdomain: 'subdomains',
  subdomains: 'subdomains',
};

const palette = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

let colorEnabled = process.stdout.isTTY;
let activeShutdownSignal = null;
const color = (name, value) => colorEnabled ? `${palette[name]}${value}${palette.reset}` : value;

const BANNER_LINES = [
  ' █████╗ ██████╗ ███████╗██████╗ ██╗██████╗ ███████╗██████╗ ',
  '██╔══██╗██╔══██╗██╔════╝██╔══██╗██║██╔══██╗██╔════╝██╔══██╗',
  '███████║██████╔╝███████╗██████╔╝██║██║  ██║█████╗  ██████╔╝',
  '██╔══██║██╔══██╗╚════██║██╔═══╝ ██║██║  ██║██╔══╝  ██╔══██╗',
  '██║  ██║██████╔╝███████║██║     ██║██████╔╝███████╗██║  ██║',
  '╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝',
  '                                                            ',
];

const gradient = (value, start = [0, 220, 255], end = [157, 78, 221]) => {
  if (!colorEnabled) return value;
  const chars = [...value];
  const printable = chars.filter((char) => char !== ' ').length || 1;
  let seen = 0;
  return chars.map((char) => {
    if (char === ' ') return char;
    const ratio = seen / Math.max(1, printable - 1);
    seen += 1;
    const [r, g, b] = start.map((component, index) => Math.round(component + (end[index] - component) * ratio));
    return `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`;
  }).join('');
};

const banner = () => `${BANNER_LINES.map((line, index) => gradient(
  line,
  index % 2 === 0 ? [0, 220, 255] : [81, 162, 255],
  index % 2 === 0 ? [157, 78, 221] : [255, 78, 205],
)).join('\n')}
${color('bold', '  ABSpider Recon CLI')} ${color('dim', `v${VERSION}`)}  ${color('magenta', 'Modern Web Security Intelligence Platform')}
${color('dim', '  Passive intelligence gathering + active vulnerability scanning for authorized targets.')}
`;

const getHelp = () => `${banner()}
Usage:
  abspider <target> [options]
  abspider-recon <target> [options]

Profiles:
  --passive              Run passive modules only. Default.
  --active               Run active modules only.
  --all                  Run passive and active modules.
  --modules <list>       Comma-separated modules or aliases.
  --mode <name>          Scan style: conservative, adaptive, aggressive. Default: adaptive.

Passive modules:
  ${PASSIVE_MODULES.join(', ')}

Active modules:
  ${ACTIVE_MODULES.join(', ')}

Options:
  --ports <list>         Comma-separated ports. Overrides the mode/profile port set.
  --port-profile <name>  Port set: web, common, full. Default comes from --mode.
  --threads <number>     Max concurrent port/subdomain checks. Default comes from --mode.
  --timeout <ms>         HTTP/socket timeout. Default: 10000.
  --payloads <number>    Max payloads per active injection check. Default comes from --mode.
  --ddos-requests <n>    Bounded DDoS/WAF probe request count. Default comes from --mode.
  --delay <ms>           Delay between active payload requests. Default comes from --mode.
  --subdomain-limit <n>  Max DNS wordlist subdomains to check. Default comes from --mode.
  --no-ct                Disable crt.sh certificate transparency lookup.
  --json                 Print full JSON instead of the terminal interface.
  --output <file>        Write full JSON results to a file.
  --pretty               Pretty-print JSON output.
  --no-color             Disable ANSI colors.
  --help                 Show this help.
  --version              Show version.

Examples:
  abspider example.com
  abspider example.com --all
  abspider https://example.com --active --mode conservative
  abspider https://example.com --all --mode aggressive --port-profile common
  abspider example.com --modules whois,dns,sslTls,ports,cors --output scan.json

Notes:
  The Node CLI is not subject to browser CORS restrictions.
  CDN/WAF protections such as Cloudflare are detected and reported. The CLI does not evade access controls.
  Press Ctrl+C to stop gracefully and keep partial results.

Only scan systems you own or have explicit authorization to test.
`;

const parseArgs = (argv) => {
  const options = {
    modules: [...DEFAULT_MODULES],
    ports: [...DEFAULT_PORTS],
    threads: 20,
    timeout: 10000,
    payloads: 12,
    ddosRequests: 20,
    delay: 150,
    mode: 'adaptive',
    subdomainLimit: 140,
    ct: true,
    json: false,
    pretty: false,
    output: null,
    color: true,
    explicit: new Set(),
  };
  let target = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
    else if (arg === '--passive') options.modules = [...PASSIVE_MODULES];
    else if (arg === '--active') options.modules = [...ACTIVE_MODULES];
    else if (arg === '--all') options.modules = [...ALL_MODULES];
    else if (arg === '--conservative') options.mode = 'conservative';
    else if (arg === '--adaptive') options.mode = 'adaptive';
    else if (arg === '--aggressive') options.mode = 'aggressive';
    else if (arg === '--mode') options.mode = readMode(argv[++i]);
    else if (arg.startsWith('--mode=')) options.mode = readMode(arg.slice('--mode='.length));
    else if (arg === '--json') options.json = true;
    else if (arg === '--pretty') options.pretty = true;
    else if (arg === '--no-color') options.color = false;
    else if (arg === '--modules' || arg === '-m') options.modules = readModules(argv[++i]);
    else if (arg.startsWith('--modules=')) options.modules = readModules(arg.slice('--modules='.length));
    else if (arg === '--ports' || arg === '-p') { options.ports = readPorts(argv[++i]); options.explicit.add('ports'); }
    else if (arg.startsWith('--ports=')) { options.ports = readPorts(arg.slice('--ports='.length)); options.explicit.add('ports'); }
    else if (arg === '--port-profile') { options.ports = readPortProfile(argv[++i]); options.explicit.add('ports'); }
    else if (arg.startsWith('--port-profile=')) { options.ports = readPortProfile(arg.slice('--port-profile='.length)); options.explicit.add('ports'); }
    else if (arg === '--threads') { options.threads = readPositiveInt(argv[++i], '--threads'); options.explicit.add('threads'); }
    else if (arg.startsWith('--threads=')) { options.threads = readPositiveInt(arg.slice('--threads='.length), '--threads'); options.explicit.add('threads'); }
    else if (arg === '--timeout') options.timeout = readPositiveInt(argv[++i], '--timeout');
    else if (arg.startsWith('--timeout=')) options.timeout = readPositiveInt(arg.slice('--timeout='.length), '--timeout');
    else if (arg === '--payloads') { options.payloads = readPositiveInt(argv[++i], '--payloads'); options.explicit.add('payloads'); }
    else if (arg.startsWith('--payloads=')) { options.payloads = readPositiveInt(arg.slice('--payloads='.length), '--payloads'); options.explicit.add('payloads'); }
    else if (arg === '--ddos-requests') { options.ddosRequests = readPositiveInt(argv[++i], '--ddos-requests'); options.explicit.add('ddosRequests'); }
    else if (arg.startsWith('--ddos-requests=')) { options.ddosRequests = readPositiveInt(arg.slice('--ddos-requests='.length), '--ddos-requests'); options.explicit.add('ddosRequests'); }
    else if (arg === '--delay') { options.delay = readPositiveInt(argv[++i], '--delay'); options.explicit.add('delay'); }
    else if (arg.startsWith('--delay=')) { options.delay = readPositiveInt(arg.slice('--delay='.length), '--delay'); options.explicit.add('delay'); }
    else if (arg === '--subdomain-limit') { options.subdomainLimit = readPositiveInt(argv[++i], '--subdomain-limit'); options.explicit.add('subdomainLimit'); }
    else if (arg.startsWith('--subdomain-limit=')) { options.subdomainLimit = readPositiveInt(arg.slice('--subdomain-limit='.length), '--subdomain-limit'); options.explicit.add('subdomainLimit'); }
    else if (arg === '--no-ct') options.ct = false;
    else if (arg === '--output' || arg === '-o') options.output = requireValue(argv[++i], '--output');
    else if (arg.startsWith('--output=')) options.output = requireValue(arg.slice('--output='.length), '--output');
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (!target) target = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  applyModeDefaults(options);
  options.modules = [...new Set(options.modules)];
  options.threads = Math.min(options.threads, 100);
  options.payloads = Math.min(options.payloads, 1000);
  options.ddosRequests = Math.min(options.ddosRequests, 250);
  options.subdomainLimit = Math.min(options.subdomainLimit, COMMON_SUBDOMAINS.length);
  delete options.explicit;
  return { target, options };
};

const requireValue = (value, name) => {
  if (!value) throw new Error(`${name} requires a value`);
  return value;
};

const readPositiveInt = (value, name) => {
  requireValue(value, name);
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) throw new Error(`${name} must be a positive integer`);
  return number;
};

const readMode = (value) => {
  const mode = requireValue(value, '--mode').toLowerCase();
  if (!MODE_DEFAULTS[mode]) throw new Error(`Unknown mode: ${value}. Use conservative, adaptive, or aggressive.`);
  return mode;
};

const readPortProfile = (value) => {
  const profile = requireValue(value, '--port-profile').toLowerCase();
  if (profile === 'web') return [...WEB_PORT_PROFILE];
  if (profile === 'common') return [...COMMON_PORTS];
  if (profile === 'full') return [...FULL_PORT_PROFILE];
  throw new Error(`Unknown port profile: ${value}. Use web, common, or full.`);
};

const applyModeDefaults = (options) => {
  const defaults = MODE_DEFAULTS[options.mode];
  for (const key of ['payloads', 'delay', 'threads', 'ddosRequests', 'subdomainLimit']) {
    if (!options.explicit.has(key)) options[key] = defaults[key];
  }
  if (!options.explicit.has('ports')) options.ports = [...defaults.ports];
  if (options.ct === true) options.ct = defaults.ct;
};

const readList = (value, name) => requireValue(value, name).split(',').map((item) => item.trim()).filter(Boolean);

const readModules = (value) => readList(value, '--modules').map((moduleName) => {
  const normalized = moduleName.toLowerCase().replace(/[-_]/g, '');
  const canonical = MODULE_ALIASES[normalized] || moduleName;
  if (!ALL_MODULES.includes(canonical)) {
    throw new Error(`Unknown module: ${moduleName}. Available modules: ${ALL_MODULES.join(', ')}`);
  }
  return canonical;
});

const readPorts = (value) => {
  const ports = readList(value, '--ports').map((port) => readPositiveInt(port, '--ports'));
  const invalid = ports.find((port) => port > 65535);
  if (invalid) throw new Error(`Invalid port: ${invalid}`);
  return [...new Set(ports)];
};

const normalizeTarget = (rawTarget) => {
  if (!rawTarget || rawTarget.trim().length === 0) throw new Error('Target is required');
  const input = rawTarget.trim();
  const urlText = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(input) ? input : `https://${input}`;
  const url = new URL(urlText);
  return {
    input,
    url,
    origin: url.origin,
    hostname: url.hostname,
    domain: url.hostname.replace(/^www\./i, ''),
    port: url.port ? Number.parseInt(url.port, 10) : (url.protocol === 'http:' ? 80 : 443),
  };
};

const request = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onShutdown = () => controller.abort();
  if (activeShutdownSignal?.aborted) throw interruptedError();
  activeShutdownSignal?.addEventListener('abort', onShutdown, { once: true });
  try {
    return await fetch(url, {
      redirect: 'follow',
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        ...options?.headers,
      },
    });
  } catch (error) {
    if (activeShutdownSignal?.aborted) throw interruptedError();
    if (error.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
    activeShutdownSignal?.removeEventListener('abort', onShutdown);
  }
};

const getHtml = async (target, options, cache) => {
  if (cache.html) return cache.html;
  const started = performance.now();
  const response = await request(target.origin, { method: 'GET' }, options.timeout);
  const text = await response.text();
  cache.html = { response, text, responseTimeMs: Math.round(performance.now() - started), protection: detectProtection(response, text) };
  return cache.html;
};

const runSiteInfo = async (target, options, cache) => {
  const { response, text, responseTimeMs, protection } = await getHtml(target, options, cache);
  const addresses = await resolveSafe(target.hostname, 'A');
  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    responseTimeMs,
    contentLength: text.length,
    title: extractTitle(text),
    ip: addresses[0] || null,
    server: response.headers.get('server'),
    poweredBy: response.headers.get('x-powered-by'),
    protection,
  };
};

const runHeaders = async (target, options) => {
  const response = await request(target.origin, { method: 'HEAD' }, options.timeout);
  const headers = Object.fromEntries(response.headers.entries());
  const expected = ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy'];
  const present = expected.filter((header) => headers[header]);
  const missing = expected.filter((header) => !headers[header]);
  return { status: response.status, headers, security: { score: Math.round((present.length / expected.length) * 100), present, missing }, protection: detectProtection(response) };
};

const runWhois = async (target, options) => {
  const response = await request(`https://rdap.org/domain/${encodeURIComponent(target.domain)}`, { method: 'GET' }, options.timeout);
  if (!response.ok) return { source: 'rdap.org', status: response.status, found: false };
  const data = await response.json();
  return {
    source: 'rdap.org',
    found: true,
    handle: data.handle,
    ldhName: data.ldhName,
    status: data.status || [],
    registrar: data.entities?.find((entity) => entity.roles?.includes('registrar'))?.vcardArray?.[1]?.find((item) => item[0] === 'fn')?.[3] || null,
    events: data.events || [],
    nameservers: data.nameservers?.map((server) => server.ldhName) || [],
  };
};

const runGeoIp = async (target, options) => {
  const ip = (await resolveSafe(target.hostname, 'A'))[0] || target.hostname;
  const response = await request(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { method: 'GET' }, options.timeout);
  if (!response.ok) return { ip, found: false, status: response.status };
  const data = await response.json();
  return { ip, city: data.city, region: data.region, country: data.country_name, org: data.org, asn: data.asn, latitude: data.latitude, longitude: data.longitude };
};

const runDns = async (target) => {
  const records = {};
  await Promise.all(['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'].map(async (type) => {
    records[type] = await resolveSafe(target.hostname, type);
  }));
  return records;
};

const runMx = async (target) => ({ records: await resolveSafe(target.domain, 'MX') });

const runSubnet = async (target) => {
  const ip = (await resolveSafe(target.hostname, 'A'))[0];
  if (!ip || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return { skipped: true, reason: 'No IPv4 address available.' };
  const parts = ip.split('.').map(Number);
  return { ip, cidr: `${parts[0]}.${parts[1]}.${parts[2]}.0/24`, network: `${parts[0]}.${parts[1]}.${parts[2]}.0`, broadcast: `${parts[0]}.${parts[1]}.${parts[2]}.255`, usableHosts: 254 };
};

const runSubdomains = async (target, options) => {
  const wordlist = COMMON_SUBDOMAINS.slice(0, options.subdomainLimit);
  const queue = wordlist.map((name) => `${name}.${target.domain}`);
  const found = [];
  const foundKeys = new Set();
  const workers = Array.from({ length: Math.min(options.threads, queue.length) }, async () => {
    while (queue.length && !isInterrupted()) {
      const hostname = queue.shift();
      const addresses = await resolveSafe(hostname, 'A', Math.min(options.timeout, 1500));
      if (addresses.length && !foundKeys.has(hostname)) {
        foundKeys.add(hostname);
        found.push({ hostname, addresses, source: 'dns' });
      }
    }
  });
  await Promise.all(workers);

  const sources = { dns: found.length, crtsh: 0, securitytrails: 0 };

  if (options.ct && !isInterrupted()) {
    const ctSubdomains = await enumerateCrtShSubdomains(target, options);
    sources.crtsh = ctSubdomains.length;
    for (const hostname of ctSubdomains) {
      if (!foundKeys.has(hostname)) {
        foundKeys.add(hostname);
        found.push({ hostname, addresses: [], source: 'crtsh' });
      }
    }
  }

  if (!isInterrupted()) {
    const stSubdomains = await enumerateSecurityTrailsSubdomains(target, options);
    sources.securitytrails = stSubdomains.length;
    for (const hostname of stSubdomains) {
      if (!foundKeys.has(hostname)) {
        foundKeys.add(hostname);
        found.push({ hostname, addresses: [], source: 'securitytrails' });
      }
    }
  }

  return { checked: wordlist.length, sources, found: found.sort((a, b) => a.hostname.localeCompare(b.hostname)) };
};

const enumerateCrtShSubdomains = async (target, options) => {
  try {
    const response = await request(`https://crt.sh/?q=%.${encodeURIComponent(target.domain)}&output=json`, { method: 'GET' }, Math.max(options.timeout, 15000));
    if (!response.ok) return [];
    const text = await response.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    const subdomains = new Set();
    for (const cert of data) {
      for (const name of String(cert.name_value || '').split('\n')) {
        const cleanName = name.trim().toLowerCase().replace(/^\*\./, '');
        if (cleanName && cleanName !== target.domain && cleanName.endsWith(`.${target.domain}`) && !cleanName.includes('*')) {
          subdomains.add(cleanName);
        }
      }
    }
    return [...subdomains];
  } catch {
    return [];
  }
};

const enumerateSecurityTrailsSubdomains = async (target, options) => {
  const key = process.env.SECURITYTRAILS_API_KEY || process.env.VITE_SECURITYTRAILS_API_KEY;
  if (!key) return [];
  try {
    const response = await request(`https://api.securitytrails.com/v1/domain/${encodeURIComponent(target.domain)}/subdomains`, {
      method: 'GET',
      headers: { apikey: key },
    }, Math.max(options.timeout, 15000));
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.subdomains) ? data.subdomains.map((subdomain) => `${subdomain}.${target.domain}`) : [];
  } catch {
    return [];
  }
};

const runReverseIp = async (target, options) => {
  const ip = (await resolveSafe(target.hostname, 'A'))[0];
  if (!ip) return { skipped: true, reason: 'No IP address available.' };
  const response = await request(`https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`, { method: 'GET' }, options.timeout);
  const text = await response.text();
  const domains = response.ok && !/error|invalid/i.test(text) ? text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
  return { source: 'hackertarget.com', ip, domains };
};

const runVirusTotal = async (target, options) => {
  const key = process.env.VIRUSTOTAL_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY;
  if (!key) return { skipped: true, reason: 'Set VIRUSTOTAL_API_KEY or VITE_VIRUSTOTAL_API_KEY to enable this module.' };
  const response = await request(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(target.domain)}`, {
    method: 'GET',
    headers: { 'x-apikey': key },
  }, options.timeout);
  const data = await response.json();
  return { status: response.status, stats: data.data?.attributes?.last_analysis_stats || null, reputation: data.data?.attributes?.reputation ?? null };
};

const runSslTls = async (target, options) => {
  if (target.port !== 443 && target.url.protocol !== 'https:') return { skipped: true, reason: 'Target is not using HTTPS.' };
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: target.hostname, port: target.port || 443, servername: target.hostname, rejectUnauthorized: false, timeout: options.timeout });
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate(true);
      socket.end();
      if (!cert || Object.keys(cert).length === 0) return resolve({ available: false, error: 'No certificate returned.' });
      const validToMs = Date.parse(cert.valid_to);
      return resolve({
        available: true,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError || null,
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysUntilExpiry: Number.isFinite(validToMs) ? Math.ceil((validToMs - Date.now()) / 86400000) : null,
        subjectAltName: cert.subjectaltname,
        fingerprint256: cert.fingerprint256,
        serialNumber: cert.serialNumber,
      });
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error(`TLS connection timed out after ${options.timeout}ms`));
    });
    socket.once('error', reject);
  });
};

const runTechStack = async (target, options, cache) => {
  const { response, text, protection } = await getHtml(target, options, cache);
  const headers = Object.fromEntries(response.headers.entries());
  const checks = [
    ['WordPress', /wp-content|wp-includes|wordpress/i],
    ['React', /react|data-reactroot|__REACT_DEVTOOLS_GLOBAL_HOOK__/i],
    ['Vue', /vue(?:\.runtime)?\.js|data-v-/i],
    ['Angular', /ng-version|angular/i],
    ['jQuery', /jquery/i],
    ['Bootstrap', /bootstrap/i],
    ['Tailwind CSS', /tailwind/i],
    ['Google Analytics', /google-analytics|gtag\(|G-[A-Z0-9]+/i],
    ['Cloudflare', /cloudflare/i],
  ];
  const detected = checks.filter(([, pattern]) => pattern.test(text) || pattern.test(JSON.stringify(headers))).map(([name]) => name);
  if (headers.server) detected.push(`Server: ${headers.server}`);
  if (headers['x-powered-by']) detected.push(`Powered by: ${headers['x-powered-by']}`);
  return { detected: [...new Set(detected)], generator: firstMatch(text, /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i), protection };
};

const runSeo = async (target, options, cache) => {
  const { text } = await getHtml(target, options, cache);
  return {
    title: extractTitle(text),
    description: firstMatch(text, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
    canonical: firstMatch(text, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
    h1Count: countMatches(text, /<h1[\s>]/gi),
    imgWithoutAlt: [...text.matchAll(/<img\b[^>]*>/gi)].filter((match) => !/\salt=/i.test(match[0])).length,
    internalLinks: extractLinks(text, target.origin).filter((url) => new URL(url).hostname === target.hostname).length,
    externalLinks: extractLinks(text, target.origin).filter((url) => new URL(url).hostname !== target.hostname).length,
  };
};

const runPorts = async (target, options) => {
  const queue = [...options.ports];
  const results = [];
  const workers = Array.from({ length: Math.min(options.threads, queue.length) }, async () => {
    while (queue.length && !isInterrupted()) results.push(await checkPort(target.hostname, queue.shift(), options.timeout));
  });
  await Promise.all(workers);
  return results.sort((a, b) => a.port - b.port);
};

const runSqlInjection = async (target, options) => {
  const payloads = await loadPayloads('sqli.json', options.payloads);
  return runPayloadProbe(target, options, payloads, (body, payload, response, baseline) => {
    const matched = SQL_ERRORS.find((pattern) => pattern.test(body));
    if (matched) return { found: true, indicator: String(matched), confidence: 0.9 };
    if (baseline?.status && response.status >= 500 && response.status !== baseline.status) {
      return { found: true, indicator: `HTTP ${response.status} differs from baseline ${baseline.status}`, confidence: 0.75 };
    }
    return { found: false };
  }, 'sqlinjection');
};

const runXss = async (target, options) => {
  const payloads = await loadPayloads('xss.json', options.payloads);
  return runPayloadProbe(target, options, payloads, (body, payload) => {
    if (!body.includes(payload.payload)) return { found: false };
    const encoded = body.includes(escapeHtml(payload.payload)) || body.includes(encodeURIComponent(payload.payload));
    return encoded
      ? { found: false }
      : { found: true, indicator: 'Unencoded payload reflection', confidence: 0.8 };
  }, 'xss');
};

const runLfi = async (target, options) => {
  const payloads = await loadPayloads('lfi.json', options.payloads);
  return runPayloadProbe(target, options, payloads, (body, payload, response, baseline) => {
    const matched = LFI_MARKERS.find((pattern) => pattern.test(body));
    if (matched) return { found: true, indicator: String(matched), confidence: 0.85 };
    if (baseline?.length && body.length > baseline.length * 1.5 && response.status >= 500) {
      return { found: true, indicator: `Large response change with HTTP ${response.status}`, confidence: 0.7 };
    }
    return { found: false };
  }, 'lfi');
};

const runPayloadProbe = async (target, options, payloads, isFinding, moduleName) => {
  const params = discoverParams(target);
  const findings = [];
  const errors = [];
  let tested = 0;
  let baseline = null;
  try {
    const baselineResponse = await request(target.url.href, { method: 'GET' }, options.timeout);
    const baselineBody = await baselineResponse.text();
    baseline = { status: baselineResponse.status, length: baselineBody.length, body: baselineBody };
  } catch {
    baseline = null;
  }
  for (const param of params) {
    for (const payload of payloads) {
      throwIfInterrupted();
      const url = new URL(target.url.href);
      const original = url.searchParams.get(param) || defaultParamValue(moduleName, param);
      url.searchParams.set(param, `${original}${payload.payload}`);
      try {
        const response = await request(url.href, { method: 'GET' }, options.timeout);
        const body = await response.text();
        tested += 1;
        const detection = isFinding(body, payload, response, baseline);
        if (detection.found && detection.confidence >= 0.7) {
          findings.push({
            param,
            payload: payload.payload,
            type: payload.type,
            severity: payload.severity,
            status: response.status,
            indicator: detection.indicator,
            confidence: detection.confidence,
            evidence: extractEvidence(body, detection.indicator),
          });
        }
      } catch (error) {
        errors.push({ param, payload: payload.payload, error: error.message });
      }
      await sleep(options.delay);
    }
  }
  return { module: moduleName, tested, params, findings, errors };
};

const runWordPress = async (target, options) => {
  const paths = ['/wp-login.php', '/wp-admin/', '/wp-json/', '/xmlrpc.php', '/wp-content/'];
  const checks = [];
  for (const path of paths) {
    const response = await request(new URL(path, target.origin).href, { method: 'GET' }, options.timeout).catch((error) => ({ error }));
    checks.push(response.error ? { path, ok: false, error: response.error.message } : { path, ok: response.ok, status: response.status });
  }
  const isWordPress = checks.some((check) => check.ok) || checks.some((check) => [401, 403].includes(check.status));
  return { isWordPress, checks };
};

const runBrokenLinks = async (target, options, cache) => {
  const { text } = await getHtml(target, options, cache);
  const links = [...new Set(extractLinks(text, target.origin))].slice(0, 75);
  const checked = await Promise.all(links.map(async (url) => {
    try {
      const response = await request(url, { method: 'HEAD' }, options.timeout);
      return { url, status: response.status, ok: response.ok };
    } catch (error) {
      return { url, status: null, ok: false, error: error.message };
    }
  }));
  return { checked: checked.length, broken: checked.filter((link) => !link.ok) };
};

const runCorsMisconfig = async (target, options) => {
  const testOrigin = 'https://attacker.example';
  const response = await request(target.origin, { method: 'GET', headers: { origin: testOrigin } }, options.timeout);
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const allowCredentials = response.headers.get('access-control-allow-credentials');
  const vulnerable = allowOrigin === '*' || allowOrigin === testOrigin;
  return { allowOrigin, allowCredentials, vulnerable, finding: vulnerable ? 'Arbitrary-origin or wildcard CORS behavior detected.' : 'No obvious arbitrary-origin CORS behavior detected.' };
};

const runDdosFirewall = async (target, options) => {
  const responses = [];
  for (let i = 0; i < options.ddosRequests; i += 1) {
    throwIfInterrupted();
    const started = performance.now();
    try {
      const response = await request(target.origin, { method: 'HEAD' }, options.timeout);
      responses.push({ status: response.status, responseTimeMs: Math.round(performance.now() - started), rateLimited: [403, 429, 503].includes(response.status) });
    } catch (error) {
      responses.push({ error: error.message, rateLimited: true });
    }
    await sleep(options.delay);
  }
  const rateLimited = responses.filter((item) => item.rateLimited).length;
  const avgResponseTimeMs = Math.round(responses.filter((item) => item.responseTimeMs).reduce((sum, item) => sum + item.responseTimeMs, 0) / Math.max(1, responses.filter((item) => item.responseTimeMs).length));
  return { requests: responses.length, rateLimited, avgResponseTimeMs, likelyProtected: rateLimited > 0, responses };
};

const MODULE_RUNNERS = {
  siteInfo: runSiteInfo,
  headers: runHeaders,
  whois: runWhois,
  geoip: runGeoIp,
  dns: runDns,
  mx: runMx,
  subnet: runSubnet,
  subdomains: runSubdomains,
  reverseip: runReverseIp,
  virustotal: runVirusTotal,
  sslTls: runSslTls,
  techStack: runTechStack,
  seo: runSeo,
  ports: runPorts,
  sqlinjection: runSqlInjection,
  xss: runXss,
  lfi: runLfi,
  wordpress: runWordPress,
  brokenLinks: runBrokenLinks,
  corsMisconfig: runCorsMisconfig,
  ddosFirewall: runDdosFirewall,
};

const runScan = async (target, options) => {
  const cache = {};
  const results = {
    tool: 'abspider-cli',
    version: VERSION,
    target: target.input,
    normalizedTarget: target.origin,
    hostname: target.hostname,
    startedAt: new Date().toISOString(),
    profile: profileFor(options.modules),
    mode: options.mode,
    modules: {},
    errors: [],
    interrupted: false,
  };

  if (!options.json) printRunHeader(target, options);

  for (let index = 0; index < options.modules.length; index += 1) {
    if (isInterrupted()) {
      results.interrupted = true;
      results.errors.push('Scan interrupted by user');
      break;
    }
    const moduleName = options.modules[index];
    const started = performance.now();
    const progress = options.json ? null : startModuleProgress(moduleName, index + 1, options.modules.length);
    try {
      const data = await MODULE_RUNNERS[moduleName](target, options, cache);
      results.modules[moduleName] = { ok: true, type: ACTIVE_MODULES.includes(moduleName) ? 'active' : 'passive', durationMs: Math.round(performance.now() - started), data };
      if (progress) progress.stop(true, results.modules[moduleName].durationMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isInterruptedError(error)) results.interrupted = true;
      results.modules[moduleName] = { ok: false, type: ACTIVE_MODULES.includes(moduleName) ? 'active' : 'passive', durationMs: Math.round(performance.now() - started), error: message };
      results.errors.push(`${moduleName}: ${message}`);
      if (progress) progress.stop(false, results.modules[moduleName].durationMs);
    }

    if (!options.json) {
      try {
        printModuleResult(moduleName, results.modules[moduleName]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${color('red', 'display error')} ${moduleName}: ${message}`);
        console.log('');
      }
    }

    applyAdaptiveAdjustments(options, results.modules[moduleName]);
    if (results.interrupted) break;
  }

  results.completedAt = new Date().toISOString();
  return results;
};

const printRunHeader = (target, options) => {
  console.log(banner());
  console.log(`${color('bold', 'target')}   ${target.origin}`);
  console.log(`${color('bold', 'profile')}  ${profileFor(options.modules)} (${options.modules.length} modules)`);
  console.log(`${color('bold', 'mode')}     ${options.mode} (${options.payloads} payloads, ${options.threads} threads, ${options.delay}ms delay)`);
  console.log(`${color('bold', 'active')}   ${options.modules.filter((moduleName) => ACTIVE_MODULES.includes(moduleName)).join(', ') || 'none'}`);
  console.log(`${color('dim', 'Only scan systems you own or have explicit authorization to test.')}`);
  console.log('');
};

const startModuleProgress = (moduleName, current, total) => {
  const label = `${String(current).padStart(2, '0')}/${total} ${moduleName}`;
  let tick = 0;
  let stopped = false;
  const render = () => {
    const width = 24;
    const activeWidth = 7;
    const offset = tick % (width + activeWidth);
    const cells = Array.from({ length: width }, (_, index) => {
      const distance = Math.abs(index - offset);
      return distance < activeWidth ? '█' : '░';
    }).join('');
    const elapsed = `${Math.floor(tick / 10)}s`;
    const line = `${color('cyan', '>>')} ${label.padEnd(20)} ${gradient(cells)} ${color('dim', elapsed)} running`;
    if (process.stdout.isTTY) {
      process.stdout.write(`\r${line}`);
    } else if (tick === 0) {
      console.log(line);
    }
    tick += 1;
  };

  render();
  const timer = setInterval(render, 100);
  timer.unref?.();

  return {
    stop(ok, durationMs) {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      const finalBar = ok ? color('green', '████████████████████████') : color('red', '████████████████████████');
      const status = ok ? color('green', 'done') : color('red', 'failed');
      const line = `${color('cyan', '>>')} ${label.padEnd(20)} ${finalBar} ${status} ${color('dim', `${durationMs}ms`)}`;
      if (process.stdout.isTTY) process.stdout.write(`\r${line}\n`);
      else console.log(line);
    },
  };
};

const printModuleResult = (moduleName, result) => {
  const status = result.ok ? color('green', 'ok') : color('red', 'failed');
  console.log(`${status} ${color('bold', moduleName)} ${color('dim', `${result.type} | ${result.durationMs}ms`)} ${summarize(moduleName, result)}`);
  for (const line of renderDetails(moduleName, result)) {
    console.log(`  ${line}`);
  }
  console.log('');
};

const printResults = (results) => {
  console.log('');
  console.log(gradient('SUMMARY'));
  console.log(color('dim', '-------'));
  const entries = Object.entries(results.modules);
  const ok = entries.filter(([, result]) => result.ok).length;
  const failed = entries.length - ok;
  const active = entries.filter(([, result]) => result.type === 'active').length;
  const passive = entries.length - active;
  const elapsedMs = Date.parse(results.completedAt) - Date.parse(results.startedAt);
  console.log(kv('Target', results.normalizedTarget));
  console.log(kv('Profile', results.profile));
  console.log(kv('Mode', results.mode));
  console.log(kv('Modules', `${entries.length} total, ${passive} passive, ${active} active`));
  console.log(kv('Status', `${ok} ok, ${failed} failed${results.interrupted ? ', interrupted' : ''}`));
  console.log(kv('Elapsed', `${elapsedMs}ms`));
  if (results.errors.length) {
    console.log(kv('Errors', results.errors.join(' | ')));
  }
};

const renderDetails = (moduleName, result) => {
  if (!result.ok) return [color('red', result.error)];
  const data = result.data;
  if (data.skipped) return [color('yellow', data.reason)];

  if (moduleName === 'siteInfo') {
    return compactLines([
      kv('URL', data.url),
      kv('Status', `${data.status} ${data.statusText || ''}`.trim()),
      kv('Response time', `${data.responseTimeMs}ms`),
      kv('Content length', `${data.contentLength} bytes`),
      kv('Title', data.title),
      kv('Resolved IP', data.ip),
      kv('Server', data.server),
      kv('Powered by', data.poweredBy),
      kv('Protection', formatProtection(data.protection)),
    ]);
  }

  if (moduleName === 'headers') {
    return [
      kv('Security score', `${data.security.score}/100`),
      kv('Present', list(data.security.present)),
      kv('Missing', list(data.security.missing)),
      kv('Protection', formatProtection(data.protection)),
      ...Object.entries(data.headers).slice(0, 18).map(([name, value]) => kv(name, truncate(String(value), 110))),
    ];
  }

  if (moduleName === 'whois') {
    if (!data.found) {
      return compactLines([
        kv('Source', data.source),
        kv('Found', 'false'),
        kv('HTTP status', data.status),
      ]);
    }

    return compactLines([
      kv('Source', data.source),
      kv('Found', String(Boolean(data.found))),
      kv('Handle', data.handle),
      kv('Domain', data.ldhName),
      kv('Registrar', data.registrar),
      kv('Status', list(data.status)),
      kv('Nameservers', list(data.nameservers, 8)),
      ...formatEvents(data.events),
    ]);
  }

  if (moduleName === 'geoip') {
    return compactLines([
      kv('IP', data.ip),
      kv('ASN', data.asn),
      kv('Organization', data.org),
      kv('Location', [data.city, data.region, data.country].filter(Boolean).join(', ')),
      kv('Coordinates', data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : null),
    ]);
  }

  if (moduleName === 'dns') {
    return Object.entries(data).map(([type, records]) => kv(type, list(formatDnsRecords(type, records), 10)));
  }

  if (moduleName === 'mx') {
    return data.records.length
      ? data.records.map((record) => kv('MX', `${record.exchange || record} ${record.priority !== undefined ? `(priority ${record.priority})` : ''}`.trim()))
      : [kv('MX', 'none found')];
  }

  if (moduleName === 'subnet') {
    return compactLines([
      kv('IP', data.ip),
      kv('CIDR', data.cidr),
      kv('Network', data.network),
      kv('Broadcast', data.broadcast),
      kv('Usable hosts', data.usableHosts),
    ]);
  }

  if (moduleName === 'subdomains') {
    return [
      kv('Checked', data.checked),
      kv('Found', data.found.length),
      kv('Sources', data.sources ? Object.entries(data.sources).map(([name, count]) => `${name}:${count}`).join(', ') : 'dns'),
      ...data.found.slice(0, 30).map((item) => kv(item.hostname, `${list(item.addresses)} (${item.source || 'dns'})`)),
    ];
  }

  if (moduleName === 'reverseip') {
    return [
      kv('Source', data.source),
      kv('IP', data.ip),
      kv('Domains', data.domains?.length || 0),
      ...listLines(data.domains || [], 20),
    ];
  }

  if (moduleName === 'virustotal') {
    return data.stats
      ? [kv('Reputation', data.reputation), ...Object.entries(data.stats).map(([name, value]) => kv(name, value))]
      : [kv('Status', data.reason || 'No VirusTotal API key configured')];
  }

  if (moduleName === 'sslTls') {
    return compactLines([
      kv('Available', String(Boolean(data.available))),
      kv('Authorized', String(Boolean(data.authorized))),
      kv('Authorization error', data.authorizationError),
      kv('Subject', data.subject ? JSON.stringify(data.subject) : null),
      kv('Issuer', data.issuer ? JSON.stringify(data.issuer) : null),
      kv('Valid from', data.validFrom),
      kv('Valid to', data.validTo),
      kv('Days until expiry', data.daysUntilExpiry),
      kv('SAN', data.subjectAltName),
      kv('SHA256', data.fingerprint256),
    ]);
  }

  if (moduleName === 'techStack') {
    return compactLines([
      kv('Detected', list(data.detected, 20)),
      kv('Generator', data.generator),
      kv('Protection', formatProtection(data.protection)),
    ]);
  }

  if (moduleName === 'seo') {
    return compactLines([
      kv('Title', data.title),
      kv('Description', data.description),
      kv('Canonical', data.canonical),
      kv('H1 count', data.h1Count),
      kv('Images missing alt', data.imgWithoutAlt),
      kv('Internal links', data.internalLinks),
      kv('External links', data.externalLinks),
    ]);
  }

  if (moduleName === 'ports') {
    const open = data.filter((port) => port.open);
    const closed = data.filter((port) => !port.open);
    return [
      kv('Open ports', open.length ? open.map((port) => `${port.port}/${port.service || 'Unknown'} (${port.responseTimeMs}ms)`).join(', ') : 'none found'),
      kv('Closed/filtered', closed.length),
      ...closed.slice(0, 12).map((port) => kv(`port ${port.port}`, port.error || 'closed')),
    ];
  }

  if (['sqlinjection', 'xss', 'lfi'].includes(moduleName)) {
    return [
      kv('Parameters tested', list(data.params)),
      kv('Requests tested', data.tested),
      kv('Findings', data.findings.length),
      kv('Request errors', data.errors?.length || 0),
      ...data.findings.slice(0, 20).map((finding) => kv(
        `${finding.param} ${finding.severity || ''}`.trim(),
        `${finding.type || 'payload'} -> ${truncate(finding.payload, 90)} [${finding.status}] ${finding.indicator || ''}`,
      )),
    ];
  }

  if (moduleName === 'wordpress') {
    return [
      kv('WordPress likely', String(Boolean(data.isWordPress))),
      ...data.checks.map((check) => kv(check.path, check.error || `${check.status} ${check.ok ? 'reachable' : 'not reachable'}`)),
    ];
  }

  if (moduleName === 'brokenLinks') {
    return [
      kv('Checked', data.checked),
      kv('Broken', data.broken.length),
      ...data.broken.slice(0, 20).map((link) => kv(link.status || 'error', truncate(`${link.url}${link.error ? ` (${link.error})` : ''}`, 120))),
    ];
  }

  if (moduleName === 'corsMisconfig') {
    return compactLines([
      kv('Access-Control-Allow-Origin', data.allowOrigin),
      kv('Access-Control-Allow-Credentials', data.allowCredentials),
      kv('Vulnerable', String(Boolean(data.vulnerable))),
      kv('Finding', data.finding),
    ]);
  }

  if (moduleName === 'ddosFirewall') {
    const statuses = data.responses.reduce((acc, item) => {
      const key = item.status || item.error || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return [
      kv('Requests', data.requests),
      kv('Rate limited/protected responses', data.rateLimited),
      kv('Average response time', `${data.avgResponseTimeMs}ms`),
      kv('Likely protected', String(Boolean(data.likelyProtected))),
      kv('Status distribution', Object.entries(statuses).map(([key, value]) => `${key}:${value}`).join(', ')),
    ];
  }

  return [JSON.stringify(data)];
};

const kv = (key, value) => `${color('dim', `${key}:`)} ${value === null || value === undefined || value === '' ? 'n/a' : value}`;
const compactLines = (lines) => lines.filter((line) => !line.endsWith(' n/a'));
const list = (items, limit = 12) => {
  if (!items || items.length === 0) return 'none';
  const values = (Array.isArray(items) ? items : [items]).map((item) => typeof item === 'string' ? item : JSON.stringify(item));
  const shown = values.slice(0, limit).join(', ');
  return values.length > limit ? `${shown}, +${values.length - limit} more` : shown;
};
const listLines = (items, limit = 12) => {
  if (!items || items.length === 0) return [kv('Items', 'none')];
  const shown = items.slice(0, limit).map((item) => kv('-', truncate(item, 120)));
  if (items.length > limit) shown.push(kv('More', `${items.length - limit} omitted`));
  return shown;
};
const truncate = (value, limit = 100) => {
  const text = String(value);
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
};
const formatEvents = (events = []) => events
  .slice(0, 5)
  .map((event) => kv(`Event ${event.eventAction || 'unknown'}`, event.eventDate));
const detectProtection = (response, body = '') => {
  const headers = Object.fromEntries(response.headers.entries());
  const server = String(headers.server || '').toLowerCase();
  const text = `${JSON.stringify(headers)}\n${body}`.toLowerCase();
  const providers = [];
  if (server.includes('cloudflare') || headers['cf-ray'] || headers['cf-cache-status'] || text.includes('cloudflare')) providers.push('Cloudflare');
  if (headers['x-sucuri-id'] || text.includes('sucuri')) providers.push('Sucuri');
  if (headers['x-akamai'] || headers['akamai-origin-hop'] || text.includes('akamai')) providers.push('Akamai');
  if (headers['x-amz-cf-id'] || headers.via?.includes('cloudfront')) providers.push('CloudFront');
  if (headers['x-waf'] || headers['x-cdn'] || headers['x-firewall']) providers.push('WAF/CDN');

  const challenge =
    [403, 429, 503].includes(response.status) ||
    text.includes('checking your browser') ||
    text.includes('cf-chl') ||
    text.includes('turnstile') ||
    text.includes('challenge-platform') ||
    text.includes('attention required');

  return {
    detected: providers.length > 0 || challenge,
    providers: [...new Set(providers)],
    challenged: challenge,
    status: response.status,
    note: challenge
      ? 'Target returned a protection or challenge response. Results may describe the edge challenge, not the origin application.'
      : 'No obvious CDN/WAF challenge detected.',
  };
};
const formatProtection = (protection) => {
  if (!protection) return null;
  const providerText = protection.providers?.length ? protection.providers.join(', ') : 'unknown provider';
  return protection.detected
    ? `${providerText}${protection.challenged ? ' challenge/protection response' : ' detected'}`
    : 'none detected';
};
const formatDnsRecords = (type, records = []) => {
  const normalizedRecords = Array.isArray(records) ? records : [records];
  return normalizedRecords.filter((record) => record !== null && record !== undefined).map((record) => {
  if (type === 'MX') return `${record.exchange} (${record.priority})`;
  if (type === 'SOA') return `${record.nsname || ''} ${record.hostmaster || ''}`.trim();
  if (Array.isArray(record)) return record.join(' ');
  return String(record);
  });
};

const summarize = (moduleName, result) => {
  if (!result.ok) return result.error;
  const data = result.data;
  if (data.skipped) return color('yellow', `skipped: ${data.reason}`);
  if (moduleName === 'siteInfo') return `${data.status} ${data.title || 'no title'}`;
  if (moduleName === 'headers') return `security ${data.security.score}/100 missing ${data.security.missing.length}`;
  if (moduleName === 'whois') return data.found ? `${data.registrar || 'registrar unknown'}` : 'not found';
  if (moduleName === 'geoip') return [data.city, data.country, data.org].filter(Boolean).join(', ') || 'no geo data';
  if (moduleName === 'dns') return `A ${data.A.length} MX ${data.MX.length} NS ${data.NS.length}`;
  if (moduleName === 'mx') return `${data.records.length} MX records`;
  if (moduleName === 'subnet') return data.cidr || 'no subnet';
  if (moduleName === 'subdomains') return `${data.found.length}/${data.checked} found`;
  if (moduleName === 'reverseip') return `${data.domains?.length || 0} domains`;
  if (moduleName === 'virustotal') return data.stats ? JSON.stringify(data.stats) : 'not configured';
  if (moduleName === 'sslTls') return data.validTo ? `valid to ${data.validTo}` : 'no cert data';
  if (moduleName === 'techStack') return data.detected.join(', ') || 'none detected';
  if (moduleName === 'seo') return `h1 ${data.h1Count}, img missing alt ${data.imgWithoutAlt}`;
  if (moduleName === 'ports') return `open ${data.filter((port) => port.open).map((port) => port.port).join(', ') || 'none'}`;
  if (['sqlinjection', 'xss', 'lfi'].includes(moduleName)) return `${data.findings.length} findings / ${data.tested} tests`;
  if (moduleName === 'wordpress') return data.isWordPress ? 'WordPress indicators found' : 'no WordPress indicators';
  if (moduleName === 'brokenLinks') return `${data.broken.length}/${data.checked} broken`;
  if (moduleName === 'corsMisconfig') return data.finding;
  if (moduleName === 'ddosFirewall') return `${data.rateLimited}/${data.requests} limited, avg ${data.avgResponseTimeMs}ms`;
  return '';
};

const profileFor = (modules) => {
  const activeCount = modules.filter((moduleName) => ACTIVE_MODULES.includes(moduleName)).length;
  const passiveCount = modules.length - activeCount;
  if (activeCount && passiveCount) return 'hybrid';
  if (activeCount) return 'active';
  return 'passive';
};

const applyAdaptiveAdjustments = (options, moduleResult) => {
  if (options.mode !== 'adaptive') return;
  const slow = moduleResult.durationMs > Math.max(2500, options.timeout * 0.75);
  const failed = !moduleResult.ok;
  if (slow || failed) {
    options.delay = Math.min(2000, Math.ceil(options.delay * 1.4));
    options.payloads = Math.max(5, Math.floor(options.payloads * 0.85));
    options.threads = Math.max(4, Math.floor(options.threads * 0.8));
    return;
  }
  if (moduleResult.durationMs < 750) {
    options.delay = Math.max(100, Math.floor(options.delay * 0.9));
    options.threads = Math.min(50, options.threads + 1);
  }
};

const resolveSafe = async (hostname, type, timeoutMs = 5000) => {
  if (isInterrupted()) return [];
  const resolver = new dns.Resolver();
  try {
    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolver.cancel();
        resolve([]);
      }, timeoutMs);
      timer.unref?.();
      const onShutdown = () => {
        clearTimeout(timer);
        resolver.cancel();
        resolve([]);
      };
      activeShutdownSignal?.addEventListener('abort', onShutdown, { once: true });

      resolver.resolve(hostname, type)
        .then((records) => {
          clearTimeout(timer);
          activeShutdownSignal?.removeEventListener('abort', onShutdown);
          resolve(records);
        })
        .catch(() => {
          clearTimeout(timer);
          activeShutdownSignal?.removeEventListener('abort', onShutdown);
          resolve([]);
        });
    });
  } catch {
    try {
      resolver.cancel();
    } catch {
      // Ignore resolver cancellation errors.
    }
    return [];
  }
};

const checkPort = (host, port, timeoutMs) => new Promise((resolve) => {
  if (isInterrupted()) {
    resolve({ port, open: false, responseTimeMs: null, error: 'interrupted' });
    return;
  }
  const started = performance.now();
  const socket = net.createConnection({ host, port });
  let finished = false;
  const onShutdown = () => finish(false, 'interrupted');
  const finish = (open, error = null) => {
    if (finished) return;
    finished = true;
    activeShutdownSignal?.removeEventListener('abort', onShutdown);
    socket.destroy();
    resolve({
      port,
      open,
      status: open ? 'open' : (error === 'timeout' ? 'filtered' : 'closed'),
      service: SERVICE_NAMES.get(port) || (WEB_PORTS.includes(port) ? 'HTTP' : 'Unknown'),
      responseTimeMs: open ? Math.round(performance.now() - started) : null,
      error,
    });
  };
  activeShutdownSignal?.addEventListener('abort', onShutdown, { once: true });
  socket.setTimeout(timeoutMs);
  socket.once('connect', () => finish(true));
  socket.once('timeout', () => finish(false, 'timeout'));
  socket.once('error', (error) => finish(false, error.code || error.message));
});

const loadPayloads = async (filename, limit) => {
  const file = new URL(`../src/payloads/${filename}`, import.meta.url);
  const payloads = JSON.parse(await fs.readFile(file, 'utf8'));
  return payloads.slice(0, limit);
};

const discoverParams = (target) => {
  const keys = [...target.url.searchParams.keys()];
  if (keys.length) return keys;
  return ['q', 'search', 'id', 'page', 'file', 'url'];
};

const defaultParamValue = (moduleName, param) => {
  if (moduleName === 'lfi') return ['file', 'page', 'include', 'path'].includes(param) ? 'index.php' : 'test';
  if (moduleName === 'sqlinjection') return param === 'id' ? '1' : 'test';
  return 'test';
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const extractEvidence = (body, indicator, limit = 220) => {
  if (!indicator) return truncate(body, limit);
  const plain = String(indicator).replace(/^\/|\/[a-z]*$/gi, '').replace(/\\/g, '');
  const index = body.toLowerCase().indexOf(plain.toLowerCase().slice(0, 40));
  if (index < 0) return truncate(body, limit);
  return truncate(body.slice(Math.max(0, index - 80), index + 140), limit);
};

const extractTitle = (html) => firstMatch(html, /<title[^>]*>([^<]+)<\/title>/i)?.trim() || null;
const firstMatch = (text, pattern) => text.match(pattern)?.[1] || null;
const countMatches = (text, pattern) => [...text.matchAll(pattern)].length;
const extractLinks = (html, baseUrl) => [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((match) => {
  try {
    return new URL(match[1], baseUrl).href;
  } catch {
    return null;
  }
}).filter(Boolean);
const sleep = (ms) => new Promise((resolve, reject) => {
  if (isInterrupted()) {
    reject(interruptedError());
    return;
  }
  const timer = setTimeout(() => {
    activeShutdownSignal?.removeEventListener('abort', onShutdown);
    resolve();
  }, ms);
  const onShutdown = () => {
    clearTimeout(timer);
    reject(interruptedError());
  };
  activeShutdownSignal?.addEventListener('abort', onShutdown, { once: true });
});

const interruptedError = () => {
  const error = new Error('Scan interrupted by user');
  error.code = 'ABSPIDER_INTERRUPTED';
  return error;
};
const isInterruptedError = (error) => error?.code === 'ABSPIDER_INTERRUPTED' || error?.message === 'Scan interrupted by user';
const isInterrupted = () => Boolean(activeShutdownSignal?.aborted);
const throwIfInterrupted = () => {
  if (isInterrupted()) throw interruptedError();
};

const installShutdownHandlers = (controller) => {
  const handler = (signalName) => {
    if (controller.signal.aborted) return;
    console.log('');
    console.log(color('yellow', `${signalName} received. Stopping after current cleanup and preserving partial results...`));
    controller.abort();
  };
  const onSigint = () => handler('SIGINT');
  const onSigterm = () => handler('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);
  return () => {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
  };
};

const main = async () => {
  let removeShutdownHandlers = null;
  try {
    const { target: rawTarget, options } = parseArgs(process.argv.slice(2));
    if (!options.color) colorEnabled = false;
    if (options.help) {
      console.log(getHelp());
      return;
    }
    if (options.version) {
      console.log(VERSION);
      return;
    }
    const target = normalizeTarget(rawTarget);
    const shutdownController = new AbortController();
    activeShutdownSignal = shutdownController.signal;
    removeShutdownHandlers = installShutdownHandlers(shutdownController);
    const results = await runScan(target, options);
    const json = JSON.stringify(results, null, options.pretty ? 2 : 0);
    if (options.output) await fs.writeFile(options.output, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
    if (options.json) console.log(json);
    else {
      printResults(results);
      if (options.output) console.log(`\nFull JSON written to ${options.output}`);
    }
    process.exitCode = results.interrupted ? 130 : (results.errors.length ? 2 : 0);
  } catch (error) {
    if (isInterruptedError(error)) {
      console.error(color('yellow', 'Scan interrupted by user.'));
      process.exitCode = 130;
      return;
    }
    console.error(color('red', `Error: ${error.message}`));
    console.error('Run with --help for usage.');
    process.exitCode = 1;
  } finally {
    removeShutdownHandlers?.();
    activeShutdownSignal = null;
  }
};

await main();
