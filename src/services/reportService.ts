import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver'; // For saving DOCX files
import { Scan } from './scanService';

const getSecurityRecommendations = (scan: Scan): string[] => {
  const recommendations: string[] = [];
  
  // SQL Injection recommendations
  if (scan.results.sqlinjection?.vulnerable) {
    recommendations.push('CRITICAL: SQL Injection Detected');
    recommendations.push('• Use parameterized queries/prepared statements');
    recommendations.push('• Implement input validation and sanitization');
    recommendations.push('• Use ORM frameworks (Sequelize, TypeORM, etc.)');
    recommendations.push('• Apply principle of least privilege to database users');
    recommendations.push('• Enable WAF (Web Application Firewall)');
  }
  
  // XSS recommendations
  if (scan.results.xss?.vulnerable) {
    recommendations.push('CRITICAL: XSS Vulnerability Detected');
    recommendations.push('• Encode all user input before rendering');
    recommendations.push('• Implement Content Security Policy (CSP)');
    recommendations.push('• Use HTTPOnly and Secure flags on cookies');
    recommendations.push('• Sanitize HTML input with DOMPurify or similar');
    recommendations.push('• Validate input on both client and server side');
    recommendations.push('• Deploy Web Application Firewall (WAF)');
  }
  
  // LFI recommendations
  if (scan.results.lfi?.vulnerable) {
    recommendations.push('CRITICAL: Local File Inclusion Detected');
    recommendations.push('• Use whitelisting for allowed file paths');
    recommendations.push('• Validate and sanitize all user input');
    recommendations.push('• Reject path traversal patterns (../, ..\)');
    recommendations.push('• Use built-in secure file handling functions');
    recommendations.push('• Disable remote file inclusion');
    recommendations.push('• Run application with minimum file permissions');
    recommendations.push('• Deploy Web Application Firewall (WAF)');
  }
  
  // CORS Misconfiguration recommendations
  if (scan.results.corsMisconfig?.vulnerable) {
    recommendations.push('CRITICAL: CORS Misconfiguration Detected');
    recommendations.push('• Avoid `Access-Control-Allow-Origin: *` for sensitive resources.');
    recommendations.push('• Do not reflect the `Origin` header dynamically without strict validation.');
    recommendations.push('• Explicitly whitelist allowed origins, and ensure they are fully qualified domains.');
    recommendations.push('• Be cautious with `null` origin; only allow if absolutely necessary.');
  }

  // WordPress recommendations
  if (scan.results.wordpress?.vulnerabilities?.length > 0) {
    recommendations.push('HIGH: WordPress Security Issues');
    recommendations.push('• Update WordPress to latest version immediately');
    recommendations.push('• Remove or secure sensitive files (wp-config backups)');
    recommendations.push('• Disable XML-RPC if not needed');
    recommendations.push('• Use security plugins (Wordfence, Sucuri)');
    recommendations.push('• Enable two-factor authentication');
    recommendations.push('• Regular security audits and updates');
  }

  // DDoS Firewall recommendations
  if (scan.results.ddosFirewall?.firewallDetected) {
    recommendations.push('INFO: DDoS/WAF Protection Detected');
    recommendations.push('• Verify the configuration of your DDoS protection and WAF.');
    recommendations.push('• Ensure rules are up-to-date and effective against common attack vectors.');
    recommendations.push('• Regularly review logs for suspicious activity.');
  }
  
  // Security headers recommendations
  const headers = scan.results.headers;
  if (headers?.securityHeaders) {
    const missing = headers.securityHeaders.missing || [];
    if (missing.length > 0) {
      recommendations.push('MEDIUM: Missing Security Headers');
      missing.forEach((header: any) => {
        recommendations.push(`• ${header.name}: ${header.recommendation}`);
      });
    }
  }

  // MX record recommendations (SPF/DMARC)
  if (scan.config.mx && scan.results.mx) {
    if (!scan.results.mx.spfRecord) {
      recommendations.push('MEDIUM: Missing SPF Record');
      recommendations.push('• Implement an SPF record to prevent email spoofing and unauthorized use of your domain for sending emails.');
    }
    if (!scan.results.mx.dmarcRecord) {
      recommendations.push('MEDIUM: Missing DMARC Record');
      recommendations.push('• Implement a DMARC record to gain visibility into email authentication failures and protect against phishing attacks.');
    }
  }

  // VirusTotal recommendations
  if (scan.results.virustotal?.reputation !== undefined && scan.results.virustotal.reputation < 0) {
    recommendations.push('HIGH: Negative VirusTotal Reputation');
    recommendations.push('• Investigate the cause of the negative reputation (e.g., malware, phishing).');
    recommendations.push('• Clean up any detected malicious content or associations.');
    recommendations.push('• Submit a false positive report to VirusTotal if applicable.');
  }
  if (scan.results.virustotal?.detectedUrls && scan.results.virustotal.detectedUrls.some(u => u.positives > 0)) {
    recommendations.push('HIGH: Malicious URLs Detected by VirusTotal');
    recommendations.push('• Review and remove any detected malicious URLs from your website.');
    recommendations.push('• Ensure all external links are legitimate and safe.');
  }

  // SSL/TLS recommendations
  if (scan.results.sslTls?.isExpired) {
    recommendations.push('CRITICAL: SSL Certificate Expired');
    recommendations.push('• Renew your SSL/TLS certificate immediately to restore secure communication and trust.');
  } else if (scan.results.sslTls?.daysUntilExpiry !== undefined && scan.results.sslTls.daysUntilExpiry <= 30) {
    recommendations.push('HIGH: SSL Certificate Expiring Soon');
    recommendations.push('• Renew your SSL/TLS certificate within the next 30 days to avoid service disruption.');
  }

  // Broken Links recommendations
  if (scan.results.brokenLinks?.brokenLinks && scan.results.brokenLinks.brokenLinks.length > 0) {
    recommendations.push('MEDIUM: Broken Links Detected');
    recommendations.push('• Fix or remove broken internal links to improve user experience and SEO.');
    recommendations.push('• Update or remove broken external links.');
  }
  
  return recommendations;
};

export const generatePdfReport = (scan: Scan, returnContent: boolean = false): string | void => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Calculate vulnerability counts upfront
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const corsMisconfigVulns = scan.results.corsMisconfig?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const ddosFirewallDetected = (scan.results.ddosFirewall?.firewallDetected) ? 1 : 0;
  const virustotalMalicious = (scan.results.virustotal?.maliciousVotes || 0) > 0 ? 1 : 0;
  const sslTlsExpired = (scan.results.sslTls?.isExpired) ? 1 : 0;
  const brokenLinksCount = (scan.results.brokenLinks?.brokenLinks?.length || 0) > 0 ? 1 : 0;
  const totalVulns = sqlVulns + xssVulns + lfiVulns + corsMisconfigVulns + wpVulns + ddosFirewallDetected + virustotalMalicious + sslTlsExpired + brokenLinksCount;

  // Modern Header with gradient effect
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Accent bar
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, 210, 3, 'F');
  
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ABSpider Recon', 14, 24);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Security Assessment Report', 14, 34);
  
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()} | Classification: CONFIDENTIAL`, 14, 44);
  
  yPosition = 60;

  // Executive Summary with modern design
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPosition, 182, 50, 3, 3, 'F');
  
  doc.setFillColor(6, 182, 212);
  doc.roundedRect(14, yPosition, 182, 8, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 20, yPosition + 6);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Target Domain: ${scan.target}`, 20, yPosition + 18);
  doc.text(`Scan ID: ${scan.id}`, 20, yPosition + 25);
  doc.text(`Timestamp: ${new Date(scan.timestamp).toLocaleString()}`, 20, yPosition + 32);
  
  if (scan.elapsedMs) {
    const seconds = Math.floor(scan.elapsedMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const timeStr = minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
    doc.text(`Duration: ${timeStr}`, 20, yPosition + 39);
  }
  
  const statusColor = scan.status === 'completed' ? [16, 185, 129] : [239, 68, 68];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Status: ${scan.status.toUpperCase()}`, 140, yPosition + 25);
  
  // Risk level indicator
  const riskLevel = totalVulns > 0 ? 'HIGH RISK' : 'LOW RISK';
  const riskColor = totalVulns > 0 ? [239, 68, 68] : [16, 185, 129];
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`Risk: ${riskLevel}`, 140, yPosition + 39);
  
  yPosition += 60;

  // Security Recommendations
  const recommendations = getSecurityRecommendations(scan);
  if (recommendations.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(239, 68, 68);
    doc.rect(0, yPosition - 10, 210, 15, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('WARNING: SECURITY RECOMMENDATIONS', 14, yPosition);
    
    yPosition += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    recommendations.forEach(rec => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const lines = doc.splitTextToSize(rec, 180);
      lines.forEach((line: string) => {
        doc.text(line, 14, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
    });
  }

  // Vulnerability Summary
  if (totalVulns > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(239, 68, 68);
    doc.rect(0, yPosition - 10, 210, 15, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SECURITY: VULNERABILITY SUMMARY', 14, yPosition);
    
    yPosition += 15;
    
    const vulnData = [
      ['SQL Injection', sqlVulns.toString(), sqlVulns > 0 ? 'CRITICAL' : 'SAFE', sqlVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['Cross-Site Scripting (XSS)', xssVulns.toString(), xssVulns > 0 ? 'CRITICAL' : 'SAFE', xssVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['Local File Inclusion (LFI)', lfiVulns.toString(), lfiVulns > 0 ? 'CRITICAL' : 'SAFE', lfiVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['CORS Misconfiguration', corsMisconfigVulns.toString(), corsMisconfigVulns > 0 ? 'CRITICAL' : 'SAFE', corsMisconfigVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['WordPress Security', wpVulns.toString(), wpVulns > 0 ? 'HIGH' : 'SAFE', wpVulns > 0 ? 'Update and secure' : 'No issues found'],
      ['DDoS/WAF Detection', ddosFirewallDetected.toString(), ddosFirewallDetected > 0 ? 'INFO' : 'N/A', ddosFirewallDetected > 0 ? 'Protection detected' : 'No protection detected'],
      ['VirusTotal Malicious', virustotalMalicious.toString(), virustotalMalicious > 0 ? 'HIGH' : 'SAFE', virustotalMalicious > 0 ? 'Investigate reputation' : 'No malicious activity'],
      ['SSL Certificate Expired', sslTlsExpired.toString(), sslTlsExpired > 0 ? 'CRITICAL' : 'VALID', sslTlsExpired > 0 ? 'Renew certificate immediately' : 'Certificate is valid'],
      ['Broken Links', brokenLinksCount.toString(), brokenLinksCount > 0 ? 'MEDIUM' : 'SAFE', brokenLinksCount > 0 ? 'Review and fix links' : 'No broken links found'],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Vulnerability Type', 'Count', 'Severity', 'Action']],
      body: vulnData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { fontStyle: 'bold' },
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Detailed SQL Injection Results
  if (scan.results.sqlinjection?.vulnerabilities?.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(220, 38, 38);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SQL: SQL Injection Vulnerabilities', 14, yPosition);
    yPosition += 15;
    
    const sqlData = scan.results.sqlinjection.vulnerabilities.map((vuln: any) => [
      vuln.severity.toUpperCase(),
      vuln.type || 'N/A',
      vuln.parameter || 'N/A',
      vuln.payload.substring(0, 40) + '...',
      vuln.evidence ? vuln.evidence.substring(0, 60) + '...' : 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Severity', 'Type', 'Parameter', 'Payload', 'Evidence']],
      body: sqlData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], fontStyle: 'bold' },
      styles: { fontSize: 7 },
    });
  }

  // Detailed XSS Results
  if (scan.results.xss?.vulnerabilities?.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(234, 88, 12);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('XSS: XSS Vulnerabilities', 14, yPosition);
    yPosition += 15;
    
    const xssData = scan.results.xss.vulnerabilities.map((vuln: any) => [
      vuln.severity.toUpperCase(),
      vuln.type || 'N/A',
      vuln.parameter || vuln.location || 'N/A',
      vuln.payload.substring(0, 40) + '...',
      vuln.evidence ? vuln.evidence.substring(0, 60) + '...' : 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Severity', 'Type', 'Location', 'Payload', 'Evidence']],
      body: xssData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], fontStyle: 'bold' },
      styles: { fontSize: 7 },
    });
  }

  // Detailed LFI Results
  if (scan.results.lfi?.vulnerabilities?.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(251, 146, 60);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('LFI: Local File Inclusion Vulnerabilities', 14, yPosition);
    yPosition += 15;
    
    const lfiData = scan.results.lfi.vulnerabilities.map((vuln: any) => [
      vuln.severity.toUpperCase(),
      vuln.type || 'N/A',
      vuln.parameter || 'N/A',
      vuln.payload.substring(0, 40) + '...',
      `${(vuln.confidence * 100).toFixed(0)}%`,
      vuln.indicator || 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Severity', 'Type', 'Parameter', 'Payload', 'Confidence', 'Indicator']],
      body: lfiData,
      theme: 'grid',
      headStyles: { fillColor: [251, 146, 60], fontStyle: 'bold' },
      styles: { fontSize: 7 },
    });
  }

  // Detailed CORS Misconfiguration Results
  if (scan.results.corsMisconfig?.vulnerabilities?.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(255, 193, 7); // Yellow for CORS
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Dark text for yellow background
    doc.setFont('helvetica', 'bold');
    doc.text('CORS: CORS Misconfiguration Vulnerabilities', 14, yPosition);
    yPosition += 15;
    
    const corsData = scan.results.corsMisconfig.vulnerabilities.map((vuln: any) => [
      vuln.severity.toUpperCase(),
      vuln.type.replace(/_/g, ' ') || 'N/A',
      vuln.originTested || 'N/A',
      vuln.evidence ? vuln.evidence.substring(0, 60) + '...' : 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Severity', 'Type', 'Origin Tested', 'Evidence']],
      body: corsData,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 7 },
    });
  }

  // Site Information
  if (scan.results.siteInfo) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(6, 182, 212);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SITE INFO: Site Information', 14, yPosition);
    yPosition += 15;
    
    const siteData = [
      ['Title', scan.results.siteInfo.title || 'N/A'],
      ['IP Address', scan.results.siteInfo.ip || 'N/A'],
      ['Web Server', scan.results.siteInfo.webServer || 'N/A'],
      ['CMS', scan.results.siteInfo.cms || 'None detected'],
      ['Cloudflare', scan.results.siteInfo.cloudflare ? 'Yes' : 'No'],
      ['Status Code', scan.results.siteInfo.statusCode?.toString() || 'N/A'],
      ['Response Time', scan.results.siteInfo.responseTime ? `${scan.results.siteInfo.responseTime}ms` : 'N/A'],
      ['Technologies', scan.results.siteInfo.technologies.join(', ') || 'None detected'],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: siteData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Technology Stack Fingerprinting
  if (scan.results.techStack && scan.results.techStack.technologies.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(0, 123, 255); // Blue for Tech Stack
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`TECH STACK: Technologies Detected (${scan.results.techStack.technologies.length})`, 14, yPosition);
    yPosition += 15;
    
    const techStackData = scan.results.techStack.technologies.map((tech: any) => [
      tech.name,
      tech.category,
      tech.version || 'N/A',
      tech.confidence ? `${(tech.confidence * 100).toFixed(0)}%` : 'N/A',
      tech.evidence ? tech.evidence.substring(0, 60) + '...' : 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Technology', 'Category', 'Version', 'Confidence', 'Evidence']],
      body: techStackData,
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255], fontStyle: 'bold' },
      styles: { fontSize: 7 },
    });
  }

  // Security Headers Analysis
  if (scan.results.headers?.securityHeaders) {
    doc.addPage();
    yPosition = 20;
    
    const headers = scan.results.headers;
    const grade = headers.securityHeaders.grade || 'N/A';
    const gradeColor = grade === 'A+' || grade === 'A' ? [16, 185, 129] : 
                       grade === 'B' ? [234, 179, 8] : [239, 68, 68];
    
    doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`HEADERS: Security Headers Analysis - Grade: ${grade}`, 14, yPosition);
    yPosition += 15;
    
    if (headers.securityHeaders.present?.length > 0) {
      const presentData = headers.securityHeaders.present.map((h: any) => [
        h.name,
        h.secure ? '✓ Secure' : '⚠ Needs improvement',
        h.recommendation || 'Properly configured',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Header', 'Status', 'Notes']],
        body: presentData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
    
    if (headers.securityHeaders.missing?.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      const missingData = headers.securityHeaders.missing.map((h: any) => [
        h.name,
        h.severity.toUpperCase(),
        h.recommendation,
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Missing Header', 'Severity', 'Recommendation']],
        body: missingData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
    }
  }

  // GeoIP Information
  if (scan.results.geoip) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(139, 92, 246);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('GEOIP: GeoIP Information', 14, yPosition);
    yPosition += 15;
    
    const geoipData = [
      ['IP Address', scan.results.geoip.ip || 'N/A'],
      ['Country', scan.results.geoip.country || 'N/A'],
      ['City', scan.results.geoip.city || 'N/A'],
      ['Region', scan.results.geoip.region || 'N/A'],
      ['Timezone', scan.results.geoip.timezone || 'N/A'],
      ['ISP', scan.results.geoip.isp || 'N/A'],
      ['ASN', scan.results.geoip.asn || 'N/A'],
      ['Coordinates', scan.results.geoip.latitude && scan.results.geoip.longitude ? 
        `${scan.results.geoip.latitude}, ${scan.results.geoip.longitude}` : 'N/A'],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: geoipData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
  }

  // DNS Records
  if (scan.results.dns) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(59, 130, 246);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DNS: DNS Records', 14, yPosition);
    yPosition += 15;
    
    const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
    for (const type of recordTypes) {
      const records = scan.results.dns.records[type as keyof typeof scan.results.dns.records];
      if (records && records.length > 0) {
        const recordData = records.map((r: any) => [type, r.value, r.ttl?.toString() || 'N/A']);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Type', 'Value', 'TTL']],
          body: recordData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
          styles: { fontSize: 8 },
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 5;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      }
    }
  }

  // Subdomains
  if (scan.results.subdomains && scan.results.subdomains.subdomains.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(16, 185, 129);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`SUBDOMAINS: Discovered Subdomains (${scan.results.subdomains.subdomains.length})`, 14, yPosition);
    yPosition += 15;
    
    const subdomainData = scan.results.subdomains.subdomains.map((subdomain, index) => [
      (index + 1).toString(),
      subdomain
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Subdomain']],
      body: subdomainData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      styles: { fontSize: 8 },
    });
  }

  // SEO Analysis
  if (scan.results.seo) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(236, 72, 153);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SEO: SEO Analysis', 14, yPosition);
    yPosition += 15;
    
    const seoData = [
      ['HTTP Code', scan.results.seo.httpCode.toString()],
      ['Page Title', scan.results.seo.title],
      ['Load Time', `${scan.results.seo.loadTime}ms`],
      ['Page Size', `${(scan.results.seo.pageSize / 1024).toFixed(2)} KB`],
      ['Images', scan.results.seo.imageCount.toString()],
      ['Total Links', scan.results.seo.linkCount.total.toString()],
      ['Internal Links', scan.results.seo.linkCount.internal.toString()],
      ['External Links', scan.results.seo.linkCount.external.toString()],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: seoData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
  }

  // Broken Link Results
  if (scan.results.brokenLinks && scan.results.brokenLinks.brokenLinks.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(255, 99, 71); // Tomato color for Broken Links
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`BROKEN LINKS: Broken Links Found (${scan.results.brokenLinks.brokenLinks.length})`, 14, yPosition);
    yPosition += 15;
    
    const brokenLinkData = scan.results.brokenLinks.brokenLinks.map((link: any) => [
      link.url.substring(0, 70) + (link.url.length > 70 ? '...' : ''),
      link.status.toString(),
      link.isInternal ? 'Internal' : 'External',
      link.sourcePage ? link.sourcePage.substring(0, 50) + '...' : 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['URL', 'Status', 'Type', 'Source Page']],
      body: brokenLinkData,
      theme: 'grid',
      headStyles: { fillColor: [255, 99, 71], fontStyle: 'bold' },
      styles: { fontSize: 7 },
    });
  }

  // DDoS Firewall Results
  if (scan.results.ddosFirewall?.tested) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(128, 0, 128); // Purple color for DDoS
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DDoS: DDoS Firewall Test Results', 14, yPosition);
    yPosition += 15;

    const ddosData = [
      ['Firewall Detected', scan.results.ddosFirewall.firewallDetected ? 'Yes' : 'No'],
      ['WAF/CDN Detected', scan.results.ddosFirewall.wafDetected || 'N/A'],
      ['Total Requests', scan.results.ddosFirewall.totalRequests.toString()],
      ['Successful Requests', scan.results.ddosFirewall.successfulRequests.toString()],
      ['Failed Requests', scan.results.ddosFirewall.failedRequests.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: ddosData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    if (scan.results.ddosFirewall.indicators.length > 0) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Detection Indicators:', 14, yPosition);
      yPosition += 5;
      scan.results.ddosFirewall.indicators.forEach(indicator => {
        if (yPosition > 270) { doc.addPage(); yPosition = 20; }
        doc.text(`• ${indicator}`, 14, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if (scan.results.ddosFirewall.responseSummary.length > 0) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Response Summary:', 14, yPosition);
      yPosition += 5;
      const summaryData = scan.results.ddosFirewall.responseSummary.map(s => [
        s.status.toString(),
        s.count.toString(),
        `${s.avgResponseTime.toFixed(2)}ms`
      ]);
      autoTable(doc, {
        startY: yPosition,
        head: [['Status Code', 'Count', 'Avg. Response Time']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 128], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // VirusTotal Results
  if (scan.results.virustotal?.tested) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(220, 38, 38); // Red for VirusTotal
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('VIRUSTOTAL: VirusTotal Scan Results', 14, yPosition);
    yPosition += 15;

    const vtData = [
      ['Domain', scan.results.virustotal.domain],
      ['Reputation', scan.results.virustotal.reputation?.toString() || 'N/A'],
      ['Malicious Votes', scan.results.virustotal.maliciousVotes?.toString() || '0'],
      ['Harmless Votes', scan.results.virustotal.harmlessVotes?.toString() || '0'],
      ['Last Analysis', scan.results.virustotal.lastAnalysisDate ? new Date(scan.results.virustotal.lastAnalysisDate).toLocaleString() : 'N/A'],
      ['Registrar', scan.results.virustotal.registrar || 'N/A'],
      ['Categories', scan.results.virustotal.categories?.join(', ') || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: vtData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    if (scan.results.virustotal.detectedUrls && scan.results.virustotal.detectedUrls.length > 0) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Detected URLs:', 14, yPosition);
      yPosition += 5;
      const urlsData = scan.results.virustotal.detectedUrls.map(u => [
        u.url.substring(0, 70) + (u.url.length > 70 ? '...' : ''),
        `${u.positives}/${u.total} Malicious`
      ]);
      autoTable(doc, {
        startY: yPosition,
        head: [['URL', 'Detections']],
        body: urlsData,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // SSL/TLS Analysis Results
  if (scan.results.sslTls?.tested) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(139, 92, 246); // Purple for SSL/TLS
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SSL/TLS: SSL/TLS Analysis Results', 14, yPosition);
    yPosition += 15;

    const sslData = [
      ['Domain', scan.results.sslTls.domain],
      ['Issuer', scan.results.sslTls.certificateIssuer || 'N/A'],
      ['Subject', scan.results.sslTls.certificateSubject || 'N/A'],
      ['Valid From', scan.results.sslTls.validFrom || 'N/A'],
      ['Valid To', scan.results.sslTls.validTo || 'N/A'],
      ['Status', scan.results.sslTls.isExpired ? 'Expired' : (scan.results.sslTls.daysUntilExpiry !== undefined && scan.results.sslTls.daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Valid')],
      ['Days Until Expiry', scan.results.sslTls.daysUntilExpiry?.toString() || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: sslData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    if (scan.results.sslTls.commonNames && scan.results.sslTls.commonNames.length > 0) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Common Names:', 14, yPosition);
      yPosition += 5;
      doc.text(scan.results.sslTls.commonNames.join(', '), 14, yPosition);
      yPosition += 10;
    }
    if (scan.results.sslTls.altNames && scan.results.sslTls.altNames.length > 0) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Alternative Names:', 14, yPosition);
      yPosition += 5;
      doc.text(scan.results.sslTls.altNames.join(', '), 14, yPosition);
      yPosition += 10;
    }
    if (scan.results.sslTls.fingerprintSha256) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Fingerprint (SHA256):', 14, yPosition);
      yPosition += 5;
      doc.text(scan.results.sslTls.fingerprintSha256, 14, yPosition);
      yPosition += 10;
    }
  }

  // Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`ABSpider Recon Dashboard | Page ${i} of ${pageCount}`, 14, 285);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 285);
    doc.text('Confidential Security Report', 14, 290);
  }

  if (returnContent) {
    return doc.output('datauristring'); // Return as Data URL for preview
  } else {
    doc.save(`abspider-security-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`);
  }
};

export const generateDocxReport = async (scan: Scan, returnContent: boolean = false): Promise<string | void> => {
  const recommendations = getSecurityRecommendations(scan);
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: 'ABSpider Recon Dashboard',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: 'Comprehensive Security Assessment Report',
          heading: HeadingLevel.HEADING1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Generated: ${new Date().toLocaleString()} | Classification: CONFIDENTIAL`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: 'Executive Summary',
          heading: HeadingLevel.HEADING2,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Target Domain: ${scan.target}`, break: 1 }),
            new TextRun({ text: `Scan ID: ${scan.id}`, break: 1 }),
            new TextRun({ text: `Timestamp: ${new Date(scan.timestamp).toLocaleString()}`, break: 1 }),
            new TextRun({ text: `Status: ${scan.status.toUpperCase()}`, break: 1 }),
            new TextRun({ text: `Security Grade: ${scan.securityGrade?.toFixed(1) || 'N/A'}/10`, break: 1 }),
          ],
          spacing: { after: 200 },
        }),
        ...(recommendations.length > 0 ? [
          new Paragraph({
            text: 'Security Recommendations',
            heading: HeadingLevel.HEADING2,
            spacing: { after: 100 },
          }),
          ...recommendations.map(rec => new Paragraph({ text: rec })),
        ] : []),
        // Add more sections as needed for DOCX
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  if (returnContent) {
    // For DOCX, we can't easily return a data URL for direct iframe display.
    // Instead, we'll return a placeholder or a base64 representation if needed,
    // but for a simple text preview, we'll extract text.
    // For now, let's return a message indicating it's not directly previewable as text.
    return "DOCX reports are not directly previewable as text. Please download to view.";
  } else {
    saveAs(blob, `abspider-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}.docx`);
  }
};

export const generateMarkdownReport = (scan: Scan, returnContent: boolean = false): string | void => {
  const recommendations = getSecurityRecommendations(scan);
  let markdown = `# ABSpider Recon Dashboard - Security Assessment Report\n\n`;
  markdown += `**Target Domain:** ${scan.target}\n`;
  markdown += `**Scan ID:** ${scan.id}\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
  markdown += `**Status:** ${scan.status.toUpperCase()}\n`;
  markdown += `**Security Grade:** ${scan.securityGrade?.toFixed(1) || 'N/A'}/10\n\n`;

  markdown += `## Executive Summary\n\n`;
  markdown += `This report summarizes the reconnaissance and security assessment performed by ABSpider Recon Dashboard on \`${scan.target}\`.\n\n`;
  markdown += `The scan was initiated on ${new Date(scan.timestamp).toLocaleString()} and completed with a status of **${scan.status.toUpperCase()}**.\n\n`;
  markdown += `Overall Security Grade: **${scan.securityGrade?.toFixed(1) || 'N/A'}/10**.\n\n`;

  if (recommendations.length > 0) {
    markdown += `## Security Recommendations\n\n`;
    recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += '\n';
  }

  // Add more sections as needed for Markdown
  // Example: Vulnerability Summary
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const corsMisconfigVulns = scan.results.corsMisconfig?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;

  if (sqlVulns > 0 || xssVulns > 0 || lfiVulns > 0 || corsMisconfigVulns > 0 || wpVulns > 0) {
    markdown += `## Vulnerability Overview\n\n`;
    markdown += `| Vulnerability Type        | Count |\n`;
    markdown += `|---------------------------|-------|\n`;
    if (sqlVulns > 0) markdown += `| SQL Injection             | ${sqlVulns}    |\n`;
    if (xssVulns > 0) markdown += `| XSS Vulnerabilities       | ${xssVulns}    |\n`;
    if (lfiVulns > 0) markdown += `| LFI Vulnerabilities       | ${lfiVulns}    |\n`;
    if (corsMisconfigVulns > 0) markdown += `| CORS Misconfiguration     | ${corsMisconfigVulns}    |\n`;
    if (wpVulns > 0) markdown += `| WordPress Issues          | ${wpVulns}    |\n`;
    markdown += '\n';
  }

  if (returnContent) {
    return markdown;
  } else {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `abspider-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}.md`);
  }
};

export const generateCsvReport = (scan: Scan, returnContent: boolean = false): string | void => {
  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return '';
    let str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  let csvContent = `Report Type,ABSpider Recon Dashboard\n`;
  csvContent += `Target,${escapeCsv(scan.target)}\n`;
  csvContent += `Scan ID,${escapeCsv(scan.id)}\n`;
  csvContent += `Generated,${escapeCsv(new Date().toLocaleString())}\n`;
  csvContent += `Status,${escapeCsv(scan.status.toUpperCase())}\n`;
  csvContent += `Security Grade,${escapeCsv(scan.securityGrade?.toFixed(1) || 'N/A')}/10\n`;
  csvContent += `\n`;

  csvContent += `Vulnerability Summary\n`;
  csvContent += `Vulnerability Type,Count,Severity\n`;

  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const corsMisconfigVulns = scan.results.corsMisconfig?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const ddosFirewallDetected = (scan.results.ddosFirewall?.firewallDetected) ? 1 : 0;
  const virustotalMalicious = (scan.results.virustotal?.maliciousVotes || 0) > 0 ? 1 : 0;
  const sslTlsExpired = (scan.results.sslTls?.isExpired) ? 1 : 0;
  const brokenLinksCount = (scan.results.brokenLinks?.brokenLinks?.length || 0) > 0 ? 1 : 0;

  csvContent += `SQL Injection,${escapeCsv(sqlVulns)},${escapeCsv(sqlVulns > 0 ? 'CRITICAL' : 'SAFE')}\n`;
  csvContent += `Cross-Site Scripting (XSS),${escapeCsv(xssVulns)},${escapeCsv(xssVulns > 0 ? 'CRITICAL' : 'SAFE')}\n`;
  csvContent += `Local File Inclusion (LFI),${escapeCsv(lfiVulns)},${escapeCsv(lfiVulns > 0 ? 'CRITICAL' : 'SAFE')}\n`;
  csvContent += `CORS Misconfiguration,${escapeCsv(corsMisconfigVulns)},${escapeCsv(corsMisconfigVulns > 0 ? 'CRITICAL' : 'SAFE')}\n`;
  csvContent += `WordPress Security,${escapeCsv(wpVulns)},${escapeCsv(wpVulns > 0 ? 'HIGH' : 'SAFE')}\n`;
  csvContent += `DDoS/WAF Detection,${escapeCsv(ddosFirewallDetected)},${escapeCsv(ddosFirewallDetected > 0 ? 'INFO' : 'N/A')}\n`;
  csvContent += `VirusTotal Malicious,${escapeCsv(virustotalMalicious)},${escapeCsv(virustotalMalicious > 0 ? 'HIGH' : 'SAFE')}\n`;
  csvContent += `SSL Certificate Expired,${escapeCsv(sslTlsExpired)},${escapeCsv(sslTlsExpired > 0 ? 'CRITICAL' : 'VALID')}\n`;
  csvContent += `Broken Links,${escapeCsv(brokenLinksCount)},${escapeCsv(brokenLinksCount > 0 ? 'MEDIUM' : 'SAFE')}\n`;
  csvContent += `\n`;

  // Add more detailed module summaries if needed, e.g., for SQLi vulnerabilities
  if (sqlVulns > 0) {
    csvContent += `SQL Injection Details\n`;
    csvContent += `Severity,Type,Parameter,Payload,Evidence\n`;
    scan.results.sqlinjection?.vulnerabilities?.forEach(vuln => {
      csvContent += `${escapeCsv(vuln.severity.toUpperCase())},${escapeCsv(vuln.type || 'N/A')},${escapeCsv(vuln.parameter || 'N/A')},${escapeCsv(vuln.payload)},${escapeCsv(vuln.evidence || 'N/A')}\n`;
    });
    csvContent += `\n`;
  }
  // Repeat for XSS, LFI, etc.

  if (returnContent) {
    return csvContent;
  } else {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `abspider-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}.csv`);
  }
};