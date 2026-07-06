import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
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

  // WAF protection recommendations
  if (scan.results.ddosFirewall?.firewallDetected) {
    recommendations.push('INFO: WAF Protection Detected');
    recommendations.push('• Verify the configuration of your WAF/CDN protection.');
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
  const openRedirectVulns = scan.results.openRedirect?.vulnerableCount || 0;
  const gitExposed = scan.results.gitExposure?.totalExposed || 0;
  const s3Open = scan.results.s3Bucket?.openBuckets || 0;
  const cveFound = scan.results.cveScanner?.totalFound || 0;
  const graphQLOpen = scan.results.graphQL?.openEndpoints || 0;
  const csrfUnprotected = scan.results.csrfDetection?.formsWithoutToken || 0;
  const emailHarvested = scan.results.emailHarvesting?.totalEmails || 0;
  const totalVulns = sqlVulns + xssVulns + lfiVulns + corsMisconfigVulns + wpVulns + ddosFirewallDetected + virustotalMalicious + sslTlsExpired + brokenLinksCount + openRedirectVulns + gitExposed + s3Open + cveFound + graphQLOpen + csrfUnprotected + (emailHarvested > 0 ? 1 : 0);

  // Cover Page
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(6, 182, 212); doc.rect(0, 100, 210, 4, 'F');
  doc.setFontSize(44); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
  doc.text('ABSpider Recon', 14, 60);
  doc.setFontSize(18); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
  doc.text('Comprehensive Security Assessment Report', 14, 78);
  doc.setFontSize(11); doc.setTextColor(100, 116, 139);
  doc.text(`Target: ${scan.target}`, 14, 130);
  doc.text(`Scan ID: ${scan.id}`, 14, 142);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 154);
  doc.text(`Classification: CONFIDENTIAL`, 14, 166);
  doc.setFillColor(6, 182, 212); doc.rect(14, 175, 50, 3, 'F');
  if (scan.securityGrade) { doc.setFontSize(28); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.text(`${scan.securityGrade.toFixed(1)}/10`, 14, 205); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184); doc.text('Security Grade', 14, 218); }

  // Executive Summary
  doc.addPage();
  doc.setFillColor(6, 182, 212); doc.rect(0, 0, 210, 3, 'F');
  doc.setFontSize(24); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, 25);
  doc.setFillColor(226, 232, 240); doc.rect(14, 30, 182, 0.5, 'F');
  yPosition = 40;
  doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal');
  doc.text(`Target Domain: ${scan.target}`, 14, yPosition); yPosition += 7;
  doc.text(`Scan ID: ${scan.id}`, 14, yPosition); yPosition += 7;
  doc.text(`Timestamp: ${new Date(scan.timestamp).toLocaleString()}`, 14, yPosition); yPosition += 7;

  // Duration and Status
  if (scan.elapsedMs) {
    const seconds = Math.floor(scan.elapsedMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const timeStr = minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
    doc.text(`Duration: ${timeStr}`, 14, yPosition); yPosition += 7;
  }
  yPosition += 5;
  
  let statusColor;
  switch (scan.status) {
    case 'completed': statusColor = [16, 185, 129]; break;
    case 'stopped': statusColor = [251, 146, 60]; break; // Orange for stopped
    case 'failed': statusColor = [239, 68, 68]; break; // Red for failed
    case 'running': statusColor = [234, 179, 8]; break; // Yellow for running
    case 'paused': statusColor = [59, 130, 246]; break; // Blue for paused
    default: statusColor = [128, 128, 128]; break; // Gray for unknown
  }
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
      ['Open Redirect', openRedirectVulns.toString(), openRedirectVulns > 0 ? 'HIGH' : 'SAFE', openRedirectVulns > 0 ? 'Review redirect logic' : 'No issues found'],
      ['Git Exposure', gitExposed.toString(), gitExposed > 0 ? 'CRITICAL' : 'SAFE', gitExposed > 0 ? 'Remove exposed .git files' : 'No exposure detected'],
      ['Open S3 Buckets', s3Open.toString(), s3Open > 0 ? 'HIGH' : 'SAFE', s3Open > 0 ? 'Restrict bucket access' : 'No open buckets'],
      ['CVE Matches', cveFound.toString(), cveFound > 0 ? 'HIGH' : 'SAFE', cveFound > 0 ? 'Apply patches' : 'No CVEs detected'],
      ['GraphQL Exposure', graphQLOpen.toString(), graphQLOpen > 0 ? 'MEDIUM' : 'SAFE', graphQLOpen > 0 ? 'Disable introspection' : 'No exposure'],
      ['CSRF (no token)', csrfUnprotected.toString(), csrfUnprotected > 0 ? 'MEDIUM' : 'SAFE', csrfUnprotected > 0 ? 'Add CSRF tokens' : 'All forms protected'],
      ['WAF Protection', ddosFirewallDetected.toString(), ddosFirewallDetected > 0 ? 'INFO' : 'N/A', ddosFirewallDetected > 0 ? 'Protection detected' : 'No protection detected'],
      ['VirusTotal Malicious', virustotalMalicious.toString(), virustotalMalicious > 0 ? 'HIGH' : 'SAFE', virustotalMalicious > 0 ? 'Investigate reputation' : 'No malicious activity'],
      ['SSL Certificate Expired', sslTlsExpired.toString(), sslTlsExpired > 0 ? 'CRITICAL' : 'VALID', sslTlsExpired > 0 ? 'Renew certificate immediately' : 'Certificate is valid'],
      ['Broken Links', brokenLinksCount.toString(), brokenLinksCount > 0 ? 'MEDIUM' : 'SAFE', brokenLinksCount > 0 ? 'Review and fix links' : 'No broken links found'],
      ['Emails Harvested', emailHarvested.toString(), emailHarvested > 0 ? 'MEDIUM' : 'SAFE', emailHarvested > 0 ? 'Review exposed emails' : 'No emails harvested'],
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
      ['Technologies', scan.results.techStack?.technologies?.map((tech: any) => tech.name).join(', ') || 'None detected'],
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
        h.secure ? '✓ Secure' : 'Needs improvement',
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

  // WAF protection results
  if (scan.results.ddosFirewall?.tested) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(128, 0, 128); // Purple for DDoS
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('WAF: WAF Protection Check Results', 14, yPosition);
    yPosition += 15;

    const ddosData = [
      ['WAF Detected', scan.results.ddosFirewall.firewallDetected ? 'Yes' : 'No'],
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

    if (scan.results.ddosFirewall.indicators?.length > 0) {
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

    if (scan.results.ddosFirewall.responseSummary?.length > 0) {
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

  // Whois Information
  if (scan.results.whois) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(107, 114, 128); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('WHOIS: Domain Registration Information', 14, yPosition); yPosition += 15;
    const w = scan.results.whois;
    autoTable(doc, { startY: yPosition, body: [
      ['Domain', w.domain], ['Registrar', w.registrar || 'N/A'], ['Created', w.created || 'N/A'],
      ['Expires', w.expires || 'N/A'], ['Updated', w.updated || 'N/A'], ['DNSSEC', w.dnssec || 'N/A'],
      ['Status', w.status || 'N/A'], ['Nameservers', w.nameservers?.join(', ') || 'N/A'],
      ['Registrant Org', w.registrant?.organization || 'N/A'], ['Registrant Country', w.registrant?.country || 'N/A'],
    ], theme: 'striped', styles: { fontSize: 9 } });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Reverse IP
  if (scan.results.reverseip?.domains?.length) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(249, 115, 22); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`REVERSE IP: Domains on ${scan.results.reverseip.ip} (${scan.results.reverseip.totalDomains})`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Domain', 'Title', 'Web Server', 'CMS', 'Cloudflare']],
      body: scan.results.reverseip.domains.map((d: any) => [d.domain, d.title || 'N/A', d.webServer || 'N/A', d.cms || 'N/A', d.cloudflare ? 'Yes' : 'No']),
      theme: 'grid', headStyles: { fillColor: [249, 115, 22], fontStyle: 'bold' }, styles: { fontSize: 8 } });
  }

  // Email Security
  if (scan.results.emailSecurity) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(30, 64, 175); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('EMAIL: Email Security (SPF/DKIM/DMARC)', 14, yPosition); yPosition += 15;
    const es = scan.results.emailSecurity;
    autoTable(doc, { startY: yPosition, body: [
      ['Domain', es.domain], ['Overall Score', `${es.overallScore}/10`],
      ['SPF Record', es.spf?.exists ? (es.spf.valid ? 'Valid' : 'Invalid') : 'Missing'],
      ['SPF Raw', es.spf?.raw?.substring(0, 120) || 'N/A'],
      ['DKIM Selectors', es.dkim?.filter((k: any) => k.exists).map((k: any) => k.selector).join(', ') || 'None found'],
      ['DMARC Record', es.dmarc?.exists ? (es.dmarc.valid ? 'Valid' : 'Invalid') : 'Missing'],
      ['DMARC Policy', es.dmarc?.policy || 'N/A'],
    ], theme: 'striped', styles: { fontSize: 9 } });
  }

  // JavaScript Analysis
  if (scan.results.jsInspection?.files?.length) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(251, 191, 36); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
    doc.text(`JS ANALYSIS: ${scan.results.jsInspection.totalFiles} Files (${scan.results.jsInspection.totalEndpoints} endpoints, ${scan.results.jsInspection.totalApiKeys} keys)`, 14, yPosition); yPosition += 15;
    for (const file of scan.results.jsInspection.files) {
      if (yPosition > 240) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(8); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
      doc.text(`${file.url.substring(0, 180)} (${(file.size / 1024).toFixed(1)} KB)`, 14, yPosition); yPosition += 4;
      doc.setFont('helvetica', 'normal');
      if (file.endpoints?.length) { doc.text(`  Endpoints: ${file.endpoints.slice(0, 5).join(', ')}${file.endpoints.length > 5 ? '...' : ''}`, 18, yPosition); yPosition += 4; }
      if (file.apiKeys?.length) { doc.text(`  API Keys: ${file.apiKeys.slice(0, 3).join(', ')}${file.apiKeys.length > 3 ? '...' : ''}`, 18, yPosition); yPosition += 4; }
      yPosition += 2;
    }
  }

  // S3 Buckets
  if (scan.results.s3Bucket?.buckets?.length) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(220, 38, 38); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`S3 BUCKETS: ${scan.results.s3Bucket.openBuckets} open of ${scan.results.s3Bucket.totalChecked} checked`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Bucket', 'Accessible', 'Listing', 'Status']],
      body: scan.results.s3Bucket.buckets.map((b: any) => [b.name, b.accessible ? 'Yes' : 'No', b.listing ? 'Yes' : 'No', String(b.statusCode)]),
      theme: 'grid', headStyles: { fillColor: [220, 38, 38], fontStyle: 'bold' }, styles: { fontSize: 8 } });
  }

  // Git Exposure
  if (scan.results.gitExposure?.files?.length) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(185, 28, 28); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`GIT EXPOSURE: ${scan.results.gitExposure.totalExposed} exposed (${scan.results.gitExposure.criticalExposed} critical)`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Path', 'Exposed', 'Status']],
      body: scan.results.gitExposure.files.map((f: any) => [f.path, f.exposed ? 'Yes' : 'No', String(f.statusCode)]),
      theme: 'grid', headStyles: { fillColor: [185, 28, 28], fontStyle: 'bold' }, styles: { fontSize: 8 } });
  }

  // Open Redirect
  if (scan.results.openRedirect?.vulnerableCount > 0) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(234, 88, 12); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`OPEN REDIRECT: ${scan.results.openRedirect.vulnerableCount} vulnerable of ${scan.results.openRedirect.totalTested} tested`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Parameter', 'Redirects To', 'Status']],
      body: scan.results.openRedirect.tests.filter((t: any) => t.vulnerable).map((t: any) => [t.param, t.redirectedTo || 'N/A', String(t.statusCode)]),
      theme: 'grid', headStyles: { fillColor: [234, 88, 12], fontStyle: 'bold' }, styles: { fontSize: 8 } });
  }

  // CVE Scanner
  if (scan.results.cveScanner?.totalFound > 0) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(127, 29, 29); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`CVE SCANNER: ${scan.results.cveScanner.totalFound} potential CVEs found`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['CVE ID', 'Technology', 'Severity', 'Description']],
      body: scan.results.cveScanner.matches.map((m: any) => [m.cveId, m.technology, m.severity, m.description.substring(0, 100)]),
      theme: 'grid', headStyles: { fillColor: [127, 29, 29], fontStyle: 'bold' }, styles: { fontSize: 7 } });
  }

  // GraphQL
  if (scan.results.graphQL?.totalEndpoints > 0) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(88, 28, 135); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`GRAPHQL: ${scan.results.graphQL.totalEndpoints} endpoints (${scan.results.graphQL.openEndpoints} open, introspection: ${scan.results.graphQL.introspectionEnabled ? 'ENABLED' : 'Disabled'})`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Path', 'Accessible', 'Introspection']],
      body: scan.results.graphQL.endpoints.map((e: any) => [e.path, e.accessible ? 'Yes' : 'No', e.introspectionOpen ? 'Open' : 'Closed']),
      theme: 'grid', headStyles: { fillColor: [88, 28, 135], fontStyle: 'bold' }, styles: { fontSize: 8 } });
  }

  // Rate Limit
  if (scan.results.rateLimit) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(234, 179, 8); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
    doc.text('RATE LIMIT: Rate Limiting Analysis', 14, yPosition); yPosition += 15;
    const rl = scan.results.rateLimit;
    autoTable(doc, { startY: yPosition, body: [
      ['Rate Limited', rl.rateLimited ? 'Yes' : 'No'], ['Requests Sent', String(rl.requestsSent)], ['Requests Blocked', String(rl.requestsBlocked)],
      ['Details', rl.details || 'N/A'],
    ], theme: 'striped', styles: { fontSize: 9 } });
  }

  // CSRF Detection
  if (scan.results.csrfDetection?.totalForms > 0) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(180, 83, 9); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`CSRF: ${scan.results.csrfDetection.formsWithoutToken} forms without CSRF token of ${scan.results.csrfDetection.totalForms}`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Form Action', 'Method', 'Has CSRF Token']],
      body: scan.results.csrfDetection.forms.map((f: any) => [f.action || 'N/A', f.method.toUpperCase(), f.hasCSRFToken ? 'Yes' : 'No']),
      theme: 'grid', headStyles: { fillColor: [180, 83, 9], fontStyle: 'bold' }, styles: { fontSize: 8 } });
  }

  // CDN Detection
  if (scan.results.cdnDetection?.detectedCount > 0) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(30, 58, 138); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`CDN: ${scan.results.cdnDetection.detectedCount} CDN(s) detected`, 14, yPosition); yPosition += 15;
    scan.results.cdnDetection.cdns.filter((c: any) => c.detected).forEach((c: any) => {
      if (yPosition > 260) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(9); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
      doc.text(`• ${c.name}`, 14, yPosition); yPosition += 4;
      c.evidence?.forEach((e: string) => {
        if (yPosition > 270) { doc.addPage(); yPosition = 20; }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text(`  ${e.substring(0, 180)}`, 18, yPosition); yPosition += 3;
      });
      yPosition += 2;
    });
  }

  // Cloud Provider Detection
  if (scan.results.cloudProvider?.detectedCount > 0) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(22, 78, 99); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`CLOUD: ${scan.results.cloudProvider.detectedCount} provider(s) detected`, 14, yPosition); yPosition += 15;
    scan.results.cloudProvider.providers.filter((p: any) => p.detected).forEach((p: any) => {
      if (yPosition > 260) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(9); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
      doc.text(`• ${p.name}`, 14, yPosition); yPosition += 4;
      p.evidence?.forEach((e: string) => {
        if (yPosition > 270) { doc.addPage(); yPosition = 20; }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text(`  ${e.substring(0, 180)}`, 18, yPosition); yPosition += 3;
      });
      yPosition += 2;
    });
  }

  // Robots & Sitemap
  if (scan.results.robotsSitemap) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(75, 85, 99); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    const rs = scan.results.robotsSitemap;
    doc.text(`ROBOTS: robots.txt ${rs.robots?.exists ? 'found' : 'not found'} | Sitemap ${rs.sitemap?.exists ? `(${rs.sitemap.count} URLs)` : 'not found'}`, 14, yPosition); yPosition += 15;
    if (rs.robots?.disallowedPaths?.length) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Disallowed Paths:', 14, yPosition); yPosition += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      rs.robots.disallowedPaths.forEach((p: string) => { if (yPosition > 270) { doc.addPage(); yPosition = 20; } doc.text(`  ${p}`, 18, yPosition); yPosition += 3; });
      yPosition += 3;
    }
    if (rs.sitemap?.urls?.length) {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(`Sitemap URLs (${rs.sitemap.count}):`, 14, yPosition); yPosition += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      rs.sitemap.urls.slice(0, 20).forEach((u: string) => { if (yPosition > 270) { doc.addPage(); yPosition = 20; } doc.text(`  ${u.substring(0, 180)}`, 18, yPosition); yPosition += 3; });
      if (rs.sitemap.urls.length > 20) { if (yPosition > 270) { doc.addPage(); yPosition = 20; } doc.text(`  ... and ${rs.sitemap.urls.length - 20} more`, 18, yPosition); }
    }
  }

  // Cookie Audit
  if (scan.results.cookieAudit?.cookies?.length) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(147, 51, 234); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    const ca = scan.results.cookieAudit;
    doc.text(`COOKIES: ${ca.totalCount} total (${ca.insecureCookies} insecure, ${ca.httpOnlyCount} HttpOnly, ${ca.sameSiteCount} SameSite)`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Name', 'Secure', 'HttpOnly', 'SameSite', 'Issues']],
      body: ca.cookies.map((c: any) => [c.name, c.secure ? 'Yes' : 'No', c.httpOnly ? 'Yes' : 'No', c.sameSite || 'N/A', c.issues?.join('; ')?.substring(0, 80) || 'None']),
      theme: 'grid', headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' }, styles: { fontSize: 7 } });
  }

  // Email Harvesting
  if (scan.results.emailHarvesting?.emails?.length) {
    doc.addPage(); yPosition = 20;
    doc.setFillColor(239, 68, 68); doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`EMAIL HARVEST: ${scan.results.emailHarvesting.totalEmails} emails found (${scan.results.emailHarvesting.uniqueDomains?.length || 0} domains)`, 14, yPosition); yPosition += 15;
    autoTable(doc, { startY: yPosition, head: [['Email', 'Source']],
      body: scan.results.emailHarvesting.emails.slice(0, 50).map((e: any) => [e.email, e.source || 'N/A']),
      theme: 'grid', headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' }, styles: { fontSize: 7 } });
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
    try {
      doc.save(`abspider-security-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`);
    } catch (e) {
      console.warn('[Report] Failed to save PDF:', e);
    }
  }
};

// DOCX helpers
const boldPara = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true })] });
const kvRow = (key: string, val: string) => new TableRow({
  children: [
    new TableCell({ children: [boldPara(key)], width: { size: 4000, type: WidthType.DXA } }),
    new TableCell({ children: [new Paragraph({ text: val })], width: { size: 12000, type: WidthType.DXA } }),
  ],
});
const h2 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } });
const h3 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } });
const para = (text: string) => new Paragraph({ text, spacing: { after: 60 } });
const kvTable = (rows: [string, string][]) => new Table({
  rows: rows.map(([k, v]) => kvRow(k, v)),
  width: { size: 16000, type: WidthType.DXA },
});
const bullet = (text: string) => new Paragraph({
  text, bullet: { level: 0 }, spacing: { after: 40 },
});
const noBorder: any = { style: BorderStyle.NONE, size: 0 };

export const generateDocxReport = async (scan: Scan, returnContent: boolean = false): Promise<string | void> => {
  const recommendations = getSecurityRecommendations(scan);
  const children: any[] = [
    new Paragraph({ text: 'ABSpider Recon Dashboard', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: 'Comprehensive Security Assessment Report', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Generated: ${new Date().toLocaleString()} | Classification: CONFIDENTIAL`, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    h2('Executive Summary'),
    kvTable([
      ['Target Domain', scan.target],
      ['Scan ID', scan.id],
      ['Timestamp', new Date(scan.timestamp).toLocaleString()],
      ['Status', scan.status.toUpperCase()],
      ['Duration', scan.elapsedMs ? `${Math.floor(scan.elapsedMs / 60000)}m ${Math.floor((scan.elapsedMs % 60000) / 1000)}s` : 'N/A'],
      ['Security Grade', `${scan.securityGrade?.toFixed(1) || 'N/A'}/10`],
    ]),
  ];

  if (recommendations.length > 0) {
    children.push(h2('Security Recommendations'));
    recommendations.forEach(r => children.push(bullet(r)));
  }

  // Vulnerability Summary
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const corsVulns = scan.results.corsMisconfig?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  if (sqlVulns + xssVulns + lfiVulns + corsVulns + wpVulns > 0) {
    children.push(h2('Vulnerability Summary'));
    children.push(new Table({
      rows: [
        new TableRow({ children: ['Vulnerability Type', 'Count', 'Severity'].map(h => new TableCell({ children: [boldPara(h)] })) }),
        ...[[sqlVulns, 'SQL Injection', sqlVulns > 0 ? 'CRITICAL' : 'SAFE'],
          [xssVulns, 'XSS', xssVulns > 0 ? 'CRITICAL' : 'SAFE'],
          [lfiVulns, 'LFI', lfiVulns > 0 ? 'CRITICAL' : 'SAFE'],
          [corsVulns, 'CORS Misconfiguration', corsVulns > 0 ? 'CRITICAL' : 'SAFE'],
          [wpVulns, 'WordPress', wpVulns > 0 ? 'HIGH' : 'SAFE']].map(([count, label, sev]) =>
            new TableRow({ children: [label, String(count), sev].map((c: string) => new TableCell({ children: [new Paragraph({ text: c })] })) })
          ),
      ],
      width: { size: 16000, type: WidthType.DXA },
    }));
  }

  // Vulnerability details
  const vulnSection = (title: string, vulns: any[], cols: string[], mapFn: (v: any) => string[]) => {
    if (!vulns.length) return;
    children.push(h2(title));
    children.push(new Table({
      rows: [
        new TableRow({ children: cols.map(c => new TableCell({ children: [boldPara(c)] })) }),
        ...vulns.map(v => new TableRow({ children: mapFn(v).map(c => new TableCell({ children: [new Paragraph({ text: c })] })) })),
      ],
      width: { size: 16000, type: WidthType.DXA },
    }));
  };
  vulnSection('SQL Injection Vulnerabilities', scan.results.sqlinjection?.vulnerabilities || [], ['Severity', 'Type', 'Parameter', 'Payload'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || 'N/A', v.payload?.substring(0, 100) || 'N/A']);
  vulnSection('XSS Vulnerabilities', scan.results.xss?.vulnerabilities || [], ['Severity', 'Type', 'Location', 'Payload'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || v.location || 'N/A', v.payload?.substring(0, 100) || 'N/A']);
  vulnSection('LFI Vulnerabilities', scan.results.lfi?.vulnerabilities || [], ['Severity', 'Type', 'Parameter', 'Payload'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || 'N/A', v.payload?.substring(0, 100) || 'N/A']);
  vulnSection('CORS Misconfigurations', scan.results.corsMisconfig?.vulnerabilities || [], ['Severity', 'Type', 'Origin'], v => [v.severity.toUpperCase(), v.type?.replace(/_/g, ' ') || 'N/A', v.originTested || 'N/A']);
  vulnSection('WordPress Issues', scan.results.wordpress?.vulnerabilities || [], ['Severity', 'Type', 'Description'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.description || 'N/A']);

  // Site Information
  if (scan.results.siteInfo) {
    const s = scan.results.siteInfo;
    children.push(h2('Site Information'));
    children.push(kvTable([
      ['Title', s.title || 'N/A'],
      ['IP Address', s.ip || 'N/A'],
      ['Web Server', s.webServer || 'N/A'],
      ['CMS', s.cms || 'None detected'],
      ['Cloudflare', s.cloudflare ? 'Yes' : 'No'],
      ['Status Code', String(s.statusCode ?? 'N/A')],
      ['Response Time', s.responseTime ? `${s.responseTime}ms` : 'N/A'],
    ]));
  }

  // Technology Stack
  if (scan.results.techStack?.technologies?.length) {
    children.push(h2('Technology Stack'));
    children.push(new Table({
      rows: [
        new TableRow({ children: ['Name', 'Category', 'Version', 'Confidence'].map(c => new TableCell({ children: [boldPara(c)] })) }),
        ...scan.results.techStack.technologies.map((t: any) =>
          new TableRow({ children: [t.name, t.category || 'N/A', t.version || 'N/A', t.confidence ? `${(t.confidence * 100).toFixed(0)}%` : 'N/A'].map(c => new TableCell({ children: [new Paragraph({ text: c })] })) })
        ),
      ],
      width: { size: 16000, type: WidthType.DXA },
    }));
  }

  // Security Headers
  if (scan.results.headers?.securityHeaders) {
    children.push(h2('Security Headers'));
    const hdrs = scan.results.headers.securityHeaders;
    children.push(para(`Grade: ${hdrs.grade || 'N/A'}`));
    if (hdrs.present?.length) {
      children.push(h3('Present Headers'));
      hdrs.present.forEach((h: any) => children.push(bullet(`${h.name}: ${h.secure ? 'Secure' : 'Needs improvement'}`)));
    }
    if (hdrs.missing?.length) {
      children.push(h3('Missing Headers'));
      hdrs.missing.forEach((h: any) => children.push(bullet(`${h.name} (${h.severity.toUpperCase()}): ${h.recommendation}`)));
    }
  }

  // GeoIP
  if (scan.results.geoip) {
    const g = scan.results.geoip;
    children.push(h2('GeoIP Information'));
    children.push(kvTable([
      ['IP', g.ip || 'N/A'],
      ['Country', g.country || 'N/A'],
      ['City', g.city || 'N/A'],
      ['Region', g.region || 'N/A'],
      ['Timezone', g.timezone || 'N/A'],
      ['ISP', g.isp || 'N/A'],
      ['ASN', g.asn || 'N/A'],
      ['Coordinates', g.latitude && g.longitude ? `${g.latitude}, ${g.longitude}` : 'N/A'],
    ]));
  }

  // DNS Records
  if (scan.results.dns) {
    children.push(h2('DNS Records'));
    const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
    for (const type of types) {
      const records = scan.results.dns.records[type as keyof typeof scan.results.dns.records];
      if (records?.length) {
        children.push(h3(`${type} Records`));
        records.forEach((r: any) => children.push(bullet(`${r.value}${r.ttl ? ` (TTL: ${r.ttl})` : ''}`)));
      }
    }
  }

  // Subdomains
  if (scan.results.subdomains?.subdomains?.length) {
    children.push(h2(`Subdomains (${scan.results.subdomains.subdomains.length})`));
    scan.results.subdomains.subdomains.forEach(s => children.push(bullet(s)));
  }

  // SEO Analysis
  if (scan.results.seo) {
    const seo = scan.results.seo;
    children.push(h2('SEO Analysis'));
    children.push(kvTable([
      ['HTTP Code', String(seo.httpCode)],
      ['Title', seo.title],
      ['Load Time', `${seo.loadTime}ms`],
      ['Page Size', `${(seo.pageSize / 1024).toFixed(2)} KB`],
      ['Images', String(seo.imageCount)],
      ['Total Links', String(seo.linkCount.total)],
      ['Internal Links', String(seo.linkCount.internal)],
      ['External Links', String(seo.linkCount.external)],
    ]));
  }

  // Broken Links
  if (scan.results.brokenLinks?.brokenLinks?.length) {
    children.push(h2(`Broken Links (${scan.results.brokenLinks.brokenLinks.length})`));
    children.push(new Table({
      rows: [
        new TableRow({ children: ['URL', 'Status', 'Type', 'Source'].map(c => new TableCell({ children: [boldPara(c)] })) }),
        ...scan.results.brokenLinks.brokenLinks.map((l: any) =>
          new TableRow({ children: [l.url?.substring(0, 100) || 'N/A', String(l.status), l.isInternal ? 'Internal' : 'External', l.sourcePage?.substring(0, 80) || 'N/A'].map(c => new TableCell({ children: [new Paragraph({ text: c })] })) })
        ),
      ],
      width: { size: 16000, type: WidthType.DXA },
    }));
  }

  // WAF Protection
  if (scan.results.ddosFirewall?.tested) {
    const waf = scan.results.ddosFirewall;
    children.push(h2('WAF Protection'));
    children.push(kvTable([
      ['WAF Detected', waf.firewallDetected ? 'Yes' : 'No'],
      ['Total Requests', String(waf.totalRequests)],
      ['Successful', String(waf.successfulRequests)],
      ['Failed', String(waf.failedRequests)],
    ]));
    if (waf.indicators?.length) {
      children.push(h3('Detection Indicators'));
      waf.indicators.forEach((i: string) => children.push(bullet(i)));
    }
  }

  // VirusTotal
  if (scan.results.virustotal?.tested) {
    const vt = scan.results.virustotal;
    children.push(h2('VirusTotal'));
    children.push(kvTable([
      ['Domain', vt.domain],
      ['Reputation', String(vt.reputation ?? 'N/A')],
      ['Malicious Votes', String(vt.maliciousVotes ?? '0')],
      ['Harmless Votes', String(vt.harmlessVotes ?? '0')],
      ['Last Analysis', vt.lastAnalysisDate ? new Date(vt.lastAnalysisDate).toLocaleString() : 'N/A'],
    ]));
    if (vt.detectedUrls?.length) {
      children.push(h3('Detected URLs'));
      vt.detectedUrls.forEach((u: any) => children.push(bullet(`${u.url} (${u.positives}/${u.total})`)));
    }
  }

  // SSL/TLS
  if (scan.results.sslTls?.tested) {
    const ssl = scan.results.sslTls;
    children.push(h2('SSL/TLS'));
    children.push(kvTable([
      ['Domain', ssl.domain],
      ['Issuer', ssl.certificateIssuer || 'N/A'],
      ['Valid From', ssl.validFrom || 'N/A'],
      ['Valid To', ssl.validTo || 'N/A'],
      ['Status', ssl.isExpired ? 'Expired' : 'Valid'],
      ['Days Until Expiry', String(ssl.daysUntilExpiry ?? 'N/A')],
    ]));
    if (ssl.commonNames?.length) children.push(para(`Common Names: ${ssl.commonNames.join(', ')}`));
    if (ssl.altNames?.length) children.push(para(`Alternative Names: ${ssl.altNames.join(', ')}`));
    if (ssl.fingerprintSha256) children.push(para(`SHA256 Fingerprint: ${ssl.fingerprintSha256}`));
  }

  // Whois
  if (scan.results.whois) {
    const w = scan.results.whois;
    children.push(h2('Whois Information'));
    children.push(kvTable([['Domain', w.domain], ['Registrar', w.registrar || 'N/A'], ['Created', w.created || 'N/A'], ['Expires', w.expires || 'N/A'], ['Nameservers', w.nameservers?.join(', ') || 'N/A'], ['DNSSEC', w.dnssec || 'N/A']]));
  }

  // Reverse IP
  if (scan.results.reverseip?.domains?.length) {
    children.push(h2(`Reverse IP (${scan.results.reverseip.totalDomains} domains on ${scan.results.reverseip.ip})`));
    scan.results.reverseip.domains.forEach((d: any) => children.push(bullet(`${d.domain}${d.title ? ` — ${d.title}` : ''}${d.webServer ? ` (${d.webServer})` : ''}`)));
  }

  // Email Security
  if (scan.results.emailSecurity) {
    const es = scan.results.emailSecurity;
    children.push(h2('Email Security'));
    children.push(kvTable([['Domain', es.domain], ['Score', `${es.overallScore}/10`], ['SPF', es.spf?.exists ? (es.spf.valid ? 'Valid' : 'Invalid') : 'Missing'], ['DMARC', es.dmarc?.exists ? `${es.dmarc.policy || 'Present'}${es.dmarc.valid ? '' : ' (Invalid)'}` : 'Missing']]));
  }

  // JS Analysis
  if (scan.results.jsInspection?.files?.length) {
    children.push(h2(`JavaScript Analysis (${scan.results.jsInspection.totalFiles} files, ${scan.results.jsInspection.totalEndpoints} endpoints, ${scan.results.jsInspection.totalApiKeys} keys)`));
    scan.results.jsInspection.files.forEach((f: any) => children.push(bullet(`${f.url}${f.endpoints?.length ? ` — ${f.endpoints.slice(0, 3).join(', ')}` : ''}`)));
  }

  // S3 Buckets
  if (scan.results.s3Bucket?.buckets?.length) {
    children.push(h2(`S3 Buckets (${scan.results.s3Bucket.openBuckets} open of ${scan.results.s3Bucket.totalChecked})`));
    scan.results.s3Bucket.buckets.forEach((b: any) => children.push(bullet(`${b.name} — ${b.accessible ? 'Accessible' : 'Not accessible'}${b.listing ? ' (listing enabled)' : ''}`)));
  }

  // Git Exposure
  if (scan.results.gitExposure?.files?.length) {
    children.push(h2(`Git Exposure (${scan.results.gitExposure.totalExposed} exposed, ${scan.results.gitExposure.criticalExposed} critical)`));
    scan.results.gitExposure.files.filter((f: any) => f.exposed).forEach((f: any) => children.push(bullet(`${f.path} (HTTP ${f.statusCode})`)));
  }

  // Open Redirect
  if (scan.results.openRedirect?.vulnerableCount > 0) {
    children.push(h2(`Open Redirect (${scan.results.openRedirect.vulnerableCount} vulnerable)`));
    scan.results.openRedirect.tests.filter((t: any) => t.vulnerable).forEach((t: any) => children.push(bullet(`?${t.param}= → ${t.redirectedTo || 'N/A'}`)));
  }

  // CVE Scanner
  if (scan.results.cveScanner?.totalFound > 0) {
    children.push(h2(`CVE Scanner (${scan.results.cveScanner.totalFound} matches)`));
    scan.results.cveScanner.matches.forEach((m: any) => children.push(bullet(`${m.cveId} — ${m.technology} (${m.severity}): ${m.description?.substring(0, 120)}`)));
  }

  // GraphQL
  if (scan.results.graphQL?.totalEndpoints > 0) {
    children.push(h2(`GraphQL (${scan.results.graphQL.totalEndpoints} endpoints, introspection: ${scan.results.graphQL.introspectionEnabled ? 'ENABLED' : 'Disabled'})`));
    scan.results.graphQL.endpoints.forEach((e: any) => children.push(bullet(`${e.path} — ${e.accessible ? 'Accessible' : 'Not accessible'}${e.introspectionOpen ? ' (introspection open)' : ''}`)));
  }

  // Rate Limit
  if (scan.results.rateLimit) {
    const rl = scan.results.rateLimit;
    children.push(h2('Rate Limit'));
    children.push(kvTable([['Rate Limited', rl.rateLimited ? 'Yes' : 'No'], ['Requests Sent', String(rl.requestsSent)], ['Blocked', String(rl.requestsBlocked)], ['Details', rl.details || 'N/A']]));
  }

  // CSRF
  if (scan.results.csrfDetection?.totalForms > 0) {
    children.push(h2(`CSRF Detection (${scan.results.csrfDetection.formsWithoutToken} unprotected forms of ${scan.results.csrfDetection.totalForms})`));
    scan.results.csrfDetection.forms.filter((f: any) => !f.hasCSRFToken).forEach((f: any) => children.push(bullet(`${f.action || 'N/A'} (${f.method})`)));
  }

  // CDN
  if (scan.results.cdnDetection?.detectedCount > 0) {
    children.push(h2(`CDN Detection (${scan.results.cdnDetection.detectedCount} detected)`));
    scan.results.cdnDetection.cdns.filter((c: any) => c.detected).forEach((c: any) => children.push(bullet(`${c.name}${c.evidence?.length ? ` — ${c.evidence[0]?.substring(0, 100)}` : ''}`)));
  }

  // Cloud Provider
  if (scan.results.cloudProvider?.detectedCount > 0) {
    children.push(h2(`Cloud Provider (${scan.results.cloudProvider.detectedCount} detected)`));
    scan.results.cloudProvider.providers.filter((p: any) => p.detected).forEach((p: any) => children.push(bullet(`${p.name}${p.evidence?.length ? ` — ${p.evidence[0]?.substring(0, 100)}` : ''}`)));
  }

  // Robots & Sitemap
  if (scan.results.robotsSitemap) {
    const rs = scan.results.robotsSitemap;
    children.push(h2('Robots & Sitemap'));
    children.push(kvTable([['robots.txt', rs.robots?.exists ? 'Found' : 'Not found'], ['Sitemap', rs.sitemap?.exists ? `Found (${rs.sitemap.count} URLs)` : 'Not found']]));
    if (rs.robots?.disallowedPaths?.length) { children.push(h3('Disallowed Paths')); rs.robots.disallowedPaths.forEach((p: string) => children.push(bullet(p))); }
  }

  // Cookie Audit
  if (scan.results.cookieAudit?.cookies?.length) {
    const ca = scan.results.cookieAudit;
    children.push(h2(`Cookie Audit (${ca.totalCount} cookies, ${ca.insecureCookies} insecure)`));
    ca.cookies.forEach((c: any) => children.push(bullet(`${c.name}${c.secure ? ' [Secure]' : ' [Insecure]'}${c.httpOnly ? ' [HttpOnly]' : ''}${c.sameSite ? ` [${c.sameSite}]` : ''}${c.issues?.length ? ` — ${c.issues[0]}` : ''}`)));
  }

  // Email Harvesting
  if (scan.results.emailHarvesting?.emails?.length) {
    children.push(h2(`Email Harvesting (${scan.results.emailHarvesting.totalEmails} emails found)`));
    scan.results.emailHarvesting.emails.slice(0, 30).forEach((e: any) => children.push(bullet(`${e.email}${e.source ? ` (${e.source})` : ''}`)));
    if (scan.results.emailHarvesting.emails.length > 30) children.push(para(`... and ${scan.results.emailHarvesting.emails.length - 30} more`));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  if (returnContent) {
    return "DOCX reports are not directly previewable as text. Please download to view.";
  } else {
    try {
      saveAs(blob, `abspider-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}.docx`);
    } catch (e) {
      console.warn('[Report] Failed to save DOCX:', e);
    }
  }
};

function mdTable(headers: string[], rows: string[][]): string {
  const h = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
  return h + rows.map(r => `| ${r.join(' | ')} |`).join('\n') + '\n\n';
}

function mdKv(rows: [string, string][]): string {
  return rows.map(([k, v]) => `- **${k}:** ${v}`).join('\n') + '\n\n';
}

export const generateMarkdownReport = (scan: Scan, returnContent: boolean = false): string | void => {
  const recommendations = getSecurityRecommendations(scan);
  let md = `# ABSpider Recon Dashboard — Security Assessment Report\n\n`;
  md += `**Target:** ${scan.target} | **Scan ID:** ${scan.id} | **Generated:** ${new Date().toLocaleString()}\n\n`;
  md += `**Status:** ${scan.status.toUpperCase()} | **Grade:** ${scan.securityGrade?.toFixed(1) || 'N/A'}/10`;
  if (scan.elapsedMs) md += ` | **Duration:** ${Math.floor(scan.elapsedMs / 60000)}m ${Math.floor((scan.elapsedMs % 60000) / 1000)}s`;
  md += '\n\n---\n\n';

  md += `## Executive Summary\n\n`;
  md += mdKv([
    ['Target Domain', scan.target],
    ['Scan ID', scan.id],
    ['Timestamp', new Date(scan.timestamp).toLocaleString()],
    ['Status', scan.status.toUpperCase()],
    ['Security Grade', `${scan.securityGrade?.toFixed(1) || 'N/A'}/10`],
    ['Classification', 'CONFIDENTIAL'],
  ]);

  if (recommendations.length > 0) {
    md += `## Security Recommendations\n\n`;
    recommendations.forEach(r => { md += `- ${r}\n`; });
    md += '\n';
  }

  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const corsVulns = scan.results.corsMisconfig?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const total = sqlVulns + xssVulns + lfiVulns + corsVulns + wpVulns;

  if (total > 0) {
    md += `## Vulnerability Summary\n\n`;
    md += mdTable(['Vulnerability Type', 'Count', 'Severity'], [
      ['SQL Injection', String(sqlVulns), sqlVulns > 0 ? 'CRITICAL' : 'SAFE'],
      ['Cross-Site Scripting (XSS)', String(xssVulns), xssVulns > 0 ? 'CRITICAL' : 'SAFE'],
      ['Local File Inclusion (LFI)', String(lfiVulns), lfiVulns > 0 ? 'CRITICAL' : 'SAFE'],
      ['CORS Misconfiguration', String(corsVulns), corsVulns > 0 ? 'CRITICAL' : 'SAFE'],
      ['WordPress Security', String(wpVulns), wpVulns > 0 ? 'HIGH' : 'SAFE'],
    ]);
  }

  // Vulnerability details
  const vulnMdSection = (title: string, vulns: any[], headers: string[], mapFn: (v: any) => string[]) => {
    if (!vulns.length) return;
    md += `## ${title}\n\n`;
    md += mdTable(headers, vulns.map(mapFn));
  };
  vulnMdSection('SQL Injection Vulnerabilities', scan.results.sqlinjection?.vulnerabilities || [], ['Severity', 'Type', 'Parameter', 'Payload', 'Evidence'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || 'N/A', v.payload?.substring(0, 120) || '', v.evidence?.substring(0, 120) || 'N/A']);
  vulnMdSection('XSS Vulnerabilities', scan.results.xss?.vulnerabilities || [], ['Severity', 'Type', 'Location', 'Payload'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || v.location || 'N/A', v.payload?.substring(0, 120) || '']);
  vulnMdSection('LFI Vulnerabilities', scan.results.lfi?.vulnerabilities || [], ['Severity', 'Type', 'Parameter', 'Payload', 'Confidence'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || 'N/A', v.payload?.substring(0, 120) || '', v.confidence ? `${(v.confidence * 100).toFixed(0)}%` : 'N/A']);
  vulnMdSection('CORS Misconfigurations', scan.results.corsMisconfig?.vulnerabilities || [], ['Severity', 'Type', 'Origin', 'Evidence'], v => [v.severity.toUpperCase(), v.type?.replace(/_/g, ' ') || 'N/A', v.originTested || 'N/A', v.evidence?.substring(0, 120) || 'N/A']);
  vulnMdSection('WordPress Issues', scan.results.wordpress?.vulnerabilities || [], ['Severity', 'Type', 'Description'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.description?.substring(0, 120) || 'N/A']);

  // Site Information
  if (scan.results.siteInfo) {
    const s = scan.results.siteInfo;
    md += `## Site Information\n\n${mdKv([
      ['Title', s.title || 'N/A'],
      ['IP Address', s.ip || 'N/A'],
      ['Web Server', s.webServer || 'N/A'],
      ['CMS', s.cms || 'None detected'],
      ['Cloudflare', s.cloudflare ? 'Yes' : 'No'],
      ['Status Code', String(s.statusCode ?? 'N/A')],
      ['Response Time', s.responseTime ? `${s.responseTime}ms` : 'N/A'],
      ['Technologies', scan.results.techStack?.technologies?.map((t: any) => t.name).join(', ') || 'None detected'],
    ])}`;
  }

  // Tech Stack
  if (scan.results.techStack?.technologies?.length) {
    md += `## Technology Stack\n\n`;
    md += mdTable(['Name', 'Category', 'Version', 'Confidence'], scan.results.techStack.technologies.map((t: any) => [t.name, t.category || 'N/A', t.version || 'N/A', t.confidence ? `${(t.confidence * 100).toFixed(0)}%` : 'N/A']));
  }

  // Security Headers
  if (scan.results.headers?.securityHeaders) {
    const hdrs = scan.results.headers.securityHeaders;
    md += `## Security Headers\n\n**Grade:** ${hdrs.grade || 'N/A'}\n\n`;
    if (hdrs.present?.length) {
      md += `### Present Headers\n\n`;
      hdrs.present.forEach((h: any) => { md += `- **${h.name}:** ${h.secure ? '✓ Secure' : 'Needs improvement'}\n`; });
      md += '\n';
    }
    if (hdrs.missing?.length) {
      md += `### Missing Headers\n\n`;
      hdrs.missing.forEach((h: any) => { md += `- **${h.name}** (${h.severity.toUpperCase()}): ${h.recommendation}\n`; });
      md += '\n';
    }
  }

  // GeoIP
  if (scan.results.geoip) {
    const g = scan.results.geoip;
    md += `## GeoIP Information\n\n${mdKv([
      ['IP', g.ip || 'N/A'], ['Country', g.country || 'N/A'], ['City', g.city || 'N/A'],
      ['Region', g.region || 'N/A'], ['Timezone', g.timezone || 'N/A'], ['ISP', g.isp || 'N/A'],
      ['ASN', g.asn || 'N/A'],
      ['Coordinates', g.latitude && g.longitude ? `${g.latitude}, ${g.longitude}` : 'N/A'],
    ])}`;
  }

  // DNS Records
  if (scan.results.dns) {
    md += `## DNS Records\n\n`;
    const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
    for (const type of types) {
      const records = scan.results.dns.records[type as keyof typeof scan.results.dns.records];
      if (records?.length) {
        md += `### ${type} Records\n\n`;
        md += mdTable(['Value', 'TTL'], records.map((r: any) => [r.value, String(r.ttl ?? 'N/A')]));
      }
    }
  }

  // Subdomains
  if (scan.results.subdomains?.subdomains?.length) {
    md += `## Subdomains (${scan.results.subdomains.subdomains.length})\n\n`;
    scan.results.subdomains.subdomains.forEach((s: string, i: number) => { md += `${i + 1}. ${s}\n`; });
    md += '\n';
  }

  // SEO
  if (scan.results.seo) {
    const seo = scan.results.seo;
    md += `## SEO Analysis\n\n${mdKv([
      ['HTTP Code', String(seo.httpCode)], ['Title', seo.title], ['Load Time', `${seo.loadTime}ms`],
      ['Page Size', `${(seo.pageSize / 1024).toFixed(2)} KB`], ['Images', String(seo.imageCount)],
      ['Total Links', String(seo.linkCount.total)], ['Internal Links', String(seo.linkCount.internal)],
      ['External Links', String(seo.linkCount.external)],
    ])}`;
  }

  // Broken Links
  if (scan.results.brokenLinks?.brokenLinks?.length) {
    md += `## Broken Links (${scan.results.brokenLinks.brokenLinks.length})\n\n`;
    md += mdTable(['URL', 'Status', 'Type', 'Source Page'], scan.results.brokenLinks.brokenLinks.map((l: any) => [
      l.url?.substring(0, 100) || 'N/A', String(l.status), l.isInternal ? 'Internal' : 'External',
      l.sourcePage?.substring(0, 80) || 'N/A',
    ]));
  }

  // WAF
  if (scan.results.ddosFirewall?.tested) {
    const waf = scan.results.ddosFirewall;
    md += `## WAF Protection\n\n${mdKv([
      ['WAF Detected', waf.firewallDetected ? 'Yes' : 'No'],
      ['Total Requests', String(waf.totalRequests)], ['Successful', String(waf.successfulRequests)],
      ['Failed', String(waf.failedRequests)],
    ])}`;
    if (waf.indicators?.length) {
      md += `### Detection Indicators\n\n`;
      waf.indicators.forEach((i: string) => { md += `- ${i}\n`; });
      md += '\n';
    }
  }

  // VirusTotal
  if (scan.results.virustotal?.tested) {
    const vt = scan.results.virustotal;
    md += `## VirusTotal\n\n${mdKv([
      ['Domain', vt.domain], ['Reputation', String(vt.reputation ?? 'N/A')],
      ['Malicious Votes', String(vt.maliciousVotes ?? '0')],
      ['Harmless Votes', String(vt.harmlessVotes ?? '0')],
      ['Last Analysis', vt.lastAnalysisDate ? new Date(vt.lastAnalysisDate).toLocaleString() : 'N/A'],
      ['Registrar', vt.registrar || 'N/A'], ['Categories', vt.categories?.join(', ') || 'N/A'],
    ])}`;
    if (vt.detectedUrls?.length) {
      md += `### Detected URLs\n\n`;
      md += mdTable(['URL', 'Detections'], vt.detectedUrls.map((u: any) => [u.url?.substring(0, 100) || 'N/A', `${u.positives}/${u.total}`]));
    }
  }

  // SSL/TLS
  if (scan.results.sslTls?.tested) {
    const ssl = scan.results.sslTls;
    md += `## SSL/TLS\n\n${mdKv([
      ['Domain', ssl.domain], ['Issuer', ssl.certificateIssuer || 'N/A'],
      ['Valid From', ssl.validFrom || 'N/A'], ['Valid To', ssl.validTo || 'N/A'],
      ['Status', ssl.isExpired ? 'Expired' : 'Valid'],
      ['Days Until Expiry', String(ssl.daysUntilExpiry ?? 'N/A')],
      ['Common Names', ssl.commonNames?.join(', ') || 'N/A'],
      ['Alternative Names', ssl.altNames?.join(', ') || 'N/A'],
      ['SHA256 Fingerprint', ssl.fingerprintSha256 || 'N/A'],
    ])}`;
  }

  // Whois
  if (scan.results.whois) {
    const w = scan.results.whois;
    md += `## Whois Information\n\n${mdKv([['Domain', w.domain], ['Registrar', w.registrar || 'N/A'], ['Created', w.created || 'N/A'], ['Expires', w.expires || 'N/A'], ['Nameservers', w.nameservers?.join(', ') || 'N/A'], ['DNSSEC', w.dnssec || 'N/A']])}`;
  }

  // Reverse IP
  if (scan.results.reverseip?.domains?.length) {
    md += `## Reverse IP (${scan.results.reverseip.totalDomains} domains on ${scan.results.reverseip.ip})\n\n`;
    scan.results.reverseip.domains.forEach((d: any) => { md += `- ${d.domain}${d.title ? ` — ${d.title}` : ''}${d.webServer ? ` (${d.webServer})` : ''}\n`; });
    md += '\n';
  }

  // Email Security
  if (scan.results.emailSecurity) {
    const es = scan.results.emailSecurity;
    md += `## Email Security\n\n${mdKv([['Domain', es.domain], ['Score', `${es.overallScore}/10`], ['SPF', es.spf?.exists ? (es.spf.valid ? 'Valid' : 'Invalid') : 'Missing'], ['DMARC', es.dmarc?.exists ? `${es.dmarc.policy || 'Present'}${es.dmarc.valid ? '' : ' (Invalid)'}` : 'Missing']])}`;
  }

  // JS Analysis
  if (scan.results.jsInspection?.files?.length) {
    md += `## JavaScript Analysis (${scan.results.jsInspection.totalFiles} files, ${scan.results.jsInspection.totalEndpoints} endpoints, ${scan.results.jsInspection.totalApiKeys} keys)\n\n`;
    scan.results.jsInspection.files.forEach((f: any) => { md += `- ${f.url}${f.endpoints?.length ? ` — ${f.endpoints.slice(0, 3).join(', ')}` : ''}\n`; });
    md += '\n';
  }

  // S3 Buckets
  if (scan.results.s3Bucket?.buckets?.length) {
    md += `## S3 Buckets (${scan.results.s3Bucket.openBuckets} open of ${scan.results.s3Bucket.totalChecked})\n\n`;
    scan.results.s3Bucket.buckets.forEach((b: any) => { md += `- ${b.name} — ${b.accessible ? 'Accessible' : 'Not accessible'}${b.listing ? ' (listing enabled)' : ''}\n`; });
    md += '\n';
  }

  // Git Exposure
  if (scan.results.gitExposure?.files?.length) {
    md += `## Git Exposure (${scan.results.gitExposure.totalExposed} exposed, ${scan.results.gitExposure.criticalExposed} critical)\n\n`;
    scan.results.gitExposure.files.filter((f: any) => f.exposed).forEach((f: any) => { md += `- ${f.path} (HTTP ${f.statusCode})\n`; });
    md += '\n';
  }

  // Open Redirect
  if (scan.results.openRedirect?.vulnerableCount > 0) {
    md += `## Open Redirect (${scan.results.openRedirect.vulnerableCount} vulnerable)\n\n`;
    scan.results.openRedirect.tests.filter((t: any) => t.vulnerable).forEach((t: any) => { md += `- ?${t.param}= → ${t.redirectedTo || 'N/A'}\n`; });
    md += '\n';
  }

  // CVE Scanner
  if (scan.results.cveScanner?.totalFound > 0) {
    md += `## CVE Scanner (${scan.results.cveScanner.totalFound} matches)\n\n`;
    md += mdTable(['CVE ID', 'Technology', 'Severity', 'Description'], scan.results.cveScanner.matches.map((m: any) => [m.cveId, m.technology, m.severity, m.description?.substring(0, 120) || '']));
  }

  // GraphQL
  if (scan.results.graphQL?.totalEndpoints > 0) {
    md += `## GraphQL (${scan.results.graphQL.totalEndpoints} endpoints, introspection: ${scan.results.graphQL.introspectionEnabled ? 'ENABLED' : 'Disabled'})\n\n`;
    md += mdTable(['Path', 'Accessible', 'Introspection'], scan.results.graphQL.endpoints.map((e: any) => [e.path, e.accessible ? 'Yes' : 'No', e.introspectionOpen ? 'Open' : 'Closed']));
  }

  // Rate Limit
  if (scan.results.rateLimit) {
    const rl = scan.results.rateLimit;
    md += `## Rate Limit\n\n${mdKv([['Rate Limited', rl.rateLimited ? 'Yes' : 'No'], ['Requests Sent', String(rl.requestsSent)], ['Blocked', String(rl.requestsBlocked)], ['Details', rl.details || 'N/A']])}`;
  }

  // CSRF
  if (scan.results.csrfDetection?.totalForms > 0) {
    md += `## CSRF Detection (${scan.results.csrfDetection.formsWithoutToken} unprotected forms of ${scan.results.csrfDetection.totalForms})\n\n`;
    scan.results.csrfDetection.forms.filter((f: any) => !f.hasCSRFToken).forEach((f: any) => { md += `- ${f.action || 'N/A'} (${f.method})\n`; });
    md += '\n';
  }

  // CDN
  if (scan.results.cdnDetection?.detectedCount > 0) {
    md += `## CDN Detection (${scan.results.cdnDetection.detectedCount} detected)\n\n`;
    scan.results.cdnDetection.cdns.filter((c: any) => c.detected).forEach((c: any) => { md += `- **${c.name}**: ${c.evidence?.join(', ') || 'Detected'}\n`; });
    md += '\n';
  }

  // Cloud Provider
  if (scan.results.cloudProvider?.detectedCount > 0) {
    md += `## Cloud Provider (${scan.results.cloudProvider.detectedCount} detected)\n\n`;
    scan.results.cloudProvider.providers.filter((p: any) => p.detected).forEach((p: any) => { md += `- **${p.name}**: ${p.evidence?.join(', ') || 'Detected'}\n`; });
    md += '\n';
  }

  // Robots & Sitemap
  if (scan.results.robotsSitemap) {
    const rs = scan.results.robotsSitemap;
    md += `## Robots & Sitemap\n\n${mdKv([['robots.txt', rs.robots?.exists ? 'Found' : 'Not found'], ['Sitemap', rs.sitemap?.exists ? `Found (${rs.sitemap.count} URLs)` : 'Not found']])}`;
    if (rs.robots?.disallowedPaths?.length) { md += `### Disallowed Paths\n\n`; rs.robots.disallowedPaths.forEach((p: string) => { md += `- ${p}\n`; }); md += '\n'; }
  }

  // Cookie Audit
  if (scan.results.cookieAudit?.cookies?.length) {
    const ca = scan.results.cookieAudit;
    md += `## Cookie Audit (${ca.totalCount} cookies, ${ca.insecureCookies} insecure)\n\n`;
    md += mdTable(['Name', 'Secure', 'HttpOnly', 'SameSite', 'Issues'], ca.cookies.map((c: any) => [c.name, c.secure ? 'Yes' : 'No', c.httpOnly ? 'Yes' : 'No', c.sameSite || 'N/A', c.issues?.join('; ')?.substring(0, 100) || 'None']));
  }

  // Email Harvesting
  if (scan.results.emailHarvesting?.emails?.length) {
    md += `## Email Harvesting (${scan.results.emailHarvesting.totalEmails} emails found)\n\n`;
    md += mdTable(['Email', 'Source'], scan.results.emailHarvesting.emails.slice(0, 50).map((e: any) => [e.email, e.source || 'N/A']));
  }

  if (returnContent) {
    return md;
  } else {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    try {
      saveAs(blob, `abspider-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}.md`);
    } catch (e) {
      console.warn('[Report] Failed to save Markdown:', e);
    }
  }
};

export const generateCsvReport = (scan: Scan, returnContent: boolean = false): string | void => {
  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  let csvContent = `Report Type,ABSpider Recon Dashboard\n`;
  csvContent += `Target,${escapeCsv(scan.target)}\n`;
  csvContent += `Scan ID,${escapeCsv(scan.id)}\n`;
  csvContent += `Generated,${escapeCsv(new Date().toLocaleString())}\n`;
  csvContent += `Status,${escapeCsv(scan.status.toUpperCase())}\n`; // Updated status
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
  csvContent += `WAF Protection,${escapeCsv(ddosFirewallDetected)},${escapeCsv(ddosFirewallDetected > 0 ? 'INFO' : 'N/A')}\n`;
  csvContent += `VirusTotal Malicious,${escapeCsv(virustotalMalicious)},${escapeCsv(virustotalMalicious > 0 ? 'HIGH' : 'SAFE')}\n`;
  csvContent += `SSL Certificate Expired,${escapeCsv(sslTlsExpired)},${escapeCsv(sslTlsExpired > 0 ? 'CRITICAL' : 'VALID')}\n`;
  csvContent += `Broken Links,${escapeCsv(brokenLinksCount)},${escapeCsv(brokenLinksCount > 0 ? 'MEDIUM' : 'SAFE')}\n`;
  csvContent += `\n`;

  // Vulnerability detail sections
  const csvVulnSection = (label: string, vulns: any[], cols: string[], mapFn: (v: any) => string[]) => {
    if (!vulns.length) return;
    csvContent += `${label} Details\n`;
    csvContent += cols.join(',') + '\n';
    vulns.forEach(v => { csvContent += mapFn(v).map(escapeCsv).join(',') + '\n'; });
    csvContent += '\n';
  };
  csvVulnSection('SQL Injection', scan.results.sqlinjection?.vulnerabilities || [], ['Severity', 'Type', 'Parameter', 'Payload', 'Evidence'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || 'N/A', v.payload, v.evidence || 'N/A']);
  csvVulnSection('XSS', scan.results.xss?.vulnerabilities || [], ['Severity', 'Type', 'Location', 'Payload', 'Evidence'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || v.location || 'N/A', v.payload, v.evidence || 'N/A']);
  csvVulnSection('LFI', scan.results.lfi?.vulnerabilities || [], ['Severity', 'Type', 'Parameter', 'Payload', 'Confidence', 'Indicator'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.parameter || 'N/A', v.payload, String(v.confidence ?? 'N/A'), v.indicator || 'N/A']);
  csvVulnSection('CORS Misconfiguration', scan.results.corsMisconfig?.vulnerabilities || [], ['Severity', 'Type', 'Origin Tested', 'Evidence'], v => [v.severity.toUpperCase(), v.type?.replace(/_/g, ' ') || 'N/A', v.originTested || 'N/A', v.evidence || 'N/A']);
  csvVulnSection('WordPress', scan.results.wordpress?.vulnerabilities || [], ['Severity', 'Type', 'Description'], v => [v.severity.toUpperCase(), v.type || 'N/A', v.description || 'N/A']);
  csvVulnSection('Broken Links', scan.results.brokenLinks?.brokenLinks || [], ['URL', 'Status', 'Type', 'Source Page'], v => [v.url || 'N/A', String(v.status), v.isInternal ? 'Internal' : 'External', v.sourcePage || 'N/A']);

  // Missing module sections
  const csvKv = (label: string, rows: [string, string][]) => {
    csvContent += `${label}\n`;
    rows.forEach(([k, v]) => { csvContent += `${escapeCsv(k)},${escapeCsv(v)}\n`; });
    csvContent += '\n';
  };

  if (scan.results.whois) {
    const w = scan.results.whois;
    csvKv('Whois Information', [['Domain', w.domain], ['Registrar', w.registrar || 'N/A'], ['Created', w.created || 'N/A'], ['Expires', w.expires || 'N/A'], ['Nameservers', w.nameservers?.join('; ') || 'N/A']]);
  }

  if (scan.results.reverseip?.domains?.length) {
    csvContent += `Reverse IP (${scan.results.reverseip.ip})\n`;
    csvContent += `Domain,Title,WebServer,CMS,Cloudflare\n`;
    scan.results.reverseip.domains.forEach((d: any) => { csvContent += `${escapeCsv(d.domain)},${escapeCsv(d.title || 'N/A')},${escapeCsv(d.webServer || 'N/A')},${escapeCsv(d.cms || 'N/A')},${d.cloudflare ? 'Yes' : 'No'}\n`; });
    csvContent += '\n';
  }

  if (scan.results.emailSecurity) {
    const es = scan.results.emailSecurity;
    csvKv('Email Security', [['Domain', es.domain], ['Score', `${es.overallScore}/10`], ['SPF', es.spf?.exists ? (es.spf.valid ? 'Valid' : 'Invalid') : 'Missing'], ['DMARC', es.dmarc?.exists ? (es.dmarc.valid ? 'Valid' : 'Invalid') : 'Missing']]);
  }

  if (scan.results.jsInspection?.files?.length) {
    csvContent += `JS Analysis\nFile,Size(KB),Endpoints,API Keys\n`;
    scan.results.jsInspection.files.forEach((f: any) => { csvContent += `${escapeCsv(f.url)},${(f.size / 1024).toFixed(1)},${escapeCsv(f.endpoints?.join('; ') || '')},${escapeCsv(f.apiKeys?.join('; ') || '')}\n`; });
    csvContent += '\n';
  }

  if (scan.results.s3Bucket?.buckets?.length) {
    csvContent += `S3 Buckets\nBucket,Accessible,Listing,Status\n`;
    scan.results.s3Bucket.buckets.forEach((b: any) => { csvContent += `${escapeCsv(b.name)},${b.accessible ? 'Yes' : 'No'},${b.listing ? 'Yes' : 'No'},${b.statusCode}\n`; });
    csvContent += '\n';
  }

  if (scan.results.gitExposure?.files?.length) {
    csvContent += `Git Exposure\nPath,Exposed,Status\n`;
    scan.results.gitExposure.files.forEach((f: any) => { csvContent += `${escapeCsv(f.path)},${f.exposed ? 'Yes' : 'No'},${f.statusCode}\n`; });
    csvContent += '\n';
  }

  if (scan.results.openRedirect?.vulnerableCount > 0) {
    csvContent += `Open Redirect\nParameter,Redirects To,Status\n`;
    scan.results.openRedirect.tests.filter((t: any) => t.vulnerable).forEach((t: any) => { csvContent += `${escapeCsv(t.param)},${escapeCsv(t.redirectedTo || 'N/A')},${t.statusCode}\n`; });
    csvContent += '\n';
  }

  if (scan.results.cveScanner?.totalFound > 0) {
    csvContent += `CVE Scanner\nCVE ID,Technology,Severity,Description\n`;
    scan.results.cveScanner.matches.forEach((m: any) => { csvContent += `${escapeCsv(m.cveId)},${escapeCsv(m.technology)},${escapeCsv(m.severity)},${escapeCsv(m.description)}\n`; });
    csvContent += '\n';
  }

  if (scan.results.graphQL?.totalEndpoints > 0) {
    csvContent += `GraphQL\nPath,Accessible,Introspection\n`;
    scan.results.graphQL.endpoints.forEach((e: any) => { csvContent += `${escapeCsv(e.path)},${e.accessible ? 'Yes' : 'No'},${e.introspectionOpen ? 'Open' : 'Closed'}\n`; });
    csvContent += '\n';
  }

  if (scan.results.rateLimit) {
    const rl = scan.results.rateLimit;
    csvKv('Rate Limit', [['Rate Limited', rl.rateLimited ? 'Yes' : 'No'], ['Requests Sent', String(rl.requestsSent)], ['Blocked', String(rl.requestsBlocked)], ['Details', rl.details || 'N/A']]);
  }

  if (scan.results.csrfDetection?.totalForms > 0) {
    csvContent += `CSRF Detection\nForm Action,Method,Has Token\n`;
    scan.results.csrfDetection.forms.forEach((f: any) => { csvContent += `${escapeCsv(f.action || 'N/A')},${escapeCsv(f.method)},${f.hasCSRFToken ? 'Yes' : 'No'}\n`; });
    csvContent += '\n';
  }

  if (scan.results.cdnDetection?.detectedCount > 0) {
    csvContent += `CDN Detection\nName,Evidence\n`;
    scan.results.cdnDetection.cdns.filter((c: any) => c.detected).forEach((c: any) => { csvContent += `${escapeCsv(c.name)},${escapeCsv(c.evidence?.join('; ') || '')}\n`; });
    csvContent += '\n';
  }

  if (scan.results.cloudProvider?.detectedCount > 0) {
    csvContent += `Cloud Provider\nName,Evidence\n`;
    scan.results.cloudProvider.providers.filter((p: any) => p.detected).forEach((p: any) => { csvContent += `${escapeCsv(p.name)},${escapeCsv(p.evidence?.join('; ') || '')}\n`; });
    csvContent += '\n';
  }

  if (scan.results.robotsSitemap) {
    const rs = scan.results.robotsSitemap;
    csvKv('Robots & Sitemap', [['robots.txt', rs.robots?.exists ? 'Found' : 'Not found'], ['Sitemap', rs.sitemap?.exists ? `Found (${rs.sitemap.count} URLs)` : 'Not found']]);
    if (rs.robots?.disallowedPaths?.length) { rs.robots.disallowedPaths.forEach((p: string) => { csvContent += `Disallowed Path,${escapeCsv(p)}\n`; }); csvContent += '\n'; }
  }

  if (scan.results.cookieAudit?.cookies?.length) {
    csvContent += `Cookie Audit\nName,Secure,HttpOnly,SameSite,Issues\n`;
    scan.results.cookieAudit.cookies.forEach((c: any) => { csvContent += `${escapeCsv(c.name)},${c.secure ? 'Yes' : 'No'},${c.httpOnly ? 'Yes' : 'No'},${escapeCsv(c.sameSite || 'N/A')},${escapeCsv(c.issues?.join('; ') || 'None')}\n`; });
    csvContent += '\n';
  }

  if (scan.results.emailHarvesting?.emails?.length) {
    csvContent += `Email Harvesting\nEmail,Source,Context\n`;
    scan.results.emailHarvesting.emails.slice(0, 50).forEach((e: any) => { csvContent += `${escapeCsv(e.email)},${escapeCsv(e.source || 'N/A')},${escapeCsv(e.context || 'N/A')}\n`; });
    csvContent += '\n';
  }

  if (returnContent) {
    return csvContent;
  } else {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    try {
      saveAs(blob, `abspider-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}.csv`);
    } catch (e) {
      console.warn('[Report] Failed to save CSV:', e);
    }
  }
};
