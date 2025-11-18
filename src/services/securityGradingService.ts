import { Scan } from './scanService';

export const calculateSecurityGrade = (scan: Scan): number => {
  let grade = 10; // Start with a perfect score

  // Deductions for critical vulnerabilities
  if (scan.results.sqlinjection?.vulnerable && scan.results.sqlinjection.vulnerabilities.length > 0) {
    grade -= 4; // Significant deduction for SQL Injection
  }
  if (scan.results.xss?.vulnerable && scan.results.xss.vulnerabilities.length > 0) {
    grade -= 3; // Significant deduction for XSS
  }
  if (scan.results.lfi?.vulnerable && scan.results.lfi.vulnerabilities.length > 0) {
    grade -= 3; // Significant deduction for LFI
  }
  if (scan.results.corsMisconfig?.vulnerable && scan.results.corsMisconfig.vulnerabilities.length > 0) {
    grade -= 3; // Significant deduction for CORS Misconfiguration
  }

  // Deductions for high/medium vulnerabilities
  if (scan.results.wordpress?.vulnerabilities && scan.results.wordpress.vulnerabilities.length > 0) {
    // Deduct more for critical WP issues, less for medium
    const criticalWPVulns = scan.results.wordpress.vulnerabilities.filter(v => v.severity === 'high').length;
    grade -= Math.min(criticalWPVulns * 1.5, 3); // Cap at 3 points
  }

  // Deductions for missing security headers
  const missingSecurityHeaders = scan.results.headers?.securityHeaders?.missing || [];
  let headerDeduction = 0;
  missingSecurityHeaders.forEach(header => {
    if (header.severity === 'critical') headerDeduction += 1;
    else if (header.severity === 'high') headerDeduction += 0.7;
    else if (header.severity === 'medium') headerDeduction += 0.3;
  });
  grade -= Math.min(headerDeduction, 3); // Cap header deduction at 3 points

  // Deductions for open ports (increases attack surface)
  const openPorts = scan.results.ports?.filter(p => p.status === 'open').length || 0;
  grade -= Math.min(openPorts * 0.15, 1.5); // Small deduction per open port, capped at 1.5 points

  // Deductions for MX record issues (SPF/DMARC)
  if (scan.config.mx && scan.results.mx) {
    if (!scan.results.mx.spfRecord) {
      grade -= 0.7; // Deduction for missing SPF record
    }
    if (!scan.results.mx.dmarcRecord) {
      grade -= 0.7; // Deduction for missing DMARC record
    }
  }

  // Deductions for VirusTotal
  if (scan.results.virustotal?.reputation !== undefined && scan.results.virustotal.reputation < 0) {
    grade -= 1.5; // Deduction for negative VirusTotal reputation
  }
  if (scan.results.virustotal?.detectedUrls && scan.results.virustotal.detectedUrls.some(u => u.positives > 0)) {
    grade -= 1; // Additional deduction for malicious URLs detected
  }

  // Deductions for SSL/TLS
  if (scan.results.sslTls?.isExpired) {
    grade -= 3; // Significant deduction for expired SSL certificate
  } else if (scan.results.sslTls?.daysUntilExpiry !== undefined && scan.results.sslTls.daysUntilExpiry <= 30) {
    grade -= 1.5; // Deduction for SSL certificate expiring soon
  }

  // Deductions for Broken Links
  if (scan.results.brokenLinks?.brokenLinks && scan.results.brokenLinks.brokenLinks.length > 0) {
    grade -= Math.min(scan.results.brokenLinks.brokenLinks.length * 0.1, 1); // Small deduction per broken link, capped at 1 point
  }

  // Minor deduction for outdated tech stack (if detected and significant)
  if (scan.results.techStack?.technologies) {
    const outdatedTech = scan.results.techStack.technologies.filter(tech => 
      (tech.name === 'WordPress' && tech.version && parseFloat(tech.version) < 6.0) ||
      (tech.name === 'PHP' && tech.version && parseFloat(tech.version) < 8.0) ||
      (tech.name === 'Apache HTTP Server' && tech.version && parseFloat(tech.version) < 2.4) ||
      (tech.name === 'Nginx' && tech.version && parseFloat(tech.version) < 1.20)
    ).length;
    grade -= Math.min(outdatedTech * 0.5, 1); // Cap at 1 point
  }

  // Bonus for DDoS/WAF detection (indicates some protection)
  if (scan.results.ddosFirewall?.firewallDetected) {
    grade += 0.5;
  }

  // Ensure grade is within 1-10 range
  grade = Math.max(1, Math.min(10, grade));

  return parseFloat(grade.toFixed(1)); // Return grade rounded to one decimal place
};