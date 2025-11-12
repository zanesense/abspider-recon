import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scan } from './scanService';

const getSecurityRecommendations = (scan: Scan): string[] => {
  const recommendations: string[] = [];
  
  // SQL Injection recommendations
  if (scan.results.sqlinjection?.vulnerable) {
    recommendations.push('🔴 CRITICAL: SQL Injection Detected');
    recommendations.push('• Use parameterized queries/prepared statements');
    recommendations.push('• Implement input validation and sanitization');
    recommendations.push('• Use ORM frameworks (Sequelize, TypeORM, etc.)');
    recommendations.push('• Apply principle of least privilege to database users');
    recommendations.push('• Enable WAF (Web Application Firewall)');
  }
  
  // XSS recommendations
  if (scan.results.xss?.vulnerable) {
    recommendations.push('🔴 CRITICAL: XSS Vulnerability Detected');
    recommendations.push('• Encode all user input before rendering');
    recommendations.push('• Implement Content Security Policy (CSP)');
    recommendations.push('• Use HTTPOnly and Secure flags on cookies');
    recommendations.push('• Sanitize HTML input with DOMPurify or similar');
    recommendations.push('• Validate input on both client and server side');
  }
  
  // LFI recommendations
  if (scan.results.lfi?.vulnerable) {
    recommendations.push('🔴 CRITICAL: Local File Inclusion Detected');
    recommendations.push('• Use whitelisting for allowed file paths');
    recommendations.push('• Validate and sanitize all user input');
    recommendations.push('• Reject path traversal patterns (../, ..\)');
    recommendations.push('• Use built-in secure file handling functions');
    recommendations.push('• Disable remote file inclusion');
    recommendations.push('• Run application with minimum file permissions');
    recommendations.push('• Deploy Web Application Firewall (WAF)');
  }
  
  // WordPress recommendations
  if (scan.results.wordpress?.vulnerabilities?.length > 0) {
    recommendations.push('🟠 HIGH: WordPress Security Issues');
    recommendations.push('• Update WordPress to latest version immediately');
    recommendations.push('• Remove or secure sensitive files (wp-config backups)');
    recommendations.push('• Disable XML-RPC if not needed');
    recommendations.push('• Use security plugins (Wordfence, Sucuri)');
    recommendations.push('• Enable two-factor authentication');
    recommendations.push('• Regular security audits and updates');
  }
  
  // Security headers recommendations
  const headers = scan.results.headers?._analysis;
  if (headers?.securityHeaders) {
    const missing = headers.securityHeaders.missing || [];
    if (missing.length > 0) {
      recommendations.push('🟡 MEDIUM: Missing Security Headers');
      missing.forEach((header: any) => {
        recommendations.push(`• ${header.name}: ${header.recommendation}`);
      });
    }
  }
  
  return recommendations;
};

export const generatePDFReport = (scan: Scan) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Calculate vulnerability counts upfront
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const lfiVulns = scan.results.lfi?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const totalVulns = sqlVulns + xssVulns + lfiVulns + wpVulns;

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
    doc.text('⚠️ SECURITY RECOMMENDATIONS', 14, yPosition);
    
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
    doc.text('🔒 VULNERABILITY SUMMARY', 14, yPosition);
    
    yPosition += 15;
    
    const vulnData = [
      ['SQL Injection', sqlVulns.toString(), sqlVulns > 0 ? 'CRITICAL' : 'SAFE', sqlVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['Cross-Site Scripting (XSS)', xssVulns.toString(), xssVulns > 0 ? 'CRITICAL' : 'SAFE', xssVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['Local File Inclusion (LFI)', lfiVulns.toString(), lfiVulns > 0 ? 'CRITICAL' : 'SAFE', lfiVulns > 0 ? 'Immediate action required' : 'No issues found'],
      ['WordPress Security', wpVulns.toString(), wpVulns > 0 ? 'HIGH' : 'SAFE', wpVulns > 0 ? 'Update and secure' : 'No issues found'],
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
    doc.text('💉 SQL Injection Vulnerabilities', 14, yPosition);
    yPosition += 15;
    
    const sqlData = scan.results.sqlinjection.vulnerabilities.map((vuln: any) => [
      vuln.severity.toUpperCase(),
      vuln.type || 'N/A',
      vuln.parameter || 'N/A',
      vuln.payload.substring(0, 40) + '...',
      vuln.evidence?.substring(0, 60) + '...' || 'N/A',
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
    doc.text('🔓 XSS Vulnerabilities', 14, yPosition);
    yPosition += 15;
    
    const xssData = scan.results.xss.vulnerabilities.map((vuln: any) => [
      vuln.severity.toUpperCase(),
      vuln.type || 'N/A',
      vuln.parameter || vuln.location || 'N/A',
      vuln.payload.substring(0, 40) + '...',
      vuln.evidence?.substring(0, 60) + '...' || 'N/A',
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
    doc.text('📁 Local File Inclusion Vulnerabilities', 14, yPosition);
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

  // Site Information
  if (scan.results.siteInfo) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(6, 182, 212);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('🌐 Site Information', 14, yPosition);
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

  // Security Headers Analysis
  if (scan.results.headers?._analysis?.securityHeaders) {
    doc.addPage();
    yPosition = 20;
    
    const headers = scan.results.headers._analysis;
    const grade = headers.securityHeaders.grade || 'N/A';
    const gradeColor = grade === 'A+' || grade === 'A' ? [16, 185, 129] : 
                       grade === 'B' ? [234, 179, 8] : [239, 68, 68];
    
    doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`🛡️ Security Headers Analysis - Grade: ${grade}`, 14, yPosition);
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
    doc.text('🌍 GeoIP Information', 14, yPosition);
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
    doc.text('🔍 DNS Records', 14, yPosition);
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
  if (scan.results.subdomains && scan.results.subdomains.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(16, 185, 129);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`🌐 Discovered Subdomains (${scan.results.subdomains.length})`, 14, yPosition);
    yPosition += 15;
    
    const subdomainData = scan.results.subdomains.map((subdomain, index) => [
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
    doc.text('📊 SEO Analysis', 14, yPosition);
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

  doc.save(`abspider-security-report-${scan.target.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`);
};