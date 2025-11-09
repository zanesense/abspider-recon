import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scan } from './scanService';

export const generatePDFReport = (scan: Scan) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Modern header with gradient effect
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('ABSpider', 14, 20);
  
  doc.setFontSize(14);
  doc.text('Comprehensive Reconnaissance Report', 14, 30);
  
  yPosition = 50;

  // Executive Summary Box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, yPosition, 182, 35, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Executive Summary', 20, yPosition + 8);
  
  doc.setFontSize(10);
  doc.text(`Target: ${scan.target}`, 20, yPosition + 16);
  doc.text(`Scan ID: ${scan.id}`, 20, yPosition + 22);
  doc.text(`Date: ${new Date(scan.timestamp).toLocaleString()}`, 20, yPosition + 28);
  
  const statusColor = scan.status === 'completed' ? [16, 185, 129] : [239, 68, 68];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${scan.status.toUpperCase()}`, 120, yPosition + 16);
  
  yPosition += 45;

  // Vulnerability Summary (if any)
  const sqlVulns = scan.results.sqlinjection?.vulnerabilities?.length || 0;
  const xssVulns = scan.results.xss?.vulnerabilities?.length || 0;
  const wpVulns = scan.results.wordpress?.vulnerabilities?.length || 0;
  const totalVulns = sqlVulns + xssVulns + wpVulns;

  if (totalVulns > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(239, 68, 68);
    doc.rect(0, yPosition - 10, 210, 15, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('⚠️ SECURITY VULNERABILITIES DETECTED', 14, yPosition);
    
    yPosition += 15;
    
    const vulnData = [
      ['SQL Injection', sqlVulns.toString(), sqlVulns > 0 ? 'CRITICAL' : 'SAFE'],
      ['XSS', xssVulns.toString(), xssVulns > 0 ? 'CRITICAL' : 'SAFE'],
      ['WordPress', wpVulns.toString(), wpVulns > 0 ? 'HIGH' : 'SAFE'],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Vulnerability Type', 'Count', 'Severity']],
      body: vulnData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Site Information
  if (scan.results.siteInfo) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFillColor(6, 182, 212);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('🌐 Site Information', 14, yPosition);
    yPosition += 10;
    
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

  // GeoIP Information
  if (scan.results.geoip) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFillColor(139, 92, 246);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('🌍 GeoIP Information', 14, yPosition);
    yPosition += 10;
    
    const geoipData = [
      ['IP Address', scan.results.geoip.ip || 'N/A'],
      ['Country', scan.results.geoip.country || 'N/A'],
      ['City', scan.results.geoip.city || 'N/A'],
      ['Region', scan.results.geoip.region || 'N/A'],
      ['Timezone', scan.results.geoip.timezone || 'N/A'],
      ['ISP', scan.results.geoip.isp || 'N/A'],
      ['ASN', scan.results.geoip.asn || 'N/A'],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      body: geoipData,
      theme: 'striped',
      styles: { fontSize: 9 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // DNS Records
  if (scan.results.dns) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFillColor(59, 130, 246);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('🔍 DNS Records', 14, yPosition);
    yPosition += 10;
    
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
          headStyles: { fillColor: [59, 130, 246] },
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
    doc.text(`🌐 Discovered Subdomains (${scan.results.subdomains.length})`, 14, yPosition);
    yPosition += 10;
    
    const subdomainData = scan.results.subdomains.map((subdomain, index) => [
      (index + 1).toString(),
      subdomain
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Subdomain']],
      body: subdomainData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });
  }

  // SQL Injection Results
  if (scan.results.sqlinjection) {
    doc.addPage();
    yPosition = 20;
    
    const sqlColor = scan.results.sqlinjection.vulnerable ? [239, 68, 68] : [16, 185, 129];
    doc.setFillColor(sqlColor[0], sqlColor[1], sqlColor[2]);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('💉 SQL Injection Scan', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Status: ${scan.results.sqlinjection.vulnerable ? 'VULNERABLE ⚠️' : 'SECURE ✓'}`, 14, yPosition);
    doc.text(`Payloads Tested: ${scan.results.sqlinjection.testedPayloads}`, 14, yPosition + 6);
    doc.text(`Vulnerabilities: ${scan.results.sqlinjection.vulnerabilities.length}`, 14, yPosition + 12);
    yPosition += 20;
    
    if (scan.results.sqlinjection.vulnerabilities.length > 0) {
      const sqlData = scan.results.sqlinjection.vulnerabilities.map((vuln: any) => [
        vuln.severity.toUpperCase(),
        vuln.type || 'N/A',
        vuln.parameter || 'N/A',
        vuln.payload.substring(0, 30) + '...',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Severity', 'Type', 'Parameter', 'Payload']],
        body: sqlData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 },
      });
    }
  }

  // XSS Results
  if (scan.results.xss) {
    doc.addPage();
    yPosition = 20;
    
    const xssColor = scan.results.xss.vulnerable ? [239, 68, 68] : [16, 185, 129];
    doc.setFillColor(xssColor[0], xssColor[1], xssColor[2]);
    doc.rect(0, yPosition - 5, 210, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('🔓 XSS Vulnerability Scan', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Status: ${scan.results.xss.vulnerable ? 'VULNERABLE ⚠️' : 'SECURE ✓'}`, 14, yPosition);
    doc.text(`Payloads Tested: ${scan.results.xss.testedPayloads}`, 14, yPosition + 6);
    doc.text(`Vulnerabilities: ${scan.results.xss.vulnerabilities.length}`, 14, yPosition + 12);
    yPosition += 20;
    
    if (scan.results.xss.vulnerabilities.length > 0) {
      const xssData = scan.results.xss.vulnerabilities.map((vuln: any) => [
        vuln.severity.toUpperCase(),
        vuln.type || 'N/A',
        vuln.parameter || 'N/A',
        vuln.payload.substring(0, 30) + '...',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Severity', 'Type', 'Parameter', 'Payload']],
        body: xssData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 },
      });
    }
  }

  // Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`ABSpider Recon Dashboard | Page ${i} of ${pageCount}`, 14, 285);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 285);
  }

  doc.save(`abspider-report-${scan.target}-${Date.now()}.pdf`);
};