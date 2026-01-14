# Features Overview

ABSpider Recon provides a comprehensive suite of reconnaissance and security analysis tools. This guide details all available features and their capabilities.

## Table of Contents

- [Core Features](#core-features)
- [Reconnaissance Modules](#reconnaissance-modules)
- [Advanced Features](#advanced-features)
- [Reporting & Notifications](#reporting--notifications)
- [Security Features](#security-features)

## Core Features

### 🔐 Passwordless Authentication

- **Magic Link Login**: Secure, passwordless authentication via email
- **Supabase Integration**: Enterprise-grade authentication backend
- **Session Management**: Automatic session handling and refresh
- **Row-Level Security**: Database-level access control

### 📊 Real-Time Dashboard

- **Live Scan Updates**: Watch scans progress in real-time
- **Status Indicators**: Visual feedback for scan states (running, completed, failed)
- **Recent Scans**: Quick access to your latest reconnaissance activities
- **Scan Statistics**: Overview cards showing total scans, vulnerabilities found, and more

### 🎯 Smart Scan Management

- **Scan Modes**: Conservative, Adaptive, and Aggressive scanning strategies
- **AI-Powered Analysis**: Intelligent target analysis and payload optimization
- **Template System**: Save and reuse scan configurations
- **Module Selection**: Choose specific reconnaissance modules per scan
- **Thread Control**: Adjust concurrency (1-50 threads) for optimal performance

## Reconnaissance Modules

### Passive Reconnaissance (Low Risk)

#### Site Information
- Basic website metadata
- IP address resolution
- Web server identification
- CMS detection
- robots.txt analysis

#### HTTP Headers Analysis
- Security header scoring (HSTS, CSP, X-Frame-Options, etc.)
- Technology fingerprinting
- Server configuration analysis
- Missing security headers detection

#### Tech Stack Fingerprinting
- Framework identification (React, Angular, Vue, etc.)
- Analytics detection (Google Analytics, Mixpanel, etc.)
- CDN identification
- Third-party service detection

#### WHOIS / RDAP Lookup
- Domain registration information
- Registrar details
- Nameserver enumeration
- Creation and expiration dates
- Registrant contact information (when available)

#### GeoIP Location
- Physical server location
- Country, region, and city
- ISP information
- Latitude and longitude coordinates
- Timezone detection

#### DNS Records
- A and AAAA records
- CNAME records
- TXT records (SPF, DKIM, DMARC)
- MX records
- NS records
- SOA records

#### MX Records Analysis
- Mail server enumeration
- SPF record validation
- DMARC policy analysis
- Mail server priority ranking

#### Subdomain Enumeration
- Certificate Transparency log mining
- DNS brute-forcing
- Common subdomain patterns
- Wildcard detection
- Active subdomain verification

#### Reverse IP Lookup
- Shared hosting detection
- Virtual host enumeration
- Related domain discovery

#### SEO Analysis
- Meta tag analysis
- Heading structure (H1-H6)
- Internal and external link analysis
- Image alt text verification
- Page load performance
- Mobile-friendliness indicators

#### SSL/TLS Analysis
- Certificate details
- Issuer information
- Validity period
- Subject Alternative Names (SANs)
- Certificate chain analysis

### Active Reconnaissance (Authorization Required)

#### Port Scanning
- Common port enumeration (21, 22, 80, 443, 3306, etc.)
- Service detection
- Banner grabbing
- Shodan integration (optional)
- Open port identification

#### SQL Injection Testing
- Error-based SQLi detection
- Union-based SQLi testing
- Time-based blind SQLi
- Boolean-based blind SQLi
- Multiple payload variations
- Database fingerprinting

#### XSS Detection
- Reflected XSS testing
- DOM-based XSS detection
- Stored XSS identification
- Multiple payload types
- Context-aware testing
- Filter bypass techniques

#### LFI Scanning
- Local File Inclusion detection
- Path traversal testing
- Common file access patterns
- Null byte injection
- Filter evasion techniques

#### CORS Misconfiguration
- Origin validation testing
- Wildcard origin detection
- Credential exposure checks
- Null origin handling
- Subdomain trust issues

#### VirusTotal Scan
- Domain reputation analysis
- Malware detection
- Threat intelligence
- Historical scan data
- Detection ratio from 70+ engines

#### Broken Link Checker
- Internal link validation
- External link checking
- HTTP status code analysis
- Redirect chain detection
- Response time measurement

#### DDoS Firewall Detection
- WAF identification (Cloudflare, Sucuri, etc.)
- Rate limiting detection
- Challenge page recognition
- Protection mechanism fingerprinting

### Utility Modules

#### Subnet Calculator
- Network range calculation
- CIDR notation support
- Usable host count
- Network and broadcast addresses
- IP range enumeration

#### WordPress Scanner
- Version detection
- Plugin enumeration
- Theme identification
- Common vulnerability checks
- Configuration file exposure

## Advanced Features

### 🔔 Notification Center

- **Real-Time Alerts**: Instant notifications for scan events
- **Smart Categorization**: Success, warning, error, and info messages
- **Timestamp Tracking**: Relative time display for all notifications
- **Actionable Items**: Click notifications to navigate to relevant pages
- **Mark as Read**: Individual or bulk notification management
- **Unread Counter**: Bell icon badge showing unread count

### 📄 Professional PDF Reports

- **Executive Summary**: High-level overview with security grade
- **Module-by-Module Findings**: Detailed results for each scan module
- **Vulnerability Details**: Severity ratings, confidence scores, and evidence
- **Proof-of-Concept**: Reproducible steps for discovered vulnerabilities
- **Remediation Guidance**: Actionable recommendations for fixes
- **Custom Branding**: Professional layout with ABSpider branding

### 🔄 Proxy Rotation

- **Multiple Proxy Support**: Configure unlimited proxy servers
- **Automatic Rotation**: Distribute requests across proxies
- **Rate Limit Avoidance**: Prevent IP-based blocking
- **Protocol Support**: HTTP, HTTPS, and SOCKS proxies
- **Health Checking**: Automatic proxy validation

### 📅 Scan Scheduling

- **Flexible Scheduling**: Daily, weekly, or monthly scans
- **Custom Time Selection**: Choose specific times for scans
- **Recurring Scans**: Automated continuous monitoring
- **Template-Based**: Use saved scan configurations
- **Browser-Dependent**: Requires browser tab to remain open

### 🧠 Intelligent Scanning

- **Target Analysis**: Automatic reconnaissance before scanning
- **Response Monitoring**: Real-time tracking of target health
- **Adaptive Load Balancing**: Automatic intensity adjustment
- **Stealth Detection**: WAF and rate limiting awareness
- **Server Optimization**: Tailored approaches for different servers
- **Performance Analytics**: Comprehensive metrics and recommendations

### 👤 User Profile Management

- **Avatar Support**: Upload custom profile pictures
- **User Statistics**: Scan counts, member duration, activity status
- **Comprehensive Settings**: Bio, role, and preference management
- **Security Features**: Password change, 2FA support (coming soon)
- **Data Management**: Export personal data, account deletion
- **Notification Preferences**: Granular control over alerts

### ⚙️ Application Settings

- **Theme Selection**: Light and dark mode support
- **Language Support**: Multi-language interface (coming soon)
- **Scanning Configuration**: Thread management, timeout settings, retry logic
- **Proxy & Network**: Advanced proxy configuration, custom user agents
- **Discord Webhooks**: Real-time notifications with testing
- **Data Management**: Export/import settings, scan history limits
- **API Integration**: Enhanced API key management with testing
- **Scan Profiles**: Quick, balanced, comprehensive, and stealth presets

## Reporting & Notifications

### PDF Report Generation

Reports include:
- Scan metadata (target, date, duration)
- Executive summary with overall security grade
- Detailed findings per module
- Vulnerability severity classification
- Evidence and proof-of-concept
- Remediation recommendations
- Appendix with technical details

### Discord Integration

- **Webhook Configuration**: Easy setup with testing
- **Scan Completion Alerts**: Instant notifications when scans finish
- **Vulnerability Alerts**: Critical findings sent immediately
- **Rich Embeds**: Formatted messages with color coding
- **Custom Messages**: Configurable notification content

### In-App Notifications

- **Toast Notifications**: Non-intrusive alerts for actions
- **Notification Center**: Centralized notification management
- **Launch Announcements**: Product updates and new features
- **System Messages**: Important platform announcements

## Security Features

### Data Protection

- **Client-Side Storage**: Scans stored in browser localStorage
- **Encrypted Communication**: HTTPS for all API requests
- **Secure Authentication**: Supabase magic link system
- **Row-Level Security**: Database access control per user
- **API Key Encryption**: Secure storage in Supabase database

### Privacy Considerations

- **No Server-Side Scan Storage**: Scans remain on your device
- **Optional API Keys**: Enhanced features without mandatory keys
- **Data Export**: Full control over your data
- **Account Deletion**: Complete data removal option

### Compliance Features

- **Legal Disclaimer**: Mandatory acceptance before use
- **Authorization Warnings**: Alerts for active scanning modules
- **Internal Target Detection**: Warnings for localhost/internal IPs
- **Audit Trail**: Scan history for compliance documentation

## Performance Optimization

### Scan Performance

- **Concurrent Execution**: Multi-threaded scanning (1-50 threads)
- **Smart Caching**: Reduce redundant API calls
- **Lazy Loading**: Load modules on-demand
- **Debounced Updates**: Efficient real-time updates
- **Worker Threads**: Background processing for heavy tasks

### UI Performance

- **React 18**: Concurrent rendering and automatic batching
- **Vite**: Lightning-fast HMR and optimized builds
- **Code Splitting**: Load only what's needed
- **Memoization**: Prevent unnecessary re-renders
- **Virtual Scrolling**: Handle large result sets efficiently

## Browser Compatibility

ABSpider Recon supports:
- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Opera (v76+)

**Note**: Some features may have limited support in older browsers.

## Limitations

### Browser-Based Constraints

- **CORS Restrictions**: Some targets may block cross-origin requests
- **Port Scanning**: Limited to browser-based connectivity checks
- **Rate Limiting**: Aggressive scans may trigger target defenses
- **Resource Limits**: Browser memory and CPU constraints
- **No Raw Sockets**: Cannot perform low-level network operations

### Scheduling Limitations

- **Browser Dependency**: Scheduled scans require browser tab open
- **No Background Execution**: Cannot run when browser is closed
- **Local Time**: Scheduling based on client timezone

## Future Features

Planned enhancements:
- Multi-language support
- Two-factor authentication
- Advanced reporting formats (JSON, CSV, XML)
- Collaborative scanning (team features)
- Custom module development
- Browser extension
- Mobile app
- API access for automation

---

For detailed usage instructions, see the [User Guide](./user-guide.md).

For API integration, see [API Integration Guide](./api-integration.md).
