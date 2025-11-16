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

  // Deductions for high/medium vulnerabilities
  if (scan.results.wordpress?.vulnerabilities && scan.results.wordpress.vulnerabilities.length > 0) {
    grade -= 2; // Deduction for WordPress security issues
  }

  // Deductions for missing security headers
  const missingSecurityHeaders = scan.results.headers?._analysis?.securityHeaders?.missing || [];
  let headerDeduction = 0;
  missingSecurityHeaders.forEach(header => {
    if (header.severity === 'critical' || header.severity === 'high') {
      headerDeduction += 0.5; // Small deduction per critical/high missing header
    }
  });
  grade -= Math.min(headerDeduction, 2); // Cap header deduction at 2 points

  // Deductions for open ports (increases attack surface)
  const openPorts = scan.results.ports?.filter(p => p.status === 'open').length || 0;
  grade -= Math.min(openPorts * 0.1, 1); // Small deduction per open port, capped at 1 point

  // Deductions for MX record issues (SPF/DMARC)
  if (scan.config.mx && scan.results.mx) {
    if (!scan.results.mx.spfRecord) {
      grade -= 0.5; // Deduction for missing SPF record
    }
    if (!scan.results.mx.dmarcRecord) {
      grade -= 0.5; // Deduction for missing DMARC record
    }
  }

  // Bonus for DDoS/WAF detection (indicates some protection)
  if (scan.results.ddosFirewall?.firewallDetected) {
    grade += 0.5;
  }

  // Ensure grade is within 1-10 range
  grade = Math.max(1, Math.min(10, grade));

  return parseFloat(grade.toFixed(1)); // Return grade rounded to one decimal place
};