# User Guide

Complete guide to using ABSpider Recon for web reconnaissance and security analysis.

## Table of Contents

- [Getting Started](#getting-started)
- [Running Your First Scan](#running-your-first-scan)
- [Understanding Results](#understanding-results)
- [Advanced Scanning](#advanced-scanning)
- [Managing Scans](#managing-scans)
- [Generating Reports](#generating-reports)
- [Best Practices](#best-practices)

## Getting Started

### First Login

1. Navigate to the ABSpider Recon application
2. Click **Login** button
3. Enter your email address
4. Check your email for the magic link
5. Click the link to authenticate
6. You'll be redirected to the dashboard

### Dashboard Overview

The dashboard displays:
- **Recent Scans**: Your latest reconnaissance activities
- **Quick Stats**: Total scans, vulnerabilities found, active scans
- **Scan Status**: Real-time progress of running scans
- **Quick Actions**: Start new scan, view all scans, access settings

### Navigation

- **Dashboard**: Overview and recent activity
- **New Scan**: Start a new reconnaissance scan
- **All Scans**: View complete scan history
- **Reports**: Access generated reports
- **Settings**: Configure application preferences
- **Account**: Manage your profile and account

## Running Your First Scan

### Step 1: Navigate to New Scan

Click **New Scan** in the sidebar or the **Start New Scan** button on the dashboard.

### Step 2: Enter Target

```
Target Examples:
- example.com
- https://example.com
- www.example.com
- 192.168.1.1
- subdomain.example.com
```

**Important**: Ensure you have authorization to scan the target.

### Step 3: Select Scan Mode

Choose from predefined scan modes:

#### Conservative Mode
- Minimal footprint
- Passive modules only
- Slowest scan speed
- Best for: Initial reconnaissance, stealth operations

#### Adaptive Mode (Recommended)
- Balanced approach
- Mix of passive and active modules
- Moderate scan speed
- Best for: General security assessments

#### Aggressive Mode
- Maximum coverage
- All modules enabled
- Fastest scan speed
- Best for: Authorized penetration testing

### Step 4: Select Modules

Choose specific reconnaissance modules:

**Passive Modules** (Safe, no direct interaction):
- ☑️ Site Information
- ☑️ HTTP Headers Analysis
- ☑️ Tech Stack Fingerprinting
- ☑️ WHOIS Lookup
- ☑️ GeoIP Location
- ☑️ DNS Records
- ☑️ MX Records
- ☑️ Subdomain Enumeration
- ☑️ Reverse IP Lookup
- ☑️ SEO Analysis
- ☑️ SSL/TLS Analysis

**Active Modules** (Requires authorization):
- ☐ Port Scanning
- ☐ SQL Injection Testing
- ☐ XSS Detection
- ☐ LFI Scanning
- ☐ CORS Misconfiguration
- ☐ VirusTotal Scan
- ☐ Broken Link Checker
- ☐ DDoS Firewall Detection

**Utility Modules**:
- ☐ Subnet Calculator
- ☐ WordPress Scanner

### Step 5: Configure Settings

#### Thread Count
- **Range**: 1-50 threads
- **Recommended**: 5 threads for balanced performance
- **Higher values**: Faster scans but more aggressive
- **Lower values**: Slower scans but more stealthy

#### Timeout
- **Range**: 5-60 seconds
- **Recommended**: 30 seconds
- **Higher values**: Better for slow targets
- **Lower values**: Faster scans, may miss slow responses

#### Proxy Rotation
- Enable if you've configured proxies in settings
- Helps avoid rate limiting
- Distributes requests across multiple IPs

### Step 6: Start Scan

1. Review your configuration
2. Click **Start Reconnaissance**
3. Scan appears on dashboard immediately
4. Monitor real-time progress

## Understanding Results

### Scan Status

**Running** 🔄
- Scan is actively executing
- Progress bar shows completion percentage
- Current module displayed

**Completed** ✅
- All modules finished successfully
- Results available for review
- Report can be generated

**Failed** ❌
- Scan encountered errors
- Check error details
- Review target accessibility

**Partial** ⚠️
- Some modules completed
- Others failed or timed out
- Review available results

### Module Results

Each module provides specific information:

#### Site Information
```
Domain: example.com
IP Address: 93.184.216.34
Server: nginx/1.18.0
CMS: WordPress 6.0
Status Code: 200 OK
Response Time: 245ms
```

#### HTTP Headers
```
Security Score: 75/100

✅ Strict-Transport-Security: max-age=31536000
✅ X-Content-Type-Options: nosniff
⚠️ Content-Security-Policy: Missing
❌ X-Frame-Options: Missing
```

#### Subdomain Enumeration
```
Found 15 subdomains:
- www.example.com (Active)
- mail.example.com (Active)
- api.example.com (Active)
- dev.example.com (Inactive)
- staging.example.com (Active)
...
```

#### Port Scanning
```
Open Ports:
- 22/tcp: SSH (OpenSSH 8.2)
- 80/tcp: HTTP (nginx)
- 443/tcp: HTTPS (nginx)
- 3306/tcp: MySQL (Filtered)
```

#### Vulnerability Detection
```
SQL Injection: VULNERABLE
Severity: High
Confidence: 90%
Location: /search?q=
Payload: ' OR '1'='1
Evidence: MySQL error message in response
```

### Severity Levels

**Critical** 🔴
- Immediate exploitation possible
- High impact on security
- Requires urgent remediation

**High** 🟠
- Significant security risk
- Exploitation likely
- Should be fixed soon

**Medium** 🟡
- Moderate security concern
- May require specific conditions
- Fix when possible

**Low** 🟢
- Minor security issue
- Low exploitation risk
- Consider fixing

**Info** ℹ️
- Informational finding
- No immediate risk
- Good to know

## Advanced Scanning

### Using Scan Templates

1. Configure a scan with your preferred settings
2. Click **Save as Template**
3. Name your template (e.g., "Quick WordPress Scan")
4. Use template for future scans

### Scheduling Scans

1. Enable **Schedule Scan** toggle
2. Set scan name
3. Choose frequency:
   - Daily
   - Weekly (select days)
   - Monthly (select date)
4. Set time
5. Save schedule

**Note**: Browser tab must remain open for scheduled scans to run.

### Custom Scan Configurations

#### Stealth Scan
```
Threads: 1
Timeout: 45s
Request Delay: 2000ms
Proxy: Enabled
Modules: Passive only
```

#### Fast Scan
```
Threads: 20
Timeout: 10s
Request Delay: 0ms
Proxy: Disabled
Modules: Essential only
```

#### Deep Scan
```
Threads: 3
Timeout: 60s
Request Delay: 500ms
Proxy: Enabled
Modules: All enabled
```

### Using API Keys

Enable enhanced features by adding API keys:

1. Go to **Settings** → **API Integration**
2. Select service (Shodan, VirusTotal, etc.)
3. Enter API key
4. Test key
5. Save

Enhanced modules will automatically use API keys when available.

## Managing Scans

### Viewing Scan History

1. Click **All Scans** in sidebar
2. View list of all scans
3. Filter by:
   - Status (Running, Completed, Failed)
   - Date range
   - Target domain
   - Modules used

### Scan Actions

**View Details**
- Click on any scan to view full results
- Navigate between modules
- Review findings

**Download Report**
- Click **Download Report** button
- PDF generated with all findings
- Includes executive summary and details

**Send to Discord**
- Click **Send to Discord** button
- Notification sent to configured webhook
- Includes scan summary and link

**Delete Scan**
- Click delete icon
- Confirm deletion
- Scan removed from history

### Comparing Scans

1. Select two or more scans
2. Click **Compare** button
3. View side-by-side comparison
4. Identify changes over time

## Generating Reports

### PDF Reports

Reports include:

**Cover Page**
- ABSpider branding
- Scan metadata
- Target information
- Scan date and duration

**Executive Summary**
- Overall security grade (A-F)
- Total vulnerabilities found
- Severity breakdown
- Key findings

**Detailed Findings**
- Module-by-module results
- Vulnerability details
- Evidence and proof-of-concept
- Severity and confidence ratings

**Remediation Guidance**
- Actionable recommendations
- Priority order
- Implementation steps
- Best practices

**Appendix**
- Technical details
- Raw data
- Scan configuration
- Methodology

### Customizing Reports

1. Go to **Settings** → **Reports**
2. Configure:
   - Include/exclude modules
   - Severity threshold
   - Detail level
   - Branding options

### Exporting Data

**JSON Export**
```json
{
  "scan_id": "abc123",
  "target": "example.com",
  "timestamp": "2025-01-14T10:30:00Z",
  "modules": {
    "siteInfo": { ... },
    "headers": { ... },
    ...
  }
}
```

**CSV Export**
```csv
Module,Finding,Severity,Confidence
SQL Injection,Vulnerable endpoint,High,90%
XSS,Reflected XSS,Medium,85%
...
```

## Best Practices

### Before Scanning

✅ **Obtain Authorization**
- Get written permission
- Document authorization
- Understand scope limits
- Know legal boundaries

✅ **Plan Your Scan**
- Define objectives
- Choose appropriate modules
- Consider target sensitivity
- Plan scan timing

✅ **Configure Properly**
- Set appropriate thread count
- Configure timeouts
- Enable proxy if needed
- Test configuration

### During Scanning

✅ **Monitor Progress**
- Watch for errors
- Check target responsiveness
- Adjust if needed
- Note unusual behavior

✅ **Be Respectful**
- Don't overload targets
- Use reasonable thread counts
- Respect rate limits
- Stop if issues arise

✅ **Document Everything**
- Save scan results
- Note interesting findings
- Screenshot evidence
- Record timestamps

### After Scanning

✅ **Review Results**
- Analyze all findings
- Verify vulnerabilities
- Assess severity
- Prioritize issues

✅ **Generate Reports**
- Create comprehensive reports
- Include all evidence
- Provide remediation steps
- Share with stakeholders

✅ **Follow Up**
- Verify fixes
- Rescan after remediation
- Document improvements
- Update documentation

### Security Considerations

⚠️ **Active Scanning Risks**
- May trigger security alerts
- Could impact target performance
- Might be logged and traced
- May violate terms of service

⚠️ **Data Protection**
- Scans stored locally in browser
- Clear sensitive data regularly
- Use private browsing if needed
- Secure your device

⚠️ **API Key Safety**
- Use test keys only
- Never share keys
- Rotate regularly
- Monitor usage

### Performance Tips

🚀 **Optimize Scan Speed**
- Increase threads for faster scans
- Reduce timeout for quick checks
- Disable unnecessary modules
- Use local caching

🚀 **Improve Accuracy**
- Lower thread count
- Increase timeout
- Enable all relevant modules
- Use API keys for enhanced data

🚀 **Reduce Detection**
- Use single thread
- Add request delays
- Enable proxy rotation
- Randomize user agents

## Common Workflows

### Quick Security Check
1. Enter target
2. Select "Quick Scan" profile
3. Run passive modules only
4. Review security headers
5. Check for obvious issues

### Comprehensive Assessment
1. Enter target
2. Select "Comprehensive Scan" profile
3. Enable all authorized modules
4. Configure proxies
5. Run scan
6. Generate full report

### Continuous Monitoring
1. Create scan template
2. Schedule daily/weekly scans
3. Configure Discord notifications
4. Review alerts
5. Track changes over time

### Vulnerability Validation
1. Run targeted scan
2. Focus on specific modules
3. Verify findings manually
4. Document proof-of-concept
5. Report responsibly

---

For configuration details, see [Configuration Guide](./configuration.md).

For troubleshooting, see [Troubleshooting Guide](./troubleshooting.md).

For legal information, see [Legal Disclaimer](./legal.md).
