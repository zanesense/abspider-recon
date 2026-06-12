#!/usr/bin/env node
import { spawn } from 'node:child_process';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import readline from 'node:readline/promises';
import tls from 'node:tls';
import { performance } from 'node:perf_hooks';
import { performWhoisLookup } from '../src/services/whoisService.js';
import { performGeoIPLookup } from '../src/services/geoipService.js';

const FALLBACK_VERSION = '2.1.3';
const PACKAGE_METADATA = await readPackageMetadata();
const VERSION = PACKAGE_METADATA.version || FALLBACK_VERSION;
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
  /unrecognized token/i, /database error/i, /query failed/i, /valid mysql result/i, /mysqlclient\./i,
  /mysql_connect/i, /mysql_query/i, /pg_exec/i, /pg_connect/i, /sqlserver jdbc driver/i,
  /microsoft ole db provider for sql server/i, /unclosed quotation mark after the character string/i,
  /missing expression/i, /sqlite3::/i, /syntax error near/i, /sql syntax.*error/i, /syntax error.*sql/i,
  /quoted identifier/i, /driver error/i,
];
const LFI_MARKERS = [
  /root:x:0:0:/i, /daemon:x:1:1:/i, /bin:x:2:2:/i, /nobody:x:/i, /\[boot loader\]/i, /\[extensions\]/i,
  /\[fonts\]/i, /DOCUMENT_ROOT/i, /LoadModule/i, /allow_url_include/i, /failed to open stream/i,
  /No such file or directory/i, /Permission denied/i, /include_path/i, /Warning.*include/i,
  /[a-z_][a-z0-9_-]*:[x*]:\d+:\d+:/i, /[a-z_][a-z0-9_-]*:\$[a-z0-9.$]+\$[a-z0-9.$]+\$[a-z0-9.$]+/i,
  /extension=/i, /disable_functions/i, /ServerRoot/i, /Listen \d+/i, /User-Agent: /i, /GET \//i,
  /failed opening/i, /require\(\): failed opening required/i, /Fatal error.*include/i, /file_get_contents/i,
  /fopen\(/i, /php:\/\/filter/i, /php:\/\/input/i, /data:\/\/text/i, /expect:\/\//i,
];
const MODE_PROFILES = {
  conservative: {
    start: { payloads: 5, delay: 750, threads: 6, ddosRequests: 5, ports: WEB_PORT_PROFILE, subdomainLimit: 50, ct: true },
    min: { payloads: 2, delay: 500, threads: 2, ddosRequests: 2, subdomainLimit: 20 },
    max: { payloads: 12, delay: 2500, threads: 8, ddosRequests: 8, subdomainLimit: 80 },
  },
  adaptive: {
    start: { payloads: 20, delay: 250, threads: 20, ddosRequests: 20, ports: COMMON_PORTS, subdomainLimit: 140, ct: true },
    min: { payloads: 5, delay: 150, threads: 4, ddosRequests: 5, subdomainLimit: 50 },
    max: { payloads: 45, delay: 3000, threads: 30, ddosRequests: 30, subdomainLimit: COMMON_SUBDOMAINS.length },
  },
  aggressive: {
    start: { payloads: 75, delay: 75, threads: 50, ddosRequests: 60, ports: FULL_PORT_PROFILE, subdomainLimit: COMMON_SUBDOMAINS.length, ct: true },
    min: { payloads: 10, delay: 100, threads: 6, ddosRequests: 8, subdomainLimit: 80 },
    max: { payloads: 120, delay: 4000, threads: 60, ddosRequests: 80, subdomainLimit: COMMON_SUBDOMAINS.length },
  },
};

const PASSIVE_MODULES = ['siteInfo', 'headers', 'whois', 'geoip', 'dns', 'mx', 'subnet', 'subdomains', 'reverseip', 'virustotal', 'sslTls', 'techStack', 'seo'];
const ACTIVE_MODULES = ['ports', 'sqlinjection', 'xss', 'lfi', 'wordpress', 'brokenLinks', 'corsMisconfig', 'ddosFirewall'];
const ALL_MODULES = [...PASSIVE_MODULES, ...ACTIVE_MODULES];
const DEFAULT_MODULES = [...PASSIVE_MODULES];

const SECURITY_HEADER_CHECKS = [
  {
    name: 'Strict-Transport-Security',
    key: 'strict-transport-security',
    severity: 'critical',
    recommendation: 'Enable HSTS with max-age of at least 31536000 seconds and includeSubDomains.',
    check: (value) => /max-age=(\d+)/i.test(value || '') && Number.parseInt(value.match(/max-age=(\d+)/i)?.[1] || '0', 10) >= 31536000 && /includesubdomains/i.test(value),
  },
  {
    name: 'Content-Security-Policy',
    key: 'content-security-policy',
    severity: 'critical',
    recommendation: 'Implement a strict CSP and avoid unsafe-inline/unsafe-eval where possible.',
    check: (value) => Boolean(value && value.length > 20 && !/unsafe-inline|unsafe-eval/i.test(value)),
  },
  {
    name: 'X-Frame-Options',
    key: 'x-frame-options',
    severity: 'high',
    recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN to reduce clickjacking risk.',
    check: (value) => ['DENY', 'SAMEORIGIN'].includes(String(value || '').toUpperCase()),
  },
  {
    name: 'X-Content-Type-Options',
    key: 'x-content-type-options',
    severity: 'high',
    recommendation: 'Set X-Content-Type-Options to nosniff.',
    check: (value) => String(value || '').toLowerCase() === 'nosniff',
  },
  {
    name: 'Referrer-Policy',
    key: 'referrer-policy',
    severity: 'medium',
    recommendation: 'Use no-referrer, same-origin, or strict-origin-when-cross-origin.',
    check: (value) => ['no-referrer', 'same-origin', 'strict-origin-when-cross-origin'].includes(String(value || '').toLowerCase()),
  },
  {
    name: 'Permissions-Policy',
    key: 'permissions-policy',
    severity: 'medium',
    recommendation: 'Restrict browser features with a Permissions-Policy header.',
    check: (value) => Boolean(value),
  },
  {
    name: 'X-XSS-Protection',
    key: 'x-xss-protection',
    severity: 'low',
    recommendation: 'Set legacy X-XSS-Protection to 1; mode=block where supported.',
    check: (value) => String(value || '').toLowerCase() === '1; mode=block',
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    key: 'cross-origin-embedder-policy',
    severity: 'high',
    recommendation: 'Set Cross-Origin-Embedder-Policy to require-corp when cross-origin isolation is needed.',
    check: (value) => String(value || '').toLowerCase() === 'require-corp',
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    key: 'cross-origin-opener-policy',
    severity: 'high',
    recommendation: 'Set Cross-Origin-Opener-Policy to same-origin or same-origin-allow-popups.',
    check: (value) => ['same-origin', 'same-origin-allow-popups'].includes(String(value || '').toLowerCase()),
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    key: 'cross-origin-resource-policy',
    severity: 'medium',
    recommendation: 'Set Cross-Origin-Resource-Policy to same-origin or same-site.',
    check: (value) => ['same-origin', 'same-site'].includes(String(value || '').toLowerCase()),
  },
];

const WP_SENSITIVE_FILES = ['wp-config.php', 'wp-config.php.bak', 'readme.html', 'license.txt', 'wp-content/debug.log', 'xmlrpc.php'];

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
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

let colorEnabled = process.stdout.isTTY;
let activeShutdownSignal = null;
const color = (name, value) => colorEnabled ? `${palette[name]}${value}${palette.reset}` : value;
const ansi = (code, value) => colorEnabled ? `\x1b[${code}m${value}${palette.reset}` : value;
const labelPill = (value) => colorEnabled ? ansi('30;44', ` ${value} `) : value;
const rail = (name, symbol) => color(name, symbol);
const muted = (value) => color('gray', value);
const writeRail = (symbol, text = '', symbolColor = 'gray') => console.log(`${rail(symbolColor, symbol)}  ${text}`.trimEnd());
const clearTerminal = () => {
  if (process.stdout.isTTY) process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
};
const envValue = (...names) => names.map((name) => process.env[name]).find((value) => value && value.trim());
async function readPackageMetadata() {
  try {
    const packageUrl = new URL('../package.json', import.meta.url);
    return JSON.parse(await fs.readFile(packageUrl, 'utf8'));
  } catch {
    return { version: FALLBACK_VERSION };
  }
}

const BANNER_LINES = [
  '          █████                        ███      █████                   ',
  '         ▒▒███                        ▒▒▒      ▒▒███                    ',
  '  ██████   ▒███████   █████  ████████  ████   ███████   ██████  ████████ ',
  ' ▒▒▒▒▒███  ▒███▒▒███ ███▒▒  ▒▒███▒▒███▒▒███  ███▒▒███  ███▒▒███▒▒███▒▒███',
  '  ███████  ▒███ ▒███▒▒█████  ▒███ ▒███ ▒███ ▒███ ▒███ ▒███████  ▒███ ▒▒▒ ',
  ' ███▒▒███  ▒███ ▒███ ▒▒▒▒███ ▒███ ▒███ ▒███ ▒███ ▒███ ▒███▒▒▒   ▒███     ',
  '▒▒████████ ████████  ██████  ▒███████  █████▒▒████████▒▒██████  █████    ',
  ' ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒   ▒███▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒  ▒▒▒▒▒     ',
  '                             ▒███                                        ',
  '                             █████                                       ',
  '                            ▒▒▒▒▒                                        \n',
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
  index % 2 === 0 ? [66, 153, 225] : [56, 189, 248],
  index % 2 === 0 ? [34, 197, 94] : [148, 163, 184],
)).join('\n')}
${color('bold', '  ABSpider Recon CLI')} ${muted(`v${VERSION}`)}  ${color('blue', 'Authorized Security Recon')}
${muted('  Passive intelligence gathering + active vulnerability scanning for authorized targets.')}
`;

const cliSchemeBanner = () => {
  const lines = BANNER_LINES.map((line, index) => gradient(
    line,
    index % 2 === 0 ? [66, 153, 225] : [56, 189, 248],
    index % 2 === 0 ? [34, 197, 94] : [148, 163, 184],
  )).join('\n');
  return `${lines}
${color('bold', '  ABSpider Recon CLI')} ${muted(`v${VERSION}`)}  ${color('blue', 'Authorized Security Recon')}
${muted('  Passive intelligence gathering + active vulnerability scanning.')}
`;
};

const compactBanner = () => {
  writeRail('┌', labelPill('abspider'));
  writeRail('│');
};

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
  --interactive, -i      Prompt for target, profile, modules, and scan settings.
  --update               Check npm and update abspider, then exit if no target is provided.
  --no-update            Disable the npm auto-update check for this run.
  --help                 Show this help.
  --version              Show version.

Examples:
  abspider example.com
  abspider --interactive
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
    update: true,
    forceUpdate: false,
    interactive: false,
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
    else if (arg === '--interactive' || arg === '-i') options.interactive = true;
    else if (arg === '--update') options.forceUpdate = true;
    else if (arg === '--no-update') options.update = false;
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
  if (!MODE_PROFILES[mode]) throw new Error(`Unknown mode: ${value}. Use conservative, adaptive, or aggressive.`);
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
  const profile = MODE_PROFILES[options.mode];
  const defaults = profile.start;
  for (const key of ['payloads', 'delay', 'threads', 'ddosRequests', 'subdomainLimit']) {
    if (!options.explicit.has(key)) options[key] = defaults[key];
  }
  if (!options.explicit.has('ports')) options.ports = [...defaults.ports];
  if (options.ct === true) options.ct = defaults.ct;
  options.safety = buildSafetyLimits(options, profile);
};

const buildSafetyLimits = (options, profile) => {
  const explicit = options.explicit;
  return {
    profile: options.mode,
    minDelay: explicit.has('delay') ? options.delay : profile.min.delay,
    maxDelay: profile.max.delay,
    minThreads: explicit.has('threads') ? Math.min(options.threads, profile.min.threads) : profile.min.threads,
    maxThreads: explicit.has('threads') ? options.threads : profile.max.threads,
    minPayloads: explicit.has('payloads') ? Math.min(options.payloads, profile.min.payloads) : profile.min.payloads,
    maxPayloads: explicit.has('payloads') ? options.payloads : profile.max.payloads,
    minDdosRequests: explicit.has('ddosRequests') ? Math.min(options.ddosRequests, profile.min.ddosRequests) : profile.min.ddosRequests,
    maxDdosRequests: explicit.has('ddosRequests') ? options.ddosRequests : profile.max.ddosRequests,
    stressEvents: 0,
    reliefEvents: 0,
  };
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
  if (/\s/.test(input)) throw new Error('Invalid target: URLs and hostnames cannot contain whitespace.');
  const urlText = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(input) ? input : `https://${input}`;
  let url;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error(`Invalid target URL: ${input}`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Invalid target protocol: ${url.protocol.replace(':', '')}. Use http or https.`);
  }
  if (url.username || url.password) {
    throw new Error('Invalid target: credentials in URLs are not supported.');
  }
  if (!isValidTargetHostname(url.hostname)) {
    throw new Error(`Invalid target hostname: ${url.hostname || input}`);
  }
  return {
    input,
    url,
    origin: url.origin,
    hostname: url.hostname,
    domain: url.hostname.replace(/^www\./i, ''),
    port: url.port ? Number.parseInt(url.port, 10) : (url.protocol === 'http:' ? 80 : 443),
  };
};

const isValidTargetHostname = (hostname) => {
  const host = String(hostname || '').toLowerCase();
  const bareHost = host.replace(/^\[/, '').replace(/\]$/, '');
  if (!host || host.length > 253) return false;
  if (host === 'localhost') return true;
  if (net.isIP(bareHost)) return true;
  if (!host.includes('.')) return false;
  return host.split('.').every((label) =>
    label.length >= 1 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
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
  const securityHeaders = analyzeSecurityHeaders(headers);
  return {
    status: response.status,
    statusCode: response.status,
    headers,
    securityHeaders,
    security: {
      score: securityHeaders.score,
      grade: securityHeaders.grade,
      present: securityHeaders.present.map((header) => header.name),
      missing: securityHeaders.missing.map((header) => header.name),
    },
    cookies: analyzeCookies(response.headers.get('set-cookie')),
    cacheControl: analyzeCacheControl(headers['cache-control']),
    cors: analyzeCorsHeaders(headers),
    protection: detectProtection(response),
  };
};

const runWhois = async (target, options) => {
  const data = await performWhoisLookup(target.domain, {
    timeout: options.timeout,
    securitytrailsKey: envValue('SECURITYTRAILS_API_KEY', 'VITE_SECURITYTRAILS_API_KEY'),
  });
  return data;
};

const runGeoIp = async (target, options) => {
  const data = await performGeoIPLookup(target.domain, {
    timeout: options.timeout,
    opencageKey: envValue('OPENCAGE_API_KEY', 'VITE_OPENCAGE_API_KEY'),
  });
  return data;
};

const runDns = async (target) => {
  const records = {};
  await Promise.all(['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'].map(async (type) => {
    records[type] = await resolveSafe(target.hostname, type);
  }));
  return records;
};

const runMx = async (target) => {
  const mxRecords = await resolveSafe(target.domain, 'MX');
  const enriched = await Promise.all(mxRecords.map(async (record) => ({
    ...record,
    ip: record.exchange ? (await resolveSafe(record.exchange, 'A'))[0] : undefined,
  })));
  const txtRecords = (await resolveSafe(target.domain, 'TXT')).flat().map((record) => Array.isArray(record) ? record.join('') : String(record).replace(/^"|"$/g, ''));
  const dmarcRecords = (await resolveSafe(`_dmarc.${target.domain}`, 'TXT')).flat().map((record) => Array.isArray(record) ? record.join('') : String(record).replace(/^"|"$/g, ''));
  const spfRecord = txtRecords.find((record) => /^v=spf1/i.test(record));
  const dmarcRecord = dmarcRecords.find((record) => /^v=DMARC1/i.test(record));
  return { domain: target.domain, records: enriched, mxRecords: enriched, spfRecord, dmarcRecord };
};

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
  const key = envValue('SECURITYTRAILS_API_KEY', 'VITE_SECURITYTRAILS_API_KEY');
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
  const key = envValue('VIRUSTOTAL_API_KEY', 'VITE_VIRUSTOTAL_API_KEY');
  if (!key) return { skipped: true, reason: 'Set VIRUSTOTAL_API_KEY or VITE_VIRUSTOTAL_API_KEY to enable this module.' };
  const errors = [];
  const result = { tested: true, domain: target.domain, errors };
  const vtRequest = async (pathName) => {
    const response = await request(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(target.domain)}${pathName}`, {
      method: 'GET',
      headers: { 'x-apikey': key, accept: 'application/json' },
    }, Math.max(options.timeout, 15000));
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `VirusTotal ${pathName || '/'} returned HTTP ${response.status}`);
    }
    return { response, data };
  };

  try {
    const { response, data } = await vtRequest('');
    const attributes = data.data?.attributes || {};
    result.status = response.status;
    result.stats = attributes.last_analysis_stats || null;
    result.reputation = attributes.reputation ?? null;
    result.lastAnalysisDate = attributes.last_analysis_date ? new Date(attributes.last_analysis_date * 1000).toISOString() : undefined;
    result.maliciousVotes = attributes.last_analysis_stats?.malicious || 0;
    result.harmlessVotes = attributes.last_analysis_stats?.harmless || 0;
    result.categories = Object.values(attributes.categories || {});
    result.registrar = attributes.registrar;
    result.whois = attributes.whois;
  } catch (error) {
    errors.push(`Domain report: ${error.message}`);
  }

  try {
    const { data } = await vtRequest('/detected_urls');
    result.detectedUrls = (data.data || []).map((item) => ({
      url: item.id,
      positives: item.attributes?.last_analysis_stats?.malicious || 0,
      total: Object.keys(item.attributes?.last_analysis_results || {}).length,
    }));
  } catch (error) {
    errors.push(`Detected URLs: ${error.message}`);
  }

  try {
    const { data } = await vtRequest('/communicating_files');
    result.detectedCommunicatingFiles = (data.data || []).map((item) => ({
      sha256: item.id,
      filename: item.attributes?.meaningful_name || 'N/A',
      positives: item.attributes?.last_analysis_stats?.malicious || 0,
    }));
  } catch (error) {
    errors.push(`Communicating files: ${error.message}`);
  }

  return result;
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
  const technologies = detectTechStackDetailed(text, headers);
  const localDetected = technologies.map((item) => item.name);
  const builtWith = await lookupBuiltWithTechStack(target, options);
  const detected = [...new Set([...localDetected, ...(builtWith.technologies || []).map((item) => item.name)])];
  return {
    detected,
    localDetected,
    technologies: mergeTechnologies(technologies, builtWith.technologies || []),
    builtWith,
    generator: firstMatch(text, /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i),
    protection,
  };
};

const lookupBuiltWithTechStack = async (target, options) => {
  const key = envValue('BUILTWITH_API_KEY', 'VITE_BUILTWITH_API_KEY');
  if (!key) return { enabled: false };
  try {
    const url = `https://api.builtwith.com/v21/api.json?KEY=${encodeURIComponent(key)}&LOOKUP=${encodeURIComponent(target.domain)}`;
    const response = await request(url, { method: 'GET', headers: { accept: 'application/json' } }, Math.max(options.timeout, 15000));
    const data = await response.json();
    if (!response.ok || data.Errors?.length) {
      const reason = data.Errors?.map((error) => error.Message || error.Error || String(error)).join('; ') || `HTTP ${response.status}`;
      return { enabled: true, ok: false, status: response.status, reason };
    }
    const technologies = extractBuiltWithTechnologies(data);
    return {
      enabled: true,
      ok: true,
      status: response.status,
      source: 'builtwith.com',
      technologies,
      count: technologies.length,
    };
  } catch (error) {
    return { enabled: true, ok: false, reason: error.message };
  }
};

const extractBuiltWithTechnologies = (data) => {
  const seen = new Map();
  const add = (technology, pathSource) => {
    const name = technology?.Name || technology?.name || technology?.Technology || technology?.technology;
    if (!name) return;
    const categories = [
      ...normalizeBuiltWithList(technology.Tag),
      ...normalizeBuiltWithList(technology.Categories),
      ...normalizeBuiltWithList(technology.Category),
    ];
    const key = String(name).toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, {
        name: String(name),
        categories: [...new Set(categories.map(String).filter(Boolean))],
        description: technology.Description || technology.description || null,
        firstDetected: technology.FirstDetected || technology.firstDetected || null,
        lastDetected: technology.LastDetected || technology.lastDetected || null,
        sourcePath: pathSource || null,
      });
    } else {
      const current = seen.get(key);
      current.categories = [...new Set([...current.categories, ...categories.map(String).filter(Boolean)])];
      current.sourcePath ||= pathSource || null;
    }
  };

  for (const result of data.Results || data.results || []) {
    const paths = result.Result?.Paths || result.result?.paths || result.Paths || result.paths || [];
    for (const pathEntry of paths) {
      const pathSource = pathEntry.Url || pathEntry.url || pathEntry.Path || pathEntry.path || null;
      for (const technology of pathEntry.Technologies || pathEntry.technologies || []) add(technology, pathSource);
    }
    for (const technology of result.Result?.Technologies || result.result?.technologies || result.Technologies || result.technologies || []) add(technology, null);
  }
  for (const technology of data.Technologies || data.technologies || []) add(technology, null);

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const normalizeBuiltWithList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => typeof item === 'string' ? [item] : [item?.Name, item?.name, item?.Tag, item?.tag]).filter(Boolean);
  }
  return [value];
};

const mergeTechnologies = (localTechnologies, builtWithTechnologies) => {
  const merged = new Map();
  for (const item of localTechnologies) {
    merged.set(item.name.toLowerCase(), item);
  }
  for (const item of builtWithTechnologies) {
    const key = item.name.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, {
        name: item.name,
        category: item.categories?.[0] || 'BuiltWith',
        categories: item.categories || [],
        confidence: 1,
        evidence: item.description || 'BuiltWith API',
        firstDetected: item.firstDetected,
        lastDetected: item.lastDetected,
      });
    }
  }
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const serverTechnologyName = (value) => {
  const text = String(value);
  if (/nginx/i.test(text)) return 'Nginx';
  if (/apache/i.test(text)) return 'Apache HTTP Server';
  if (/microsoft-iis/i.test(text)) return 'Microsoft IIS';
  if (/cloudflare/i.test(text)) return 'Cloudflare';
  if (/gws/i.test(text)) return 'Google Web Server';
  if (/envoy/i.test(text)) return 'Envoy Proxy';
  return `Server: ${text}`;
};

const poweredByTechnologyName = (value) => {
  const text = String(value);
  if (/php/i.test(text)) return 'PHP';
  if (/asp\.net/i.test(text)) return 'ASP.NET';
  if (/express/i.test(text)) return 'Express.js';
  if (/next\.?js/i.test(text)) return 'Next.js';
  if (/vercel/i.test(text)) return 'Vercel';
  return `Powered by: ${text}`;
};

const detectTechStack = (text, headers) => {
  return detectTechStackDetailed(text, headers).map((item) => item.name);
};

const detectTechStackDetailed = (text, headers) => {
  const headerText = JSON.stringify(headers);
  const checks = [
    ['WordPress', 'CMS/Framework', /wp-content|wp-includes|wordpress/i, 'WordPress marker in HTML'],
    ['React', 'Library/Framework', /react|data-reactroot|__REACT_DEVTOOLS_GLOBAL_HOOK__|react\.production\.min\.js/i, 'React marker in HTML/script'],
    ['Vue.js', 'Library/Framework', /vue(?:\.runtime)?\.js|vue\.min\.js|data-v-|vue-app/i, 'Vue marker in HTML/script'],
    ['Angular', 'Library/Framework', /ng-version|angular|angular\.min\.js/i, 'Angular marker in HTML/script'],
    ['jQuery', 'Library/Framework', /jquery/i, 'jQuery marker in HTML/script'],
    ['Bootstrap', 'CSS Framework', /bootstrap(?:\.min)?\.css/i, 'Bootstrap stylesheet marker'],
    ['Tailwind CSS', 'CSS Framework', /tailwind(?:\.min)?\.css|tailwind/i, 'Tailwind marker'],
    ['Google Analytics', 'Analytics', /google-analytics|gtag\(|G-[A-Z0-9]+/i, 'Google Analytics marker'],
    ['Google Tag Manager', 'Analytics', /gtm\.js|googletagmanager/i, 'Google Tag Manager marker'],
    ['Cloudflare', 'CDN/WAF', /cloudflare|cf-ray|cf-cache-status/i, 'Cloudflare header/body marker'],
    ['Akamai', 'CDN/WAF', /akamai/i, 'Akamai header/body marker'],
    ['Fastly', 'CDN/Cache', /fastly/i, 'Fastly header/body marker'],
    ['Varnish Cache', 'CDN/Cache', /varnish/i, 'Varnish cache marker'],
    ['Font Awesome', 'Icon Library', /font-awesome/i, 'Font Awesome marker'],
    ['Shopify', 'CMS/Ecommerce', /shopify/i, 'Shopify marker'],
    ['Joomla', 'CMS', /joomla/i, 'Joomla marker'],
    ['Drupal', 'CMS', /drupal/i, 'Drupal marker'],
  ];

  const detected = [];
  const add = (technology) => {
    if (!detected.some((item) => item.name.toLowerCase() === technology.name.toLowerCase())) detected.push(technology);
  };
  for (const [name, category, pattern, evidence] of checks) {
    if (pattern.test(text) || pattern.test(headerText)) add({ name, category, confidence: /header/i.test(evidence) ? 1 : 0.8, evidence });
  }
  if (headers.server) {
    add({ name: serverTechnologyName(headers.server), category: 'Web Server', confidence: 1, evidence: `Server header: ${headers.server}` });
  }
  if (headers['x-powered-by']) {
    add({ name: poweredByTechnologyName(headers['x-powered-by']), category: 'Framework/Language', confidence: 1, evidence: `X-Powered-By header: ${headers['x-powered-by']}` });
  }
  const generator = firstMatch(text, /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
  if (generator) add({ name: generator, category: 'CMS/Generator', confidence: 1, evidence: `Meta generator: ${generator}` });
  return detected;
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
  const workerCount = Math.min(options.threads, queue.length);
  options.log?.(`port scan queued ${queue.length} ports with ${workerCount} workers`);
  const workers = Array.from({ length: Math.min(options.threads, queue.length) }, async () => {
    while (queue.length && !isInterrupted()) {
      const port = queue.shift();
      const result = await checkPort(target.hostname, port, options.timeout);
      results.push(result);
      if (result.open) options.log?.(`open port ${result.port}/${result.service || 'Unknown'} in ${result.responseTimeMs}ms`);
    }
  });
  await Promise.all(workers);
  const open = results.filter((port) => port.open).length;
  options.log?.(`port scan complete: ${open} open, ${results.length - open} closed or filtered`);
  return results.sort((a, b) => a.port - b.port);
};

const runSqlInjection = async (target, options) => {
  const payloads = await loadPayloads('sqli.json', options.payloads);
  const result = await runPayloadProbe(target, options, payloads, (body, payload, response, baseline, context) => {
    const matched = SQL_ERRORS.find((pattern) => pattern.test(body));
    if (matched) return { found: true, indicator: firstRegexMatch(body, matched) || String(matched), confidence: 0.9 };
    if (payload.type?.includes('Time-based Blind') && context.durationMs >= 4500) {
      return { found: true, indicator: `Response delayed by ${context.durationMs}ms`, confidence: 1 };
    }
    if (baseline?.status && response.status >= 500 && response.status !== baseline.status) {
      return { found: true, indicator: `HTTP ${response.status} differs from baseline ${baseline.status}`, confidence: 0.85 };
    }
    if (baseline?.length && body !== baseline.body) {
      const sizeDiff = Math.abs(body.length - baseline.length);
      const percentDiff = (sizeDiff / Math.max(1, baseline.length)) * 100;
      if (percentDiff > 20 || sizeDiff > 500) {
        return {
          found: true,
          indicator: `Content length changed significantly (${percentDiff.toFixed(1)}%, ${sizeDiff} bytes)`,
          confidence: 0.75,
        };
      }
    }
    return { found: false };
  }, 'sqlinjection');
  const blindFindings = await runBooleanBlindSqlChecks(target, options, result.injectionPoints, result.baseline);
  for (const finding of blindFindings) {
    if (!result.findings.some((item) => item.param === finding.param && item.type === finding.type)) result.findings.unshift(finding);
  }
  result.vulnerable = result.findings.length > 0;
  result.vulnerabilities = result.findings;
  result.testedPayloads = result.tested;
  result.method = 'Error-based, Time-based, Boolean Blind, and Heuristic Analysis';
  return result;
};

const runXss = async (target, options) => {
  const payloads = await loadPayloads('xss.json', options.payloads);
  return runPayloadProbe(target, options, payloads, (body, payload) => {
    const reflection = checkXssReflection(body, payload.payload);
    return reflection.reflected && reflection.exploitable && reflection.confidence >= 0.7
      ? { found: true, indicator: reflection.context, confidence: reflection.confidence }
      : { found: false };
  }, 'xss');
};

const runLfi = async (target, options) => {
  const payloads = await loadPayloads('lfi.json', options.payloads);
  return runPayloadProbe(target, options, payloads, (body, payload, response, baseline) => {
    const signature = checkLfiSignature(body);
    if (signature.found) return { found: true, indicator: signature.pattern, confidence: signature.confidence };
    if (baseline?.length) {
      const sizeDiff = Math.abs(body.length - baseline.length);
      const percentDiff = (sizeDiff / Math.max(1, baseline.length)) * 100;
      if (percentDiff > 50 && body.length > baseline.length && body.length < 100000) {
        return { found: true, indicator: `Significant response size increase (${percentDiff.toFixed(1)}%)`, confidence: 0.75 };
      }
    }
    if (baseline?.status && response.status !== baseline.status && response.status >= 500) {
      return { found: true, indicator: `HTTP ${response.status} differs from baseline ${baseline.status}`, confidence: 0.75 };
    }
    return { found: false };
  }, 'lfi');
};

const runPayloadProbe = async (target, options, payloads, isFinding, moduleName) => {
  const injectionPoints = discoverInjectionPoints(target, moduleName);
  const findings = [];
  const errors = [];
  let tested = 0;
  let baseline = null;
  options.log?.(`loaded ${payloads.length} payloads from ${moduleNamePayloadFile(moduleName)}`);
  options.log?.(`using ${injectionPoints.length} query injection point${injectionPoints.length === 1 ? '' : 's'}`);
  try {
    options.log?.('capturing baseline response');
    const baselineResponse = await request(target.url.href, { method: 'GET' }, options.timeout);
    const baselineBody = await baselineResponse.text();
    baseline = { status: baselineResponse.status, length: baselineBody.length, body: baselineBody };
    options.log?.(`baseline captured: HTTP ${baseline.status}, ${baseline.length} bytes`);
  } catch {
    baseline = null;
    options.log?.('baseline request failed; continuing without comparison');
  }
  for (const injectionPoint of injectionPoints) {
    options.log?.(`testing ${formatInjectionPoint(injectionPoint)} with base value "${injectionPoint.baseValue}"`);
    for (let payloadIndex = 0; payloadIndex < payloads.length; payloadIndex += 1) {
      if (payloadIndex >= options.payloads) {
        options.log?.(`payload budget reduced to ${options.payloads}; skipping remaining payloads for ${formatInjectionPoint(injectionPoint)}`);
        break;
      }
      const payload = payloads[payloadIndex];
      throwIfInterrupted();
      const url = buildPayloadUrl(target, injectionPoint, payload.payload);
      options.log?.(`sending ${payload.type || 'payload'} to ${formatInjectionPoint(injectionPoint)}: ${formatPayloadForLog(payload.payload)}`);
      try {
        const requestStarted = performance.now();
        const response = await request(url.href, { method: 'GET' }, options.timeout);
        const body = await response.text();
        tested += 1;
        tunePacingFromSample(options, {
          status: response.status,
          durationMs: Math.round(performance.now() - requestStarted),
          moduleName,
        });
        const detection = isFinding(body, payload, response, baseline, {
          durationMs: Math.round(performance.now() - requestStarted),
          url,
          injectionPoint,
        });
        if (detection.found && detection.confidence >= 0.7) {
          options.log?.(`finding candidate at ${formatInjectionPoint(injectionPoint)} with ${payload.type || 'payload'} (${Math.round(detection.confidence * 100)}% confidence)`);
          findings.push({
            param: injectionPoint.name,
            injectionPoint: injectionPoint.type,
            url: url.href,
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
        errors.push({ param: injectionPoint.name, injectionPoint: injectionPoint.type, payload: payload.payload, error: error.message });
        options.log?.(`request error at ${formatInjectionPoint(injectionPoint)}: ${error.message}`);
        tunePacingFromSample(options, { error: error.message, moduleName });
      }
      await sleep(options.delay);
    }
    options.log?.(`finished ${formatInjectionPoint(injectionPoint)} (${tested} requests tested so far)`);
  }
  options.log?.(`${moduleName} probe complete: ${tested} requests, ${findings.length} findings, ${errors.length} errors`);
  return { module: moduleName, tested, params: injectionPoints.map((point) => point.name), injectionPoints, findings, vulnerabilities: findings, vulnerable: findings.length > 0, testedPayloads: tested, errors, baseline };
};

const runWordPress = async (target, options, cache) => {
  const paths = ['/wp-login.php', '/wp-admin/', '/wp-json/', '/xmlrpc.php', '/wp-content/'];
  const checks = [];
  const sensitiveFiles = [];
  const vulnerabilities = [];
  const plugins = [];
  const themes = [];
  const { text } = await getHtml(target, options, cache).catch(() => ({ text: '' }));
  options.log?.(`checking ${paths.length} WordPress indicator paths`);
  for (const path of paths) {
    options.log?.(`requesting ${path}`);
    const response = await request(new URL(path, target.origin).href, { method: 'GET' }, options.timeout).catch((error) => ({ error }));
    checks.push(response.error ? { path, ok: false, error: response.error.message } : { path, ok: response.ok, status: response.status });
    const latest = checks.at(-1);
    options.log?.(latest.error ? `${path} error: ${latest.error}` : `${path} returned HTTP ${latest.status}`);
  }
  const isWordPress = /wp-content|wp-includes|wordpress/i.test(text) || checks.some((check) => check.ok) || checks.some((check) => [401, 403].includes(check.status));
  const version = firstMatch(text, /wordpress\s+(\d+\.\d+(?:\.\d+)?)/i) || firstMatch(text, /<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([^"']+)["']/i);
  if (isWordPress) {
    for (const file of WP_SENSITIVE_FILES) {
      const url = new URL(file, `${target.origin}/`);
      options.log?.(`checking WordPress sensitive file ${file}`);
      const response = await request(url.href, { method: 'HEAD' }, Math.min(options.timeout, 5000)).catch((error) => ({ error }));
      if (!response.error && response.ok) {
        const size = response.headers.get('content-length');
        sensitiveFiles.push({ path: file, accessible: true, size: size ? Number.parseInt(size, 10) : undefined });
      }
    }

    for (const match of text.matchAll(/wp-content\/plugins\/([^\/'")\s?]+)/gi)) {
      if (!plugins.includes(match[1])) plugins.push(match[1]);
    }
    for (const match of text.matchAll(/wp-content\/themes\/([^\/'")\s?]+)/gi)) {
      if (!themes.includes(match[1])) themes.push(match[1]);
    }
    if (version && Number.parseFloat(version) < 6) {
      vulnerabilities.push({ title: 'Outdated WordPress Version', severity: 'high', description: `WordPress ${version} is outdated. Update recommended.` });
    }
    if (sensitiveFiles.some((file) => file.path === 'xmlrpc.php')) {
      vulnerabilities.push({ title: 'XML-RPC Enabled', severity: 'medium', description: 'XML-RPC is accessible and can be used for brute force amplification.' });
    }
    if (sensitiveFiles.some((file) => file.path.includes('debug.log'))) {
      vulnerabilities.push({ title: 'Debug Log Exposed', severity: 'high', description: 'Debug log file is publicly accessible and may contain sensitive information.' });
    }
    if (sensitiveFiles.some((file) => file.path.includes('wp-config'))) {
      vulnerabilities.push({ title: 'Configuration File Exposed', severity: 'high', description: 'WordPress configuration file or backup is accessible.' });
    }
  }
  options.log?.(isWordPress ? 'WordPress indicators found' : 'no WordPress indicators found');
  return { isWordPress, version, checks, sensitiveFiles, plugins, themes, vulnerabilities };
};

const runBrokenLinks = async (target, options, cache) => {
  const { text } = await getHtml(target, options, cache);
  const links = [...new Set(extractLinks(text, target.origin))].slice(0, 75);
  options.log?.(`extracted ${links.length} links to validate`);
  let completed = 0;
  const checked = await Promise.all(links.map(async (url) => {
    try {
      const response = await request(url, { method: 'HEAD' }, options.timeout);
      completed += 1;
      if (!response.ok) options.log?.(`broken candidate ${response.status}: ${truncate(url, 80)}`);
      else if (completed % 10 === 0 || completed === links.length) options.log?.(`checked ${completed}/${links.length} links`);
      return { url, status: response.status, ok: response.ok };
    } catch (error) {
      completed += 1;
      options.log?.(`link error: ${truncate(url, 80)} (${error.message})`);
      return { url, status: null, ok: false, error: error.message };
    }
  }));
  options.log?.(`link validation complete: ${checked.filter((link) => !link.ok).length} broken`);
  return { checked: checked.length, broken: checked.filter((link) => !link.ok) };
};

const runCorsMisconfig = async (target, options) => {
  const testOrigin = 'https://attacker.example';
  options.log?.(`sending CORS probe with Origin: ${testOrigin}`);
  const response = await request(target.origin, { method: 'GET', headers: { origin: testOrigin } }, options.timeout);
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const allowCredentials = response.headers.get('access-control-allow-credentials');
  const vulnerable = allowOrigin === '*' || allowOrigin === testOrigin;
  options.log?.(`CORS response: allow-origin=${allowOrigin || 'none'}, credentials=${allowCredentials || 'none'}`);
  return { allowOrigin, allowCredentials, vulnerable, finding: vulnerable ? 'Arbitrary-origin or wildcard CORS behavior detected.' : 'No obvious arbitrary-origin CORS behavior detected.' };
};

const runDdosFirewall = async (target, options) => {
  const responses = [];
  options.log?.(`starting bounded WAF/rate-limit probe with ${options.ddosRequests} HEAD requests`);
  for (let i = 0; i < options.ddosRequests; i += 1) {
    throwIfInterrupted();
    const started = performance.now();
    try {
      const response = await request(target.origin, { method: 'HEAD' }, options.timeout);
      responses.push({ status: response.status, responseTimeMs: Math.round(performance.now() - started), rateLimited: [403, 429, 503].includes(response.status) });
      options.log?.(`probe ${i + 1}/${options.ddosRequests}: HTTP ${response.status} in ${responses.at(-1).responseTimeMs}ms`);
      tunePacingFromSample(options, { status: response.status, durationMs: responses.at(-1).responseTimeMs, moduleName: 'ddosFirewall' });
    } catch (error) {
      responses.push({ error: error.message, rateLimited: true });
      options.log?.(`probe ${i + 1}/${options.ddosRequests}: ${error.message}`);
      tunePacingFromSample(options, { error: error.message, moduleName: 'ddosFirewall' });
    }
    await sleep(options.delay);
  }
  const rateLimited = responses.filter((item) => item.rateLimited).length;
  const avgResponseTimeMs = Math.round(responses.filter((item) => item.responseTimeMs).reduce((sum, item) => sum + item.responseTimeMs, 0) / Math.max(1, responses.filter((item) => item.responseTimeMs).length));
  options.log?.(`WAF/rate-limit probe complete: ${rateLimited}/${responses.length} protected responses`);
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

  results.safety = await calibrateTargetSafety(target, options);
  if (!options.json) printRunHeader(target, options);

  for (let index = 0; index < options.modules.length; index += 1) {
    if (!options.json && index > 0) await sleep(options.interModuleDelay ?? 350);
    if (isInterrupted()) {
      results.interrupted = true;
      results.errors.push('Scan interrupted by user');
      break;
    }
    const moduleName = options.modules[index];
    const started = performance.now();
    const progress = options.json ? null : startModuleProgress(moduleName, index + 1, options.modules.length);
    const moduleOptions = progress && ACTIVE_MODULES.includes(moduleName)
      ? { ...options, log: progress.log }
      : options;
    try {
      const data = await MODULE_RUNNERS[moduleName](target, moduleOptions, cache);
      results.modules[moduleName] = { ok: true, type: ACTIVE_MODULES.includes(moduleName) ? 'active' : 'passive', durationMs: Math.round(performance.now() - started), data };
      if (progress) progress.stop(true, results.modules[moduleName].durationMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorCode = (error instanceof Error && error.code) ? String(error.code) : null;
      if (isInterruptedError(error)) results.interrupted = true;
      results.modules[moduleName] = { ok: false, type: ACTIVE_MODULES.includes(moduleName) ? 'active' : 'passive', durationMs: Math.round(performance.now() - started), error: message, errorCode };
      const codeSuffix = errorCode ? ` [${errorCode}]` : '';
      results.errors.push(`${moduleName}: ${message}${codeSuffix}`);
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

    applyAdaptiveAdjustments(options, results.modules[moduleName], progress);
    if (results.interrupted) break;
  }

  results.completedAt = new Date().toISOString();
  const securityAssessment = calculateSecurityAssessment(results);
  results.securityGrade = securityAssessment.grade;
  results.securityGradeDetails = securityAssessment.details;
  results.recommendations = securityAssessment.recommendations;
  return results;
};

const printRunHeader = (target, options) => {
  const activeModules = options.modules.filter((moduleName) => ACTIVE_MODULES.includes(moduleName));
  if (!options.suppressBanner) console.log(cliSchemeBanner());
  compactBanner();
  writeRail('◇', `${color('bold', 'Target:')} ${target.origin}`, 'green');
  writeRail('│');
  writeRail('◇', `${color('bold', 'Found')} ${color('green', options.modules.length)} modules`, 'green');
  writeRail('│');
  writeRail('◇', `${color('bold', 'Profile:')} ${profileFor(options.modules)} ${muted(`(${activeModules.length ? `${activeModules.length} active` : 'passive only'})`)}`, 'green');
  writeRail('│');
  writeRail('◆', `${color('bold', 'Scan mode')} ${options.mode} ${muted(`auto-tuned current ${options.payloads} payloads, ${options.threads} threads, ${options.delay}ms delay`)}`, 'blue');
  if (options.calibration) {
    writeRail('◇', `${color('bold', 'Calibration:')} ${options.calibration.summary} ${muted(safetySnapshot(options))}`, options.calibration.stressed ? 'yellow' : 'green');
  }
  for (const moduleName of options.modules) {
    const marker = ACTIVE_MODULES.includes(moduleName) ? color('yellow', '□') : muted('□');
    const description = ACTIVE_MODULES.includes(moduleName) ? muted('active') : muted('passive');
    console.log(`│  ${marker} ${moduleName} ${description}`);
  }
  writeRail('│');
};

const startModuleProgress = (moduleName, current, total) => {
  const label = `${moduleName} ${muted(`(${current}/${total})`)}`;
  let tick = 0;
  let stopped = false;
  const render = () => {
    const elapsed = `${Math.floor(tick / 10)}s`;
    const frames = ['.  ', '.. ', '...', ' ..', '  .', '   '];
    const line = `${rail('blue', '◆')}  ${color('bold', label)} ${muted(`${elapsed} running ${frames[tick % frames.length]}`)}`;
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
    log(message) {
      if (stopped) return;
      const line = `│    ${muted('□')} ${message}`;
      if (process.stdout.isTTY) {
        process.stdout.write('\r\x1b[2K');
        console.log(line);
        render();
      } else {
        console.log(line);
      }
    },
    stop(ok, durationMs) {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      const status = ok ? color('green', 'done') : color('red', 'failed');
      const symbolColor = ok ? 'green' : 'red';
      const line = `${rail(symbolColor, '◇')}  ${color('bold', label)} ${status} ${muted(`${durationMs}ms`)}`;
      if (process.stdout.isTTY) process.stdout.write(`\r${line}\n`);
      else console.log(line);
    },
  };
};

const printModuleResult = (moduleName, result) => {
  const marker = result.ok ? color('blue', '■') : color('red', '■');
  const status = result.ok ? color('green', 'ok') : color('red', 'failed');
  const codeTag = result.errorCode ? ` ${color('yellow', `[${result.errorCode}]`)}` : '';
  console.log(`│  ${marker} ${color('bold', moduleName)} ${muted(`${result.type} | ${result.durationMs}ms`)} ${status}${codeTag} ${summarize(moduleName, result)}`);
  for (const line of renderDetails(moduleName, result)) {
    console.log(`│    ${muted('□')} ${line}`);
  }
  writeRail('│');
};

const printResults = (results) => {
  const entries = Object.entries(results.modules);
  const ok = entries.filter(([, result]) => result.ok).length;
  const failed = entries.length - ok;
  const active = entries.filter(([, result]) => result.type === 'active').length;
  const passive = entries.length - active;
  const elapsedMs = Date.parse(results.completedAt) - Date.parse(results.startedAt);
  writeRail('◇', `${color('bold', 'Summary')} ${muted(results.normalizedTarget)}`, failed ? 'yellow' : 'green');
  console.log(`│  ${gradeSymbol(results.securityGrade)} ${kv('Security grade', formatSecurityGrade(results.securityGrade))}`);
  if (results.securityGradeDetails?.length) {
    console.log(`│  ${muted('□')} ${kv('Grade basis', results.securityGradeDetails.map((item) => `${item.category}:${item.score}/${item.weight}`).join(', '))}`);
  }
  console.log(`│  ${muted('□')} ${kv('Profile', results.profile)}`);
  console.log(`│  ${muted('□')} ${kv('Mode', results.mode)}`);
  console.log(`│  ${muted('□')} ${kv('Modules', `${entries.length} total, ${passive} passive, ${active} active`)}`);
  console.log(`│  ${muted('□')} ${kv('Status', `${ok} ok, ${failed} failed${results.interrupted ? ', interrupted' : ''}`)}`);
  console.log(`│  ${muted('□')} ${kv('Elapsed', `${elapsedMs}ms`)}`);
  if (results.recommendations?.length) {
    writeRail('◇', color('bold', 'Recommendations'), results.securityGrade >= 8 ? 'green' : 'yellow');
    for (const recommendation of results.recommendations.slice(0, 8)) {
      console.log(`│  ${muted('□')} ${recommendation}`);
    }
  }
  if (results.errors.length) {
    for (const err of results.errors) {
      const withCode = err.replace(/\[(\w+)\]$/, (_, c) => color('yellow', `[${c}]`));
      console.log(`│  ${color('red', '□')} ${withCode}`);
    }
  }
  writeRail('└');
};

const renderDetails = (moduleName, result) => {
  if (!result.ok) {
    const codePart = result.errorCode ? ` ${color('yellow', `[${result.errorCode}]`)}` : '';
    return [color('red', result.error) + codePart];
  }
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
    return compactLines([
      kv('Security score', `${data.security.score}/100 (${data.security.grade || data.securityHeaders?.grade || 'n/a'})`),
      kv('Present', list(data.security.present)),
      kv('Missing', list(data.security.missing)),
      kv('Insecure present', list(data.securityHeaders?.present?.filter((header) => !header.secure).map((header) => header.name))),
      kv('Cookie issues', list((data.cookies || []).flatMap((cookie) => cookie.issues.map((issue) => `${cookie.name}: ${issue}`)), 6)),
      kv('Cache issues', list(data.cacheControl?.issues, 5)),
      kv('CORS issues', list(data.cors?.issues, 5)),
      kv('Protection', formatProtection(data.protection)),
      ...Object.entries(data.headers).slice(0, 18).map(([name, value]) => kv(name, truncate(String(value), 110))),
    ]);
  }

  if (moduleName === 'whois') {
    if (!data.found) {
      const lines = [kv('Domain', data.domain)];
      if (data.source) lines.push(kv('Source', data.source));
      if (data.nameservers?.length) lines.push(kv('Nameservers', list(data.nameservers, 6)));
      if (!lines.length) lines.push(kv('Found', 'false'));
      return compactLines(lines);
    }

    const lines = [];
    if (data.source) lines.push(kv('Source', data.source));
    if (data.registrar) lines.push(kv('Registrar', data.registrar));
    if (data.created) lines.push(kv('Created', data.created));
    if (data.expires) lines.push(kv('Expires', data.expires));
    if (data.updated) lines.push(kv('Updated', data.updated));
    if (data.status) lines.push(kv('Status', Array.isArray(data.status) ? list(data.status) : data.status));
    if (data.nameservers?.length) lines.push(kv('Nameservers', list(data.nameservers, 8)));
    if (data.dnssec) lines.push(kv('DNSSEC', data.dnssec));
    if (data.registrant) {
      if (data.registrant.organization) lines.push(kv('Org', data.registrant.organization));
      if (data.registrant.country) lines.push(kv('Reg Country', data.registrant.country));
    }
    return compactLines(lines);
  }

  if (moduleName === 'geoip') {
    const lines = [
      kv('IP', data.ip),
    ];
    if (data.asn) lines.push(kv('ASN', data.asn));
    if (data.org || data.isp) lines.push(kv('Organization', data.org || data.isp));
    const location = [data.city, data.region, data.country].filter(Boolean).join(', ');
    if (location) lines.push(kv('Location', location));
    if (data.latitude != null && data.longitude != null) lines.push(kv('Coordinates', `${data.latitude}, ${data.longitude}`));
    if (data.formatted) lines.push(kv('Formatted', data.formatted));
    if (data.timezone) lines.push(kv('Timezone', data.timezone));
    if (data.reverseGeocoding?.source) {
      lines.push(kv('Reverse geocoding', `${data.reverseGeocoding.source}${data.reverseGeocoding.confidence != null ? ` confidence ${data.reverseGeocoding.confidence}` : ''}`));
    }
    if (data.source) lines.push(kv('Source', data.source));
    return compactLines(lines);
  }

  if (moduleName === 'dns') {
    return Object.entries(data).map(([type, records]) => kv(type, list(formatDnsRecords(type, records), 10)));
  }

  if (moduleName === 'mx') {
    return compactLines([
      kv('SPF', data.spfRecord || 'missing'),
      kv('DMARC', data.dmarcRecord || 'missing'),
      ...(data.records.length
        ? data.records.map((record) => kv('MX', `${record.exchange || '(null MX)'} ${record.priority !== undefined ? `(priority ${record.priority})` : ''}${record.ip ? ` ${record.ip}` : ''}`.trim()))
        : [kv('MX', 'none found')]),
    ]);
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
    if (!data.stats && data.reason) return [kv('Status', data.reason)];
    return compactLines([
      kv('Reputation', data.reputation),
      kv('Last analysis', data.lastAnalysisDate),
      kv('Categories', list(data.categories, 8)),
      kv('Registrar', data.registrar),
      ...(data.stats ? Object.entries(data.stats).map(([name, value]) => kv(name, value)) : []),
      kv('Detected URLs', data.detectedUrls?.length || 0),
      kv('Communicating files', data.detectedCommunicatingFiles?.length || 0),
      ...(data.detectedUrls?.slice(0, 5).map((item) => kv('Detected URL', `${item.positives}/${item.total} ${truncate(item.url, 100)}`)) || []),
      ...(data.errors?.length ? [kv('API errors', list(data.errors, 3))] : []),
    ]);
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
    const builtWithStatus = !data.builtWith?.enabled
      ? null
      : data.builtWith.ok
        ? `${data.builtWith.count || 0} technologies`
        : `failed: ${data.builtWith.reason || 'unknown error'}`;
    return compactLines([
      kv('Detected', list(data.detected, 20)),
      ...(data.technologies?.slice(0, 15).map((item) => kv('Technology', `${item.name} (${item.category || list(item.categories, 3) || 'unknown'}, ${Math.round((item.confidence || 0) * 100)}%)${item.evidence ? ` - ${truncate(item.evidence, 70)}` : ''}`)) || []),
      kv('BuiltWith', builtWithStatus),
      ...(data.builtWith?.technologies?.length
        ? data.builtWith.technologies.slice(0, 15).map((item) => kv('BuiltWith tech', `${item.name}${item.categories?.length ? ` (${list(item.categories, 4)})` : ''}`))
        : []),
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
      kv('Injection points', list(data.injectionPoints?.map(formatInjectionPoint) || data.params)),
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
    return compactLines([
      kv('WordPress likely', String(Boolean(data.isWordPress))),
      kv('Version', data.version),
      kv('Plugins', list(data.plugins, 10)),
      kv('Themes', list(data.themes, 10)),
      kv('Sensitive files', data.sensitiveFiles?.length || 0),
      kv('Vulnerabilities', data.vulnerabilities?.length || 0),
      ...(data.vulnerabilities?.map((finding) => kv(finding.severity, `${finding.title}: ${finding.description}`)) || []),
      ...data.checks.map((check) => kv(check.path, check.error || `${check.status} ${check.ok ? 'reachable' : 'not reachable'}`)),
    ]);
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
const analyzeSecurityHeaders = (headers) => {
  const present = [];
  const missing = [];
  let score = 0;
  const maxScore = SECURITY_HEADER_CHECKS.reduce((sum, header) => sum + severityWeight(header.severity), 0);
  for (const header of SECURITY_HEADER_CHECKS) {
    const value = headers[header.key];
    const secure = value ? Boolean(header.check(value)) : false;
    const record = {
      name: header.name,
      value,
      present: Boolean(value),
      secure,
      recommendation: secure ? undefined : header.recommendation,
      severity: header.severity,
    };
    if (value) {
      present.push(record);
      score += secure ? severityWeight(header.severity) : Math.max(1, Math.round(severityWeight(header.severity) * 0.25));
    } else {
      missing.push(record);
    }
  }
  const percentage = Math.round((score / Math.max(1, maxScore)) * 100);
  return { present, missing, score: percentage, grade: gradeFromPercentage(percentage) };
};

const severityWeight = (severity) => {
  if (severity === 'critical') return 20;
  if (severity === 'high') return 15;
  if (severity === 'medium') return 10;
  return 5;
};

const gradeFromPercentage = (score) => score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

const analyzeCookies = (setCookieHeader) => {
  if (!setCookieHeader) return [];
  return setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_]+=)/g).map((cookie) => {
    const parts = cookie.split(';').map((part) => part.trim());
    const [nameValue] = parts;
    const [name, ...valueParts] = nameValue.split('=');
    const secure = parts.some((part) => part.toLowerCase() === 'secure');
    const httpOnly = parts.some((part) => part.toLowerCase() === 'httponly');
    const sameSitePart = parts.find((part) => part.toLowerCase().startsWith('samesite='));
    const domainPart = parts.find((part) => part.toLowerCase().startsWith('domain='));
    const pathPart = parts.find((part) => part.toLowerCase().startsWith('path='));
    const expiresPart = parts.find((part) => part.toLowerCase().startsWith('expires='));
    const sameSite = sameSitePart?.split('=')[1];
    const issues = [];
    if (!secure) issues.push('Missing Secure flag');
    if (!httpOnly) issues.push('Missing HttpOnly flag');
    if (!sameSite) issues.push('Missing SameSite attribute');
    else if (sameSite.toLowerCase() === 'none' && !secure) issues.push('SameSite=None requires Secure flag');
    return {
      name,
      value: valueParts.join('='),
      secure,
      httpOnly,
      sameSite,
      domain: domainPart?.split('=')[1],
      path: pathPart?.split('=')[1],
      expires: expiresPart?.slice('expires='.length),
      issues,
    };
  }).filter((cookie) => cookie.name);
};

const analyzeCacheControl = (value) => {
  const directives = value ? value.split(',').map((item) => item.trim()) : [];
  const lower = directives.map((item) => item.toLowerCase());
  const issues = [];
  if (!value) issues.push('Cache-Control header missing');
  if (value && !lower.some((item) => item.startsWith('max-age') || item.startsWith('s-maxage'))) issues.push('Missing max-age or s-maxage directive');
  if (lower.includes('private') && !lower.includes('no-cache') && !lower.includes('no-store')) issues.push('Private cache control without no-cache/no-store may still cache sensitive data');
  if (lower.includes('public') && (lower.includes('private') || lower.includes('no-cache') || lower.includes('no-store'))) issues.push('Conflicting public/private cache directives detected');
  return { present: Boolean(value), directives, issues };
};

const analyzeCorsHeaders = (headers) => {
  const allowOrigin = headers['access-control-allow-origin'];
  const allowMethods = headers['access-control-allow-methods'];
  const allowHeaders = headers['access-control-allow-headers'];
  const exposeHeaders = headers['access-control-expose-headers'];
  const allowCredentials = headers['access-control-allow-credentials'] === 'true';
  const maxAge = headers['access-control-max-age'] ? Number.parseInt(headers['access-control-max-age'], 10) : undefined;
  const issues = [];
  if (allowOrigin === '*') issues.push('CORS allows all origins (*)');
  if (allowCredentials && allowOrigin === '*') issues.push('CORS allows credentials with wildcard origin');
  if (allowMethods?.includes('*')) issues.push('CORS allows all methods (*)');
  if (allowHeaders?.includes('*')) issues.push('CORS allows all headers (*)');
  if (maxAge !== undefined && maxAge > 86400) issues.push(`CORS Max-Age is very high (${maxAge}s)`);
  return { enabled: Boolean(allowOrigin), allowOrigin, allowMethods, allowHeaders, exposeHeaders, allowCredentials, maxAge, issues };
};

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
  if (moduleName === 'whois') return data.found ? `${data.registrar || data.status || 'found'}` : 'not found';
  if (moduleName === 'geoip') return [data.city, data.country, data.org || data.isp].filter(Boolean).join(', ') || 'no geo data';
  if (moduleName === 'dns') return `A ${data.A.length} MX ${data.MX.length} NS ${data.NS.length}`;
  if (moduleName === 'mx') return `${data.records.length} MX records`;
  if (moduleName === 'subnet') return data.cidr || 'no subnet';
  if (moduleName === 'subdomains') return `${data.found.length}/${data.checked} found`;
  if (moduleName === 'reverseip') return `${data.domains?.length || 0} domains`;
  if (moduleName === 'virustotal') return data.stats ? JSON.stringify(data.stats) : 'not configured';
  if (moduleName === 'sslTls') return data.validTo ? `valid to ${data.validTo}` : 'no cert data';
  if (moduleName === 'techStack') {
    const source = data.builtWith?.ok ? `, BuiltWith ${data.builtWith.count || 0}` : '';
    return `${data.detected.join(', ') || 'none detected'}${source}`;
  }
  if (moduleName === 'seo') return `h1 ${data.h1Count}, img missing alt ${data.imgWithoutAlt}`;
  if (moduleName === 'ports') return `open ${data.filter((port) => port.open).map((port) => port.port).join(', ') || 'none'}`;
  if (['sqlinjection', 'xss', 'lfi'].includes(moduleName)) return `${data.findings.length} findings / ${data.tested} tests`;
  if (moduleName === 'wordpress') return data.isWordPress ? 'WordPress indicators found' : 'no WordPress indicators';
  if (moduleName === 'brokenLinks') return `${data.broken.length}/${data.checked} broken`;
  if (moduleName === 'corsMisconfig') return data.finding;
  if (moduleName === 'ddosFirewall') return `${data.rateLimited}/${data.requests} limited, avg ${data.avgResponseTimeMs}ms`;
  return '';
};

const calculateSecurityAssessment = (results) => {
  const modules = results.modules || {};
  const details = [];
  const recommendations = [];
  const add = (category, weight, score, reason) => {
    details.push({ category, weight, score: Number.parseFloat(score.toFixed(1)), reason });
  };
  const recommend = (message) => {
    if (!recommendations.includes(message)) recommendations.push(message);
  };

  if (hasAnyModule(modules, ['sqlinjection', 'xss', 'lfi', 'corsMisconfig'])) {
    let score = 40;
    const sqliFindings = moduleFindings(modules.sqlinjection);
    const xssFindings = moduleFindings(modules.xss);
    const lfiFindings = moduleFindings(modules.lfi);
    if (sqliFindings.length) {
      score -= Math.min(18, 10 + sqliFindings.length * 2);
      recommend('Prioritize SQL injection remediation: parameterize database queries and add server-side input validation.');
    }
    if (xssFindings.length) {
      score -= Math.min(14, 8 + xssFindings.length * 1.5);
      recommend('Fix XSS reflection points: context-encode output and enforce a strict Content-Security-Policy.');
    }
    if (lfiFindings.length) {
      score -= Math.min(14, 8 + lfiFindings.length * 1.5);
      recommend('Fix file inclusion paths: allowlist files, canonicalize paths, and block traversal/wrapper inputs.');
    }
    if (modules.corsMisconfig?.ok && modules.corsMisconfig.data?.vulnerable) {
      score -= 10;
      recommend('Restrict CORS to trusted origins and avoid wildcard origins with credentialed requests.');
    }
    add('vulnerabilities', 40, Math.max(0, score), 'SQLi/XSS/LFI/CORS findings');
  }

  if (modules.headers?.ok && modules.headers.data?.security) {
    const present = modules.headers.data.securityHeaders?.present || [];
    const missing = modules.headers.data.securityHeaders?.missing || [];
    const headerScore = modules.headers.data.securityHeaders?.score ?? modules.headers.data.security.score ?? 0;
    const score = Math.max(0, Math.min(20, headerScore / 5));
    const insecurePresent = present.filter((header) => !header.secure);
    if (missing.length) recommend(`Add missing security headers: ${missing.slice(0, 6).map((header) => header.name || header).join(', ')}.`);
    if (insecurePresent.length) recommend(`Harden weak security headers: ${insecurePresent.slice(0, 4).map((header) => header.name).join(', ')}.`);
    const cookieIssues = (modules.headers.data.cookies || []).flatMap((cookie) => cookie.issues || []);
    if (cookieIssues.length) recommend('Fix cookie flags: require Secure, HttpOnly, and SameSite where appropriate.');
    add('headers', 20, score, `${present.length} present, ${missing.length} missing, grade ${modules.headers.data.securityHeaders?.grade || 'n/a'}`);
  }

  if (modules.sslTls?.ok && modules.sslTls.data && !modules.sslTls.data.skipped) {
    const cert = modules.sslTls.data;
    let score = 15;
    if (cert.available === false) {
      score = 0;
      recommend('Enable valid HTTPS/TLS for the target.');
    } else {
      if (cert.authorized === false) {
        score -= 5;
        recommend('Fix TLS certificate trust issues so clients receive an authorized certificate chain.');
      }
      if (cert.daysUntilExpiry < 0) {
        score -= 10;
        recommend('Renew the expired TLS certificate immediately.');
      } else if (cert.daysUntilExpiry !== null && cert.daysUntilExpiry !== undefined && cert.daysUntilExpiry <= 30) {
        score -= 5;
        recommend('Renew the TLS certificate before it expires within 30 days.');
      }
    }
    add('tls', 15, Math.max(0, score), cert.available === false ? 'TLS unavailable' : 'certificate health');
  }

  if (hasAnyModule(modules, ['ports', 'wordpress', 'brokenLinks'])) {
    let score = 15;
    if (modules.ports?.ok && Array.isArray(modules.ports.data)) {
      const openPorts = modules.ports.data.filter((port) => port.open);
      score -= Math.min(6, openPorts.length * 0.75);
      if (openPorts.length) recommend(`Review exposed services on open ports: ${openPorts.slice(0, 8).map((port) => port.port).join(', ')}.`);
    }
    if (modules.wordpress?.ok) {
      const reachable = (modules.wordpress.data?.checks || []).filter((check) => check.ok || [401, 403].includes(check.status));
      score -= Math.min(4, reachable.length * 0.8);
      if (reachable.length) recommend('Harden WordPress endpoints: keep core/plugins updated and restrict admin/API exposure.');
      const wpVulnerabilities = modules.wordpress.data?.vulnerabilities || [];
      const highWp = wpVulnerabilities.filter((finding) => finding.severity === 'high').length;
      score -= Math.min(5, highWp * 1.5 + Math.max(0, wpVulnerabilities.length - highWp) * 0.75);
      if (wpVulnerabilities.length) recommend('Remediate WordPress findings: update outdated versions and block exposed sensitive files.');
    }
    if (modules.brokenLinks?.ok && Array.isArray(modules.brokenLinks.data?.broken)) {
      const brokenCount = modules.brokenLinks.data.broken.length;
      score -= Math.min(3, brokenCount * 0.15);
      if (brokenCount) recommend('Fix broken links to reduce stale attack surface and improve site reliability.');
    }
    add('exposure', 15, Math.max(0, score), 'open services, WordPress indicators, broken links');
  }

  if (hasAnyModule(modules, ['virustotal', 'ddosFirewall', 'techStack'])) {
    let score = 10;
    if (modules.virustotal?.ok && modules.virustotal.data?.reputation < 0) {
      score -= 4;
      recommend('Investigate negative VirusTotal reputation and clean or delist flagged assets.');
    }
    const maliciousUrls = modules.virustotal?.data?.detectedUrls?.filter((url) => url.positives > 0) || [];
    if (maliciousUrls.length) {
      score -= Math.min(3, maliciousUrls.length);
      recommend('Review VirusTotal detected URLs and remove or remediate malicious flagged paths.');
    }
    if (modules.ddosFirewall?.ok) {
      if (modules.ddosFirewall.data?.likelyProtected) score += 1;
      else {
        score -= 2;
        recommend('Consider rate limiting or WAF/CDN protection for abusive traffic resilience.');
      }
    }
    const outdatedTech = (modules.techStack?.data?.technologies || []).filter((tech) =>
      (tech.name === 'WordPress' && tech.version && Number.parseFloat(tech.version) < 6) ||
      (tech.name === 'PHP' && tech.version && Number.parseFloat(tech.version) < 8) ||
      (tech.name === 'Apache HTTP Server' && tech.version && Number.parseFloat(tech.version) < 2.4) ||
      (tech.name === 'Nginx' && tech.version && Number.parseFloat(tech.version) < 1.2));
    if (outdatedTech.length) {
      score -= Math.min(2, outdatedTech.length * 0.5);
      recommend(`Update outdated detected technologies: ${outdatedTech.slice(0, 5).map((tech) => tech.name).join(', ')}.`);
    }
    if (modules.techStack?.ok && modules.techStack.data?.detected?.some((item) => /wordpress|php|apache|nginx/i.test(item))) {
      recommend('Review detected technologies for outdated versions and remove unnecessary fingerprinting headers.');
    }
    add('reputation', 10, Math.max(0, Math.min(10, score)), 'reputation, WAF, technology signals');
  }

  if (modules.mx?.ok) {
    const mxData = modules.mx.data;
    let score = 5;
    if (!mxData.spfRecord) {
      score -= 2;
      recommend('Publish an SPF record to reduce email spoofing risk.');
    }
    if (!mxData.dmarcRecord) {
      score -= 2;
      recommend('Publish a DMARC record to improve domain email abuse protection.');
    }
    add('email', 5, Math.max(0, score), `${mxData.records?.length || 0} MX, SPF ${mxData.spfRecord ? 'present' : 'missing'}, DMARC ${mxData.dmarcRecord ? 'present' : 'missing'}`);
  }

  if (!details.length) {
    add('coverage', 10, 5, 'no gradeable modules completed');
    recommend('Run headers, sslTls, ports, and active vulnerability modules for a meaningful security grade.');
  }

  const totalWeight = details.reduce((sum, item) => sum + item.weight, 0);
  const totalScore = details.reduce((sum, item) => sum + item.score, 0);
  const grade = Math.max(1, Math.min(10, Number.parseFloat(((totalScore / Math.max(1, totalWeight)) * 10).toFixed(1))));
  if (!recommendations.length) recommendations.push('No critical remediation was identified from the modules that completed. Expand scan coverage for higher confidence.');
  return { grade, details, recommendations };
};

const moduleFindings = (moduleResult) =>
  moduleResult?.ok && Array.isArray(moduleResult.data?.findings) ? moduleResult.data.findings : [];

const hasAnyModule = (modules, names) => names.some((name) => modules[name]?.ok);

const formatSecurityGrade = (grade) => Number.isFinite(grade) ? `${grade.toFixed(1)}/10 (${gradeLabel(grade)})` : 'n/a';
const gradeLabel = (grade) => {
  if (grade >= 8) return 'strong';
  if (grade >= 6) return 'moderate';
  if (grade >= 4) return 'weak';
  return 'critical';
};
const gradeSymbol = (grade) => {
  if (grade >= 8) return color('green', '□');
  if (grade >= 6) return color('yellow', '□');
  return color('red', '□');
};

const profileFor = (modules) => {
  const activeCount = modules.filter((moduleName) => ACTIVE_MODULES.includes(moduleName)).length;
  const passiveCount = modules.length - activeCount;
  if (activeCount && passiveCount) return 'hybrid';
  if (activeCount) return 'active';
  return 'passive';
};

const applyAdaptiveAdjustments = (options, moduleResult, progress = null) => {
  const stress = moduleStressScore(options, moduleResult);
  if (stress >= 2) {
    adjustSafety(options, 'stress', progress?.log, moduleResult.type);
    return;
  }
  if (stress === 0 && moduleResult.ok && moduleResult.durationMs < Math.max(800, options.timeout * 0.2)) {
    adjustSafety(options, 'relief', progress?.log, moduleResult.type);
  }
};

const moduleStressScore = (options, moduleResult) => {
  let score = 0;
  if (!moduleResult.ok) score += 2;
  if (moduleResult.durationMs > Math.max(2500, options.timeout * 0.6)) score += 1;
  const data = moduleResult.data;
  if (data?.errors?.length && data?.tested !== undefined && data.errors.length / Math.max(1, data.tested + data.errors.length) > 0.25) score += 1;
  if (Array.isArray(data) && data.filter((item) => item.error === 'timeout').length > Math.max(3, data.length * 0.2)) score += 1;
  if (data?.rateLimited && data.rateLimited > 0) score += 2;
  if (data?.protection?.challenged) score += 2;
  return score;
};

const tunePacingFromSample = (options, sample) => {
  const rateLimited = [403, 429, 503].includes(sample.status);
  const slow = sample.durationMs && sample.durationMs > Math.max(1200, options.timeout * 0.5);
  const failed = Boolean(sample.error);
  if (rateLimited || slow || failed) {
    adjustSafety(options, 'stress', options.log, sample.moduleName);
    return;
  }
  if (sample.durationMs && sample.durationMs < 350) {
    adjustSafety(options, 'relief', options.log, sample.moduleName);
  }
};

const calibrateTargetSafety = async (target, options) => {
  const before = safetySnapshot(options);
  const started = performance.now();
  try {
    const response = await request(target.origin, { method: 'HEAD' }, Math.min(options.timeout, 5000));
    const durationMs = Math.round(performance.now() - started);
    tunePacingFromSample(options, { status: response.status, durationMs, moduleName: 'calibration' });
    const after = safetySnapshot(options);
    const calibration = {
      status: response.status,
      durationMs,
      stressed: before !== after,
      summary: `HTTP ${response.status} in ${durationMs}ms`,
    };
    options.calibration = calibration;
    return calibration;
  } catch (error) {
    tunePacingFromSample(options, { error: error.message, moduleName: 'calibration' });
    const calibration = {
      error: error.message,
      stressed: true,
      summary: `probe failed: ${error.message}`,
    };
    options.calibration = calibration;
    return calibration;
  }
};

const adjustSafety = (options, direction, log = null, context = '') => {
  const safety = options.safety;
  if (!safety) return;
  const before = safetySnapshot(options);
  if (direction === 'stress') {
    safety.stressEvents += 1;
    safety.reliefEvents = 0;
    options.delay = clampInt(Math.ceil(options.delay * 1.35) + 50, safety.minDelay, safety.maxDelay);
    options.threads = clampInt(Math.floor(options.threads * 0.8), safety.minThreads, safety.maxThreads);
    options.payloads = clampInt(Math.floor(options.payloads * 0.9), safety.minPayloads, safety.maxPayloads);
    options.ddosRequests = clampInt(Math.floor(options.ddosRequests * 0.85), safety.minDdosRequests, safety.maxDdosRequests);
  } else {
    safety.reliefEvents += 1;
    if (safety.reliefEvents < 3) return;
    safety.reliefEvents = 0;
    options.delay = clampInt(Math.floor(options.delay * 0.9), safety.minDelay, safety.maxDelay);
    options.threads = clampInt(options.threads + 1, safety.minThreads, safety.maxThreads);
    options.payloads = clampInt(options.payloads + 1, safety.minPayloads, safety.maxPayloads);
    options.ddosRequests = clampInt(options.ddosRequests + 1, safety.minDdosRequests, safety.maxDdosRequests);
  }
  const after = safetySnapshot(options);
  if (before !== after) {
    log?.(`auto-tuned ${context ? `${context} ` : ''}pacing: ${after}`);
  }
};

const safetySnapshot = (options) =>
  `${options.payloads} payloads, ${options.threads} threads, ${options.delay}ms delay, ${options.ddosRequests} WAF probes`;

const clampInt = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

const maybeAutoUpdate = async (options) => {
  if (!shouldAutoUpdate(options)) return { checked: false, reason: 'disabled' };
  const writeUpdate = (message, level = 'gray') => {
    const output = color(level, message);
    if (options.json) console.error(output);
    else writeRail(level === 'yellow' ? '◇' : '◆', output, level);
  };
  if (process.env.ABSPIDER_RESTARTED_AFTER_UPDATE === '1') {
    writeUpdate(`Update applied. Running ABSpider ${VERSION} in the relaunched session.`, 'green');
    if (!options.json) console.log('');
    return { checked: false, restartedSession: true };
  }
  try {
    const latest = await fetchLatestNpmVersion('abspider', 1800);
    if (!latest) {
      writeUpdate('Update check reached npm, but no latest version was returned. Continuing with the local build.', 'yellow');
      if (!options.json) console.log('');
      return { checked: true, updated: false, latest: null };
    }
    if (compareVersions(latest, VERSION) <= 0) {
      writeUpdate(`Update check complete: local package.json ${VERSION} matches npm latest. Continuing with this run.`, 'green');
      if (!options.json) console.log('');
      return { checked: true, updated: false, latest };
    }
    writeUpdate(`Update found: local package.json ${VERSION}, npm latest ${latest}. Installing before the scan starts...`, 'yellow');
    const result = await installLatestFromNpm(latest, 120000);
    if (result.ok) {
      writeUpdate(`Update installed: ABSpider ${latest}. Relaunching this command so the new package handles the run...`, 'green');
      if (!options.json) console.log('');
      const restart = await relaunchCliAfterUpdate(latest);
      return { checked: true, updated: true, restarted: restart.ok, latest, error: restart.error || null, exitCode: restart.exitCode };
    } else {
      writeUpdate(`Auto-update failed: ${result.error || 'npm install failed'}`, 'yellow');
    }
    if (!options.json) console.log('');
    return { checked: true, updated: result.ok, latest, error: result.error || null };
  } catch (error) {
    writeUpdate(`Auto-update check failed: ${error.message}`, 'yellow');
    if (!options.json) console.log('');
    return { checked: false, updated: false, error: error.message };
  }
};

const shouldAutoUpdate = (options) =>
  options.update &&
  process.env.ABSPIDER_NO_UPDATE !== '1' &&
  process.env.CI !== 'true';

const relaunchCliAfterUpdate = (latest) => new Promise((resolve) => {
  const command = process.execPath || (process.platform === 'win32' ? 'node.exe' : 'node');
  const args = process.argv.slice(1).filter((arg) => typeof arg === 'string' && arg.length > 0);
  const env = Object.fromEntries(Object.entries({
    ...process.env,
    ABSPIDER_RESTARTED_AFTER_UPDATE: '1',
    ABSPIDER_UPDATED_TO: latest,
  }).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)]));
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: [process.stdin.isTTY ? 'inherit' : 'ignore', 'inherit', 'inherit'],
    windowsHide: true,
    env,
  });
  child.on('error', (error) => resolve({ ok: false, error: error.message }));
  child.on('close', (code) => resolve({ ok: true, exitCode: code ?? 0 }));
});

const isNpmPackageExecution = () => {
  const entry = process.argv[1] ? path.normalize(process.argv[1]).toLowerCase() : '';
  return entry.includes(`${path.sep}node_modules${path.sep}abspider${path.sep}`);
};

const fetchLatestNpmVersion = (packageName, timeoutMs) => new Promise((resolve, reject) => {
  const requestOptions = {
    hostname: 'registry.npmjs.org',
    path: `/${encodeURIComponent(packageName)}/latest`,
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    timeout: timeoutMs,
  };
  const req = https.get(requestOptions, (res) => {
    if (res.statusCode !== 200) {
      res.resume();
      resolve(null);
      return;
    }
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20000) req.destroy(new Error('npm registry response too large'));
    });
    res.on('end', () => {
      try {
        resolve(JSON.parse(body).version || null);
      } catch (error) {
        reject(error);
      }
    });
  });
  req.on('timeout', () => req.destroy(new Error('npm registry check timed out')));
  req.on('error', reject);
});

const installLatestFromNpm = (version, timeoutMs) => new Promise((resolve) => {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCommand, ['install', '-g', `abspider@${version}`, '--no-audit', '--fund=false'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stderr = '';
  const timer = setTimeout(() => {
    child.kill();
    resolve({ ok: false, error: 'npm install timed out' });
  }, timeoutMs);
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.on('error', (error) => {
    clearTimeout(timer);
    resolve({ ok: false, error: error.message });
  });
  child.on('close', (code) => {
    clearTimeout(timer);
    resolve({ ok: code === 0, error: code === 0 ? null : truncate(stderr.trim() || `npm exited with ${code}`, 180) });
  });
});

const compareVersions = (left, right) => {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
};

const parseVersion = (value) => String(value).split(/[.-]/).slice(0, 3).map((part) => Number.parseInt(part, 10) || 0);

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

const moduleNamePayloadFile = (moduleName) => {
  if (moduleName === 'sqlinjection') return 'sqli.json';
  if (moduleName === 'xss') return 'xss.json';
  if (moduleName === 'lfi') return 'lfi.json';
  return 'payloads';
};

const discoverInjectionPoints = (target, moduleName) => {
  const queryParams = [...target.url.searchParams.keys()];
  if (queryParams.length) {
    return queryParams.map((name) => ({
      type: 'query',
      name,
      baseValue: target.url.searchParams.get(name) || defaultPayloadBaseValue(moduleName, name),
      synthetic: false,
    }));
  }
  return defaultPayloadParameters(moduleName).map((name) => ({
    type: 'query',
    name,
    baseValue: defaultPayloadBaseValue(moduleName, name),
    synthetic: true,
  }));
};

const formatInjectionPoint = (injectionPoint) =>
  `query parameter "${injectionPoint.name}"${injectionPoint.synthetic ? ' (default probe)' : ''}`;

const buildPayloadUrl = (target, injectionPoint, payloadValue) => {
  const url = new URL(target.url.href);
  url.searchParams.set(injectionPoint.name, `${injectionPoint.baseValue}${payloadValue}`);
  return url;
};

const runBooleanBlindSqlChecks = async (target, options, injectionPoints, baseline) => {
  const findings = [];
  for (const injectionPoint of injectionPoints || []) {
    throwIfInterrupted();
    const trueUrl = buildPayloadUrl(target, injectionPoint, ' AND 1=1--');
    const falseUrl = buildPayloadUrl(target, injectionPoint, ' AND 1=0--');
    options.log?.(`sending boolean-blind SQLi true/false probes to ${formatInjectionPoint(injectionPoint)}`);
    try {
      const trueResponse = await request(trueUrl.href, { method: 'GET' }, options.timeout);
      const trueBody = await trueResponse.text();
      await sleep(Math.min(options.delay, 500));
      const falseResponse = await request(falseUrl.href, { method: 'GET' }, options.timeout);
      const falseBody = await falseResponse.text();
      const lengthDiff = Math.abs(trueBody.length - falseBody.length);
      const minDiff = Math.max(50, (baseline?.length || Math.max(trueBody.length, falseBody.length)) * 0.1);
      let indicator = null;
      let confidence = 0;
      let evidence = null;
      if (trueResponse.status !== falseResponse.status) {
        indicator = `Different HTTP status codes for TRUE (${trueResponse.status}) vs FALSE (${falseResponse.status}) conditions`;
        confidence = 0.9;
        evidence = `True status: ${trueResponse.status}, false status: ${falseResponse.status}`;
      } else if (lengthDiff > minDiff) {
        indicator = `Significant content length difference for TRUE (${trueBody.length}) vs FALSE (${falseBody.length}) conditions`;
        confidence = 0.85;
        evidence = `True length: ${trueBody.length}, false length: ${falseBody.length}, baseline length: ${baseline?.length || 'n/a'}`;
      } else if (trueBody !== falseBody && baseline?.body && trueBody === baseline.body && falseBody !== baseline.body) {
        indicator = 'Content differs for TRUE vs FALSE conditions';
        confidence = 0.8;
        evidence = `False response differs from baseline by ${Math.abs(falseBody.length - baseline.body.length)} bytes`;
      }
      if (indicator) {
        options.log?.(`boolean-blind SQLi candidate at ${formatInjectionPoint(injectionPoint)} (${Math.round(confidence * 100)}% confidence)`);
        findings.push({
          param: injectionPoint.name,
          injectionPoint: injectionPoint.type,
          url: trueUrl.href,
          payload: `${injectionPoint.baseValue} AND [BOOLEAN CONDITION]--`,
          type: 'Boolean-based Blind',
          severity: 'critical',
          status: trueResponse.status,
          indicator,
          confidence,
          evidence,
        });
      }
    } catch (error) {
      options.log?.(`boolean-blind SQLi probe failed at ${formatInjectionPoint(injectionPoint)}: ${error.message}`);
      tunePacingFromSample(options, { error: error.message, moduleName: 'sqlinjection' });
    }
    await sleep(options.delay);
  }
  return findings;
};

const defaultPayloadParameters = (moduleName) => {
  if (moduleName === 'sqlinjection') return ['id'];
  if (moduleName === 'lfi') return ['file', 'page', 'include', 'path'];
  return ['q'];
};

const defaultPayloadBaseValue = (moduleName, paramName) => {
  if (moduleName === 'sqlinjection') return '1';
  if (moduleName === 'lfi') return 'index.php';
  return 'test';
};

const formatPayloadForLog = (payloadValue) => truncate(JSON.stringify(String(payloadValue)), 110);

const firstRegexMatch = (text, pattern) => text.match(pattern)?.[0] || null;

const XSS_DANGEROUS_CONTEXTS = [
  /<script[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/script>/i,
  /<[^>]+\s+on\w+\s*=\s*["']?[^"']*?PAYLOAD[^"']*?["']?/i,
  /<[^>]+\s+\w+=[^"'][^>\s]*?PAYLOAD/i,
  /(href|src)\s*=\s*["']?(?:javascript|data):[^"']*?PAYLOAD[^"']*?["']?/i,
  /<[^>]+\s+style\s*=\s*["']?[^"']*?expression\s*\([^)]*?PAYLOAD[^)]*\)[^"']*?["']?/i,
  /<textarea[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/textarea>/i,
  /<title[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/title>/i,
  /<!--[\s\S]*?PAYLOAD[\s\S]*?-->/i,
  />[^<]*?PAYLOAD[^<]*?</i,
  /<style[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/style>/i,
  /<noscript[^>]*>[\s\S]*?PAYLOAD[\s\S]*?<\/noscript>/i,
  /document\.(write|innerhtml)\s*=\s*["']?[^"']*?PAYLOAD[^"']*?["']?/i,
  /["']:\s*["']?[^"']*?PAYLOAD[^"']*?["']/i,
];

const isEncodedReflection = (value) =>
  /(&lt;|&gt;|&quot;|&#x27;|&#39;|&#x|%3c|%3e|%22|%27|%2f|\\x3c|\\x3e|\\u003c|\\u003e|\\"|\\')/i.test(value);

const checkXssReflection = (responseText, payloadValue) => {
  const response = String(responseText);
  const payload = String(payloadValue);
  const directIndex = response.toLowerCase().indexOf(payload.toLowerCase());
  if (directIndex >= 0) {
    const matchedPayload = response.slice(directIndex, directIndex + payload.length);
    let confidence = 0.7;
    let context = 'Direct unencoded payload reflection';
    for (const pattern of XSS_DANGEROUS_CONTEXTS) {
      const escapedPayload = escapeRegExp(payload);
      const testPattern = new RegExp(pattern.source.replace('PAYLOAD', escapedPayload), 'i');
      if (testPattern.test(response)) {
        confidence = 0.95;
        context = 'Direct reflection in dangerous HTML context';
        break;
      }
    }
    return {
      reflected: true,
      exploitable: !isEncodedReflection(matchedPayload),
      context,
      confidence,
    };
  }

  const encodedPayloads = [
    escapeHtml(payload),
    encodeURIComponent(payload),
    payload.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\//g, '\\/').replace(/</g, '\\x3c').replace(/>/g, '\\x3e'),
    payload.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\//g, '\\/').replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
  ];

  return encodedPayloads.some((encoded) => response.toLowerCase().includes(encoded.toLowerCase()))
    ? { reflected: true, exploitable: false, context: 'Payload reflected but safely encoded', confidence: 0 }
    : { reflected: false, exploitable: false, context: 'Not reflected', confidence: 0 };
};

const checkLfiSignature = (responseText) => {
  const response = String(responseText);
  if (/[a-z_][a-z0-9_-]*:[x*]:\d+:\d+:/i.test(response) && response.includes('/bin/bash')) {
    return { found: true, pattern: 'Unix password file format detected', confidence: 0.99 };
  }
  if (/[a-z_][a-z0-9_-]*:\$[a-z0-9.$]+\$[a-z0-9.$]+\$[a-z0-9.$]+/i.test(response)) {
    return { found: true, pattern: 'Unix shadow file format detected', confidence: 0.99 };
  }
  if (/\[[a-z\s]+\]/i.test(response) && /;.*comment/i.test(response) && /fonts|extensions/i.test(response)) {
    return { found: true, pattern: 'Windows INI file format detected', confidence: 0.95 };
  }
  const matched = LFI_MARKERS.find((pattern) => pattern.test(response));
  return matched
    ? { found: true, pattern: firstRegexMatch(response, matched) || String(matched), confidence: 0.8 }
    : { found: false, pattern: null, confidence: 0 };
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const runInteractiveSetup = async (rawTarget, options) => {
  if (options.json) throw new Error('--interactive cannot be combined with --json');
  const rl = await createPromptSession();
  try {
    console.log(cliSchemeBanner());
    writeRail('◇', color('bold', 'Interactive scan setup'), 'blue');
    writeRail('│');
    const target = await askTarget(rl, rawTarget);
    const profile = await askChoice(rl, 'Module profile', [
      ['passive', 'Passive reconnaissance'],
      ['active', 'Active vulnerability modules'],
      ['all', 'All modules'],
      ['custom', 'Choose modules'],
    ], 'passive');

    if (profile === 'passive') options.modules = [...PASSIVE_MODULES];
    else if (profile === 'active') options.modules = [...ACTIVE_MODULES];
    else if (profile === 'all') options.modules = [...ALL_MODULES];
    else options.modules = await askModuleSelector(rl, options.modules);

    options.mode = await askChoice(rl, 'Scan mode', [
      ['conservative', 'Gentler checks, fewer active requests'],
      ['adaptive', 'Balanced auto-tuned scan'],
      ['aggressive', 'Broader coverage with safety tuning'],
    ], options.mode);

    const explicit = new Set();
    options.explicit = explicit;
    applyModeDefaults(options);

    const configureAdvanced = await askYesNo(rl, 'Adjust advanced settings?', false);
    if (configureAdvanced) {
      options.threads = await askPositiveInt(rl, 'Concurrent threads', options.threads, 1, 100);
      explicit.add('threads');
      options.timeout = await askPositiveInt(rl, 'Request timeout ms', options.timeout, 1000, 120000);
      options.payloads = await askPositiveInt(rl, 'Payloads per active injection check', options.payloads, 1, 1000);
      explicit.add('payloads');
      options.delay = await askPositiveInt(rl, 'Delay between active payloads ms', options.delay, 1, 10000);
      explicit.add('delay');
      options.ddosRequests = await askPositiveInt(rl, 'Bounded WAF probe requests', options.ddosRequests, 1, 250);
      explicit.add('ddosRequests');
      options.subdomainLimit = Math.min(
        await askPositiveInt(rl, 'Subdomain wordlist limit', options.subdomainLimit, 1, COMMON_SUBDOMAINS.length),
        COMMON_SUBDOMAINS.length,
      );
      explicit.add('subdomainLimit');
      options.ct = await askYesNo(rl, 'Use crt.sh certificate transparency lookup?', options.ct);
      const portProfile = await askChoice(rl, 'Port profile', [
        ['current', `Current (${options.ports.length} ports)`],
        ['web', 'Common web ports'],
        ['common', 'Common service ports'],
        ['full', 'TCP 1-1024'],
      ], 'current');
      if (portProfile !== 'current') {
        options.ports = readPortProfile(portProfile);
        explicit.add('ports');
      }
    }

    options.modules = [...new Set(options.modules)];
    options.threads = Math.min(options.threads, 100);
    options.payloads = Math.min(options.payloads, 1000);
    options.ddosRequests = Math.min(options.ddosRequests, 250);
    options.subdomainLimit = Math.min(options.subdomainLimit, COMMON_SUBDOMAINS.length);
    options.safety = buildSafetyLimits(options, MODE_PROFILES[options.mode]);
    delete options.explicit;
    writeRail('◇', `${color('bold', 'Selected modules:')} ${options.modules.join(', ')}`, 'green');
    writeRail('│');
    return { target, options };
  } finally {
    rl.close();
  }
};

const createPromptSession = async () => {
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.isTty = true;
    return rl;
  }
  let input = '';
  for await (const chunk of process.stdin) input += chunk.toString();
  const answers = input.split(/\r?\n/);
  return {
    async question(promptText) {
      const answer = answers.length ? answers.shift() : '';
      process.stdout.write(promptText);
      if (answer) process.stdout.write(`${answer}\n`);
      else process.stdout.write('\n');
      return answer;
    },
    close() {},
    isTty: false,
  };
};

const askRequired = async (rl, label) => {
  while (true) {
    const answer = (await rl.question(`${label}: `)).trim();
    if (answer) return answer;
    console.log(color('yellow', `${label} is required.`));
  }
};

const askTarget = async (rl, initialTarget) => {
  if (initialTarget) {
    try {
      normalizeTarget(initialTarget);
      return initialTarget;
    } catch (error) {
      console.log(color('yellow', `${error.message}. Enter a different target.`));
    }
  }
  while (true) {
    const answer = await askRequired(rl, 'Target URL or domain');
    try {
      normalizeTarget(answer);
      return answer;
    } catch (error) {
      console.log(color('yellow', error.message));
    }
  }
};

const askChoice = async (rl, label, choices, defaultValue) => {
  if (rl.isTty) return askChoiceWithArrows(label, choices, defaultValue);
  console.log(color('bold', label));
  for (let index = 0; index < choices.length; index += 1) {
    const [value, description] = choices[index];
    const selected = value === defaultValue ? '●' : '○';
    console.log(`  ${index + 1}. (${selected}) ${value} - ${description}`);
  }
  while (true) {
    const answer = (await rl.question(`Choose ${label.toLowerCase()} [${defaultValue}]: `)).trim().toLowerCase();
    if (!answer) return defaultValue;
    const byIndex = Number.parseInt(answer, 10);
    if (Number.isInteger(byIndex) && choices[byIndex - 1]) return choices[byIndex - 1][0];
    const match = choices.find(([value]) => value === answer);
    if (match) return match[0];
    console.log(color('yellow', `Enter a number from 1-${choices.length} or one of: ${choices.map(([value]) => value).join(', ')}`));
  }
};

const askModuleSelector = async (rl, defaults) => {
  if (rl.isTty) return askModuleSelectorWithArrows(defaults);
  const selected = new Set(defaults);
  while (true) {
    console.log(color('bold', 'Choose modules'));
    ALL_MODULES.forEach((moduleName, index) => {
      const selectedMark = selected.has(moduleName) ? '●' : '○';
      const type = ACTIVE_MODULES.includes(moduleName) ? 'active' : 'passive';
      console.log(`  ${String(index + 1).padStart(2, ' ')}. (${selectedMark}) ${moduleName} ${muted(type)}`);
    });
    const answer = (await rl.question('Toggle module numbers, or type all/passive/active/none/done [done]: ')).trim().toLowerCase();
    if (!answer || answer === 'done') break;
    if (answer === 'all') {
      ALL_MODULES.forEach((moduleName) => selected.add(moduleName));
      continue;
    }
    if (answer === 'passive') {
      selected.clear();
      PASSIVE_MODULES.forEach((moduleName) => selected.add(moduleName));
      continue;
    }
    if (answer === 'active') {
      selected.clear();
      ACTIVE_MODULES.forEach((moduleName) => selected.add(moduleName));
      continue;
    }
    if (answer === 'none') {
      selected.clear();
      continue;
    }
    for (const part of answer.split(',').map((value) => value.trim()).filter(Boolean)) {
      const index = Number.parseInt(part, 10);
      const moduleName = ALL_MODULES[index - 1] || readModules(part)[0];
      if (selected.has(moduleName)) selected.delete(moduleName);
      else selected.add(moduleName);
    }
  }
  if (!selected.size) {
    console.log(color('yellow', 'No modules selected; using passive modules.'));
    return [...PASSIVE_MODULES];
  }
  return [...selected];
};

const askChoiceWithArrows = async (label, choices, defaultValue) => {
  let index = Math.max(0, choices.findIndex(([value]) => value === defaultValue));
  const render = () => {
    process.stdout.write('\x1b[?25l');
    console.log(color('bold', label));
    choices.forEach(([value, description], choiceIndex) => {
      const focused = choiceIndex === index;
      const symbol = focused ? '●' : '○';
      const prefix = focused ? color('cyan', '›') : ' ';
      const text = `${prefix} (${symbol}) ${value} - ${description}`;
      console.log(focused ? color('bold', text) : text);
    });
    console.log(muted('Use ↑/↓ to move, Enter to select.'));
  };
  return withArrowKeyUi(render, (key) => {
    if (key.name === 'up') index = (index - 1 + choices.length) % choices.length;
    else if (key.name === 'down') index = (index + 1) % choices.length;
    else if (key.name === 'return') return choices[index][0];
    return undefined;
  });
};

const askModuleSelectorWithArrows = async (defaults) => {
  const selected = new Set(defaults);
  let index = 0;
  const render = () => {
    process.stdout.write('\x1b[?25l');
    console.log(color('bold', 'Choose modules'));
    ALL_MODULES.forEach((moduleName, moduleIndex) => {
      const focused = moduleIndex === index;
      const selectedMark = selected.has(moduleName) ? '●' : '○';
      const type = ACTIVE_MODULES.includes(moduleName) ? 'active' : 'passive';
      const prefix = focused ? color('cyan', '›') : ' ';
      const text = `${prefix} (${selectedMark}) ${moduleName} ${muted(type)}`;
      console.log(focused ? color('bold', text) : text);
    });
    console.log(muted('Use ↑/↓ to move, Space to toggle, Enter to continue. Press a/p/n for active/passive/none, A for all.'));
  };
  const result = await withArrowKeyUi(render, (key, sequence) => {
    if (key.name === 'up') index = (index - 1 + ALL_MODULES.length) % ALL_MODULES.length;
    else if (key.name === 'down') index = (index + 1) % ALL_MODULES.length;
    else if (key.name === 'space') {
      const moduleName = ALL_MODULES[index];
      if (selected.has(moduleName)) selected.delete(moduleName);
      else selected.add(moduleName);
    } else if (key.name === 'return') {
      return selected.size ? [...selected] : [...PASSIVE_MODULES];
    } else if (sequence === 'A') {
      ALL_MODULES.forEach((moduleName) => selected.add(moduleName));
    } else if (sequence === 'a') {
      selected.clear();
      ACTIVE_MODULES.forEach((moduleName) => selected.add(moduleName));
    } else if (sequence === 'p') {
      selected.clear();
      PASSIVE_MODULES.forEach((moduleName) => selected.add(moduleName));
    } else if (sequence === 'n') {
      selected.clear();
    }
    return undefined;
  });
  if (!result.length) {
    console.log(color('yellow', 'No modules selected; using passive modules.'));
    return [...PASSIVE_MODULES];
  }
  return result;
};

const withArrowKeyUi = (render, onKey) => new Promise((resolve) => {
  const input = process.stdin;
  const output = process.stdout;
  const previousRawMode = input.isRaw;
  let renderedLines = 0;
  const redraw = () => {
    if (renderedLines) output.write(`\x1b[${renderedLines}F\x1b[J`);
    const originalLog = console.log;
    renderedLines = 0;
    console.log = (...args) => {
      renderedLines += 1;
      originalLog(...args);
    };
    try {
      render();
    } finally {
      console.log = originalLog;
    }
  };
  const cleanup = () => {
    input.off('keypress', onKeypress);
    input.setRawMode?.(previousRawMode || false);
    output.write('\x1b[?25h\n');
  };
  const onKeypress = (sequence, key = {}) => {
    if (key.ctrl && key.name === 'c') {
      cleanup();
      process.kill(process.pid, 'SIGINT');
      return;
    }
    const value = onKey(key, sequence);
    if (value !== undefined) {
      cleanup();
      resolve(value);
      return;
    }
    redraw();
  };
  emitKeypressEvents(input);
  input.setRawMode?.(true);
  input.resume();
  input.on('keypress', onKeypress);
  redraw();
});

const askYesNo = async (rl, label, defaultValue) => {
  const suffix = defaultValue ? 'Y/n' : 'y/N';
  while (true) {
    const answer = (await rl.question(`${label} [${suffix}]: `)).trim().toLowerCase();
    if (!answer) return defaultValue;
    if (['y', 'yes'].includes(answer)) return true;
    if (['n', 'no'].includes(answer)) return false;
    console.log(color('yellow', 'Enter yes or no.'));
  }
};

const askPositiveInt = async (rl, label, defaultValue, min, max) => {
  while (true) {
    const answer = (await rl.question(`${label} [${defaultValue}]: `)).trim();
    if (!answer) return defaultValue;
    const value = Number.parseInt(answer, 10);
    if (Number.isInteger(value) && value >= min && value <= max) return value;
    console.log(color('yellow', `Enter a number between ${min} and ${max}.`));
  }
};

const main = async () => {
  let removeShutdownHandlers = null;
  try {
    const { target: rawTarget, options } = parseArgs(process.argv.slice(2));
    if (!options.color) colorEnabled = false;
    if (!options.json) clearTerminal();
    const updateResult = await maybeAutoUpdate(options);
    if (updateResult.restarted) {
      process.exitCode = updateResult.exitCode ?? 0;
      return;
    }
    if (options.forceUpdate && !rawTarget) return;
    if (options.help) {
      console.log(getHelp());
      return;
    }
    if (options.version) {
      console.log(VERSION);
      return;
    }
    const interactiveSetup = options.interactive ? await runInteractiveSetup(rawTarget, options) : { target: rawTarget, options };
    if (options.interactive && !interactiveSetup.options.json) clearTerminal();
    const target = normalizeTarget(interactiveSetup.target);
    const shutdownController = new AbortController();
    activeShutdownSignal = shutdownController.signal;
    removeShutdownHandlers = installShutdownHandlers(shutdownController);
    const results = await runScan(target, interactiveSetup.options);
    const json = JSON.stringify(results, null, interactiveSetup.options.pretty ? 2 : 0);
    if (interactiveSetup.options.output) await fs.writeFile(interactiveSetup.options.output, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
    if (interactiveSetup.options.json) console.log(json);
    else {
      printResults(results);
      if (interactiveSetup.options.output) console.log(`\nFull JSON written to ${interactiveSetup.options.output}`);
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
