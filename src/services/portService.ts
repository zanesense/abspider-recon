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
  { port: 143, service: 'IMAP', protocol: 'tcp' },
  { port: 443, service: 'HTTPS', protocol: 'tcp' },
  { port: 465, service: 'SMTPS', protocol: 'tcp' },
  { port: 587, service: 'SMTP', protocol: 'tcp' },
  { port: 993, service: 'IMAPS', protocol: 'tcp' },
  { port: 995, service: 'POP3S', protocol: 'tcp' },
  { port: 3000, service: 'Node.js', protocol: 'tcp' },
  { port: 3306, service: 'MySQL', protocol: 'tcp' },
  { port: 3389, service: 'RDP', protocol: 'tcp' },
  { port: 5000, service: 'Flask/UPnP', protocol: 'tcp' },
  { port: 5432, service: 'PostgreSQL', protocol: 'tcp' },
  { port: 5900, service: 'VNC', protocol: 'tcp' },
  { port: 6379, service: 'Redis', protocol: 'tcp' },
  { port: 8000, service: 'HTTP-Alt', protocol: 'tcp' },
  { port: 8080, service: 'HTTP-Proxy', protocol: 'tcp' },
  { port: 8443, service: 'HTTPS-Alt', protocol: 'tcp' },
  { port: 8888, service: 'HTTP-Alt', protocol: 'tcp' },
  { port: 9000, service: 'SonarQube', protocol: 'tcp' },
  { port: 27017, service: 'MongoDB', protocol: 'tcp' },
];

const detectService = async (domain: string, port: number): Promise<{ service: string; banner?: string }> => {
  const webPorts = [80, 443, 8000, 8080, 8443, 8888, 3000, 5000, 9000];
  
  if (webPorts.includes(port)) {
    const protocol = [443, 8443].includes(port) ? 'https' : 'http';
    const testUrl = `${protocol}://${domain}:${port}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const server = response.headers.get('server');
      const poweredBy = response.headers.get('x-powered-by');
      
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
    } catch (error) {
      return { service: COMMON_PORTS.find(p => p.port === port)?.service || 'Unknown' };
    }
  }
  
  return { service: COMMON_PORTS.find(p => p.port === port)?.service || 'Unknown' };
};

export const scanCommonPorts = async (
  target: string,
  threads: number = 5
): Promise<PortResult[]> => {
  try {
    const domain = extractDomain(target);
    console.log(`[Port Scan] Starting enhanced scan for ${domain} with ${threads} threads`);
    
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
    
    const checkPort = async (portInfo: { port: number; service: string; protocol: string }): Promise<PortResult> => {
      try {
        const { port, service, protocol } = portInfo;
        
        const webPorts = [80, 443, 8000, 8080, 8443, 8888, 3000, 5000, 9000];
        
        if (webPorts.includes(port)) {
          const protocolType = [443, 8443].includes(port) ? 'https' : 'http';
          const testUrl = `${protocolType}://${domain}:${port}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          try {
            const response = await fetch(testUrl, {
              method: 'HEAD',
              signal: controller.signal,
              mode: 'no-cors',
            });
            
            clearTimeout(timeoutId);
            
            const serviceInfo = await detectService(domain, port);
            
            console.log(`[Port Scan] Port ${port} (${serviceInfo.service}) is OPEN`);
            return {
              port,
              status: 'open' as const,
              service: serviceInfo.service,
              banner: serviceInfo.banner,
            };
          } catch (error) {
            clearTimeout(timeoutId);
            return {
              port,
              status: 'closed' as const,
              service,
            };
          }
        } else {
          return {
            port,
            status: 'filtered' as const,
            service,
          };
        }
      } catch (error: any) {
        return {
          port: portInfo.port,
          status: 'closed' as const,
          service: portInfo.service,
        };
      }
    };

    const chunks: typeof COMMON_PORTS = [];
    for (let i = 0; i < COMMON_PORTS.length; i += threads) {
      chunks.push(...COMMON_PORTS.slice(i, i + threads));
    }

    for (let i = 0; i < COMMON_PORTS.length; i += threads) {
      const chunk = COMMON_PORTS.slice(i, i + threads);
      const portPromises = chunk.map(portInfo => checkPort(portInfo));
      const portResults = await Promise.allSettled(portPromises);

      for (const result of portResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const openPorts = results.filter(r => r.status === 'open');
    console.log(`[Port Scan] Complete: ${openPorts.length} open ports found out of ${COMMON_PORTS.length} tested`);
    
    return results.sort((a, b) => a.port - b.port);
  } catch (error: any) {
    console.error('[Port Scan] Critical error:', error);
    throw error;
  }
};