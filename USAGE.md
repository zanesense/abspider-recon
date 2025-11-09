# ABSpider Recon Dashboard - Usage Guide

## Overview
ABSpider is a production-ready web reconnaissance tool that performs real-time passive reconnaissance, security analysis, and generates comprehensive reports.

## Features

### 1. HTTP Headers Analysis
- **Real-time header scanning** using actual HTTP requests
- **Security header detection** (HSTS, CSP, X-Frame-Options, etc.)
- **Technology fingerprinting** (Server, X-Powered-By, etc.)
- **Security scoring** based on present/missing headers

### 2. WHOIS Lookup
- **Domain registration information** via public RDAP/WHOIS APIs
- **Nameserver enumeration** using DNS over HTTPS
- **Registrar and organization details**
- **Registration and expiration dates**

### 3. Subdomain Enumeration
- **DNS brute-forcing** using Google DNS over HTTPS API
- **Certificate Transparency logs** via crt.sh API
- **Concurrent scanning** with configurable thread count
- **Deduplication** across multiple sources

### 4. Port Scanning
- **Common port detection** (21, 22, 80, 443, 3306, etc.)
- **Service identification**
- **Concurrent scanning** for performance
- **Browser-based connectivity checks**

### 5. PDF Report Generation
- **Comprehensive reports** with all scan results
- **Professional formatting** with tables and sections
- **Automatic download** after generation
- **Includes all findings** from enabled modules

### 6. Discord Webhook Integration
- **Real-time notifications** when scans complete
- **Rich embeds** with scan summary
- **Error reporting** if issues occur
- **Test functionality** to verify webhook

### 7. Proxy Rotation
- **Configure multiple proxies** in settings
- **Automatic rotation** during scanning
- **Helps avoid rate limiting**
- **Optional per-scan**

## How to Use

### Starting a New Scan

1. Click **"New Scan"** in the sidebar
2. Enter target domain or URL (e.g., `example.com` or `https://example.com`)
3. Select reconnaissance modules:
   - ✅ **Headers** - HTTP security analysis
   - ✅ **WHOIS** - Domain registration info
   - ✅ **Subdomains** - Subdomain discovery
   - ⬜ **Ports** - Port scanning (optional)
4. Configure options:
   - **Threads**: 1-20 (higher = faster but more aggressive)
   - **Use Proxy**: Enable proxy rotation if configured
5. Click **"Start Reconnaissance"**

### Viewing Results

- Scans appear on the **Dashboard** immediately
- Click any scan to view detailed results
- **Real-time updates** while scan is running
- **Progress indicator** shows current stage
- Results organized by module

### Generating Reports

1. Open completed scan
2. Click **"Download Report"** button
3. PDF automatically downloads with all findings
4. Includes headers, WHOIS, subdomains, ports

### Discord Notifications

1. Go to **Settings**
2. Enter Discord webhook URL
3. Click **"Test Webhook"** to verify
4. Click **"Save Settings"**
5. Use **"Send to Discord"** button on scan results

### Configuring Proxies

1. Go to **Settings**
2. Enter proxy list (one per line):
   ```
   http://proxy1.example.com:8080
   http://proxy2.example.com:8080
   ```
3. Click **"Save Settings"**
4. Enable **"Use Proxy Rotation"** when starting scans

## Technical Details

### APIs Used
- **Google DNS over HTTPS** - Subdomain enumeration
- **crt.sh** - Certificate Transparency logs
- **RDAP** - Domain registration data
- **ipapi.co** - IP and domain information

### Browser Limitations
- **CORS restrictions** may limit some scans
- **Port scanning** uses connectivity checks (not raw sockets)
- **Some targets** may block automated requests
- **Rate limiting** may occur on aggressive scans

### Performance Tips
- Start with **5 threads** (default)
- Increase threads for faster scans (up to 20)
- Use **proxy rotation** for large scans
- Disable unused modules to speed up scans

### Data Storage
- All scans stored in **browser localStorage**
- Persists across sessions
- No server-side storage
- Clear browser data to reset

## Troubleshooting

### Scan Fails Immediately
- Check target URL format
- Ensure target is accessible
- Try with fewer modules enabled
- Check browser console for errors

### No Subdomains Found
- Target may have few subdomains
- DNS queries may be rate-limited
- Try again with proxy rotation
- Some domains block enumeration

### Discord Webhook Not Working
- Verify webhook URL is correct
- Use "Test Webhook" button first
- Check Discord server permissions
- Ensure webhook hasn't been deleted

### Headers Not Loading
- Target may block HEAD requests
- CORS may prevent access
- Try with proxy enabled
- Some sites require authentication

## Best Practices

1. **Start small** - Test with well-known domains first
2. **Respect rate limits** - Don't scan too aggressively
3. **Use responsibly** - Only scan domains you own or have permission
4. **Save important scans** - Download PDF reports
5. **Configure Discord** - Get notified when long scans complete

## Legal Notice

This tool is for **authorized security testing only**. Only scan:
- Domains you own
- Systems you have written permission to test
- Public bug bounty programs

Unauthorized scanning may be illegal in your jurisdiction.

## Support

For issues or questions:
- Check browser console for detailed logs
- Verify all settings are correct
- Try with a known-good target (e.g., example.com)
- Review this documentation

---

**ABSpider Recon Dashboard** - Professional reconnaissance made simple.