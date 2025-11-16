import { extractDomain } from './apiUtils';
import { getAPIKey } from './apiKeyService';

export interface PortResult {
  port: number;
  status: 'open' | 'closed' | 'filtered';
  service: string;
  version?: string;
  banner?: string;
  // Added from Shodan
  product?: string;
  os?: string;
  vulnerabilities?: string[];
}

const COMMON_PORTS = [
  { port: 21, service: 'FTP', protocol: 'tcp' },
  { port: 22, service: 'SSH', protocol: 'tcp' },
  { port: 23, service: 'Telnet', protocol: 'tcp' },
  { port: 25, service: 'SMTP', protocol: 'tcp' },
  { port: 53, service: 'DNS', protocol: 'udp' },
  { port: 80, service: 'HTTP', protocol: 'tcp' },
  { port: 110, service: 'POP3', protocol: 'tcp' },
  { port: 135, service: 'MS RPC', protocol: 'tcp' },
  { port: 139, service: 'NetBIOS-SSN', protocol: 'tcp' },
  { port: 143, service: 'IMAP', protocol: 'tcp' },
  { port: 443, service: 'HTTPS', protocol: 'tcp' },
  { port: 445, service: 'SMB', protocol: 'tcp' },
  { port: 465, service: 'SMTPS', protocol: 'tcp' },
  { port: 587, service: 'SMTP', protocol: 'tcp' },
  { port: 993, service: 'IMAPS', protocol: 'tcp' },
  { port: 995, service: 'POP3S', protocol: 'tcp' },
  { port: 1433, service: 'MSSQL', protocol: 'tcp' },
  { port: 1521, service: 'Oracle SQL', protocol: 'tcp' },
  { port: 2000, service: 'Cisco SCCP', protocol: 'tcp' },
  { port: 2082, service: 'cPanel', protocol: 'tcp' },
  { port: 2083, service: 'cPanel SSL', protocol: 'tcp' },
  { port: 3000, service: 'Node.js/HTTP', protocol: 'tcp' },
  { port: 3306, service: 'MySQL', protocol: 'tcp' },
  { port: 3389, service: 'RDP', protocol: 'tcp' },
  { port: 5000, service: 'Flask/UPnP/HTTP', protocol: 'tcp' },
  { port: 5432, service: 'PostgreSQL', protocol: 'tcp' },
  { port: 5900, service: 'VNC', protocol: 'tcp' },
  { port: 6379, service: 'Redis', protocol: 'tcp' },
  { port: 8000, service: 'HTTP-Alt', protocol: 'tcp' },
  { port: 8080, service: 'HTTP-Proxy', protocol: 'tcp' },
  { port: 8443, service: 'HTTPS-Alt', protocol: 'tcp' },
  { port: 8888, service: 'HTTP-Alt', protocol: 'tcp' },
  { port: 9000, service: 'SonarQube/HTTP', protocol: 'tcp' },
  { port: 27017, service: 'MongoDB', protocol: 'tcp' },
  { port: 27018, service: 'MongoDB', protocol: 'tcp' },
  { port: 27019, service: 'MongoDB', protocol: 'tcp' },
];

const WEB_PORTS = [80, 443, 8000, 8080, 8443, 8888, 3000, 5000, 9000, 2082, 2083];

const detectService = async (domain: string, port: number, response?: Response): Promise<{ service: string; banner?: string }> => {
  if (WEB_PORTS.includes(port)) {
    let currentResponse = response;
    if (!currentResponse) {
      const protocol = [443, 8443, 2083].includes(port) ? 'https' : 'http';
      const testUrl = `${protocol}://${domain}:${port}`;
      try {
        // Try a direct HEAD request to get headers if not already provided
        currentResponse = await fetch(testUrl, { method: 'HEAD', mode: 'cors' });
      } catch (e) {
        // Fallback if HEAD fails (e.g., CORS blocked)
      }
    }

    if (currentResponse && currentResponse.ok) { // Only process if response is OK and readable
      const server = currentResponse.headers.get('server');
      const poweredBy = currentResponse.headers.get('x-powered-by');
      
      let detectedService = COMMON_PORTS.find(p => p.port === port)?.service || 'HTTP';
      let banner = '';
      
      if (server) {
        banner = `Server: ${server}`;
        if (server.toLowerCase().includes('nginx')) detectedService = 'Nginx';
        else if (server.toLowerCase().includes('apache')) detectedService = 'Apache';
        else if (server.toLowerCase().includes('iis')) detectedService = 'IIS';
      }
      
      if (poweredBy) {
        banner += banner ? ` | ${poweredBy}` : poweredBy;
        if (poweredBy.toLowerCase().includes('express')) detectedService = 'Express.js';
        else if (poweredBy.toLowerCase().includes('php')) detectedService = 'PHP';
      }
      
      return { service: detectedService, banner };
    }
  }
  
  return { service: COMMON_PORTS.find(p => p.port === port)?.service || 'Unknown' };
};

const checkPort = async (domain: string, portInfo: { port: number; service: string; protocol: string }): Promise<PortResult> => {
  const { port, service } = portInfo;
  const isWebPort = WEB_PORTS.includes(port);

  const protocolPrefix = [443, 8443, 2083].includes(port) ? 'https' : 'http';
  const testUrl = `${protocolPrefix}://${domain}:${port}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // Increased timeout for better detection

  try {
    // Attempt a fetch request to all ports. Use 'no-cors' to allow requests to non-HTTP ports.
    // A successful fetch (even with an opaque response) indicates reachability.
    const response = await fetch(testUrl, {
      method: 'HEAD', // Use HEAD for efficiency, but it's primarily a connection attempt
      signal: controller.signal,
      mode: 'no-cors', // Crucial for attempting non-HTTP ports
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    let detectedService = service;
    let banner: string | undefined;
    let status: 'open' | 'closed' | 'filtered' = 'open'; // Assume open if fetch succeeds

    // For known web ports, try to get more detailed service info
    if (isWebPort) {
      const serviceInfo = await detectService(domain, port); // This will attempt a 'cors' fetch internally if needed
      detectedService = serviceInfo.service;
      banner = serviceInfo.banner;
    } else {
      // For non-web ports, if we got an opaque response, it's 'filtered' as we can't inspect it.
      // If we got a network error, it would be caught below.
      status = 'filtered';
    }

    console.log(`[Port Scan] Port ${port} (${detectedService}) is ${status.toUpperCase()}`);
    return {
      port,
      status,
      service: detectedService,
      banner,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      // Timeout or user aborted. If timeout, it's likely filtered/closed.
      console.log(`[Port Scan] Port ${port} timed out or aborted.`);
      return {
        port,
        status: 'filtered' as const, // Could be filtered or just very slow
        service,
      };
    } else if (error instanceof TypeError) {
      // Network error, e.g., connection refused, host unreachable
      console.log(`[Port Scan] Port ${port} is CLOSED (network error).`);
      return {
        port,
        status: 'closed' as const,
        service,
      };
    } else {
      console.warn(`[Port Scan] Unexpected error for port ${port}:`, error);
      return {
        port,
        status: 'closed' as const, // Default to closed for other errors
        service,
      };
    }
  }
};

export const scanCommonPorts = async (
  target: string,
  threads: number = 5 // Threads parameter is not directly used for browser fetch concurrency, but kept for consistency
): Promise<PortResult[]> => {
  try {
    const domain = extractDomain(target);
    console.log(`[Port Scan] Starting enhanced scan for ${domain}`);
    
    const results: PortResult[] = [];
    const shodanKey = getAPIKey('shodan');

    let ipAddress: string | undefined;
    try {
      const dnsUrl = `https://dns.google/resolve?name=${domain}&type=A`;
      const dnsResponse = await fetch(dnsUrl);
      const dnsData = await dnsResponse.json();
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        ipAddress = dnsData.Answer[0].data;
        console.log(`[Port Scan] Resolved IP: ${ipAddress}`);
      }
    } catch (error) {
      console.warn('[Port Scan] Could not resolve IP for Shodan lookup:', error);
    }

    // --- Try Shodan API first if key is available and IP is resolved ---
    if (shodanKey && ipAddress) {
      try {
        console.log('[Port Scan] Attempting Shodan API lookup...');
        const shodanApiUrl = `https://api.shodan.io/shodan/host/${ipAddress}?key=${shodanKey}`;
        const shodanResponse = await fetch(shodanApiUrl);

        if (shodanResponse.ok) {
          const shodanData = await shodanResponse.json();
          if (shodanData.ports && shodanData.data) {
            shodanData.data.forEach((item: any) => {
              results.push({
                port: item.port,
                status: 'open', // Shodan only returns open ports
                service: item.transport || item.product || 'Unknown',
                banner: item.data,
                product: item.product,
                os: shodanData.os,
                vulnerabilities: item.vulns ? Object.keys(item.vulns) : undefined,
              });
            });
            console.log(`[Port Scan] ✓ Data from Shodan API: ${results.length} open ports`);
            return results.sort((a, b) => a.port - b.port); // Return Shodan results directly
          }
        } else {
          console.warn(`[Port Scan] Shodan API failed with status ${shodanResponse.status}, falling back...`);
        }
      } catch (shodanError) {
        console.warn('[Port Scan] Shodan API lookup failed:', shodanError);
      }
    }

    // --- Fallback to browser-based port scanning if Shodan fails or no key ---
    
    const portPromises: Promise<PortResult>[] = COMMON_PORTS.map(portInfo => checkPort(domain, portInfo));
    const allPortResults = await Promise.allSettled(portPromises);

    for (const result of allPortResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
    
    const openPorts = results.filter(r => r.status === 'open');
    console.log(`[Port Scan] Complete: ${openPorts.length} open ports found out of ${COMMON_PORTS.length} tested`);
    
    return results.sort((a, b) => a.port - b.port);
  } catch (error: any) {
    console.error('[Port Scan] Critical error:', error);
    throw error;
  }
};