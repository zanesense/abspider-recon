# API Integration Guide

Enhance ABSpider Recon's capabilities with third-party API integrations for deeper reconnaissance insights.

## Table of Contents

- [Overview](#overview)
- [Security Warning](#security-warning)
- [Shodan Integration](#shodan-integration)
- [VirusTotal Integration](#virustotal-integration)
- [SecurityTrails Integration](#securitytrails-integration)
- [BuiltWith Integration](#builtwith-integration)
- [OpenCage Integration](#opencage-integration)
- [Hunter.io Integration](#hunterio-integration)
- [Clearbit Integration](#clearbit-integration)
- [Testing API Keys](#testing-api-keys)
- [Best Practices](#best-practices)

## Overview

ABSpider Recon supports optional API integrations to enhance reconnaissance capabilities. These integrations provide:

- Enhanced port scanning and banner grabbing
- Domain reputation and malware detection
- Historical DNS data and subdomain discovery
- Technology stack detection
- Enhanced geocoding
- Email discovery and company data

**All API integrations are optional** - ABSpider works without them, but they provide additional data when configured.

## Security Warning

⚠️ **CRITICAL: Client-Side API Key Storage**

API keys are stored in your Supabase database but are **accessible client-side**. This means:

- Any XSS vulnerability could expose your keys
- Browser extensions can access keys
- Physical access to your device exposes keys
- Keys are transmitted to your browser

### Recommendations

✅ **DO**:
- Use test/development API keys only
- Create separate keys for ABSpider
- Set strict rate limits on keys
- Monitor API usage regularly
- Rotate keys frequently
- Use free tier keys when possible

❌ **DON'T**:
- Store production API keys
- Use paid/premium API keys
- Share keys with others
- Use keys with sensitive access
- Store keys with high limits

### Production Alternative

For production use, consider:
- Backend proxy for API calls
- Server-side key management
- API gateway with authentication
- Dedicated API service

## Shodan Integration

### What is Shodan?

Shodan is a search engine for Internet-connected devices. It provides:
- Enhanced port scanning data
- Banner grabbing information
- Service version detection
- Vulnerability information
- Historical scan data

### Getting a Shodan API Key

1. Visit [shodan.io](https://www.shodan.io/)
2. Create an account or log in
3. Navigate to [Account](https://account.shodan.io/)
4. Copy your API key

### Pricing

- **Free Tier**: 100 query credits/month
- **Membership**: $59/month (unlimited queries)
- **Small Business**: $299/month (additional features)
- **Enterprise**: Custom pricing

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **Shodan**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

When Shodan is configured:
- **Enhanced Port Scanning**: Detailed service information
- **Banner Grabbing**: Service banners and versions
- **Vulnerability Data**: Known vulnerabilities for services
- **Historical Data**: Previous scan results

### Example Usage

```javascript
// Port scanning with Shodan
{
  "port": 22,
  "service": "SSH",
  "banner": "SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5",
  "version": "OpenSSH 8.2p1",
  "vulnerabilities": [
    {
      "cve": "CVE-2021-41617",
      "severity": "medium"
    }
  ]
}
```

### Rate Limits

- Free: 1 query/second
- Paid: No rate limits

### Troubleshooting

**"API key invalid"**:
- Verify key is copied correctly
- Check account is active
- Ensure no extra spaces

**"Query credits exhausted"**:
- Free tier limit reached
- Wait for monthly reset
- Upgrade to paid plan

## VirusTotal Integration

### What is VirusTotal?

VirusTotal analyzes files and URLs for malware using 70+ antivirus engines. It provides:
- Domain reputation analysis
- Malware detection
- Threat intelligence
- Historical scan data
- Community comments

### Getting a VirusTotal API Key

1. Visit [virustotal.com](https://www.virustotal.com/)
2. Create an account
3. Go to [API Key](https://www.virustotal.com/gui/user/YOUR_USERNAME/apikey)
4. Copy your API key

### Pricing

- **Free**: 4 requests/minute, 500 requests/day
- **Premium**: Starting at $10/month (higher limits)
- **Enterprise**: Custom pricing

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **VirusTotal**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

- **Domain Reputation**: Malware detection scores
- **URL Analysis**: Malicious URL detection
- **Historical Data**: Previous scan results
- **Community Votes**: User-submitted ratings
- **Detection Ratio**: Engines detecting threats

### Example Usage

```javascript
// VirusTotal scan result
{
  "domain": "example.com",
  "detectionRatio": "2/70",
  "malicious": 2,
  "suspicious": 0,
  "clean": 68,
  "categories": ["phishing", "malware"],
  "lastAnalysis": "2025-01-14T10:30:00Z"
}
```

### Rate Limits

- Free: 4 requests/minute
- Premium: Higher limits based on plan

### Troubleshooting

**"Rate limit exceeded"**:
- Wait 1 minute between requests
- Reduce scan frequency
- Upgrade to premium

**"Invalid API key"**:
- Regenerate key in VirusTotal
- Copy entire key
- Check for typos

## SecurityTrails Integration

### What is SecurityTrails?

SecurityTrails provides historical DNS data and domain intelligence:
- Historical DNS records
- Subdomain discovery
- WHOIS history
- SSL certificate history
- Associated domains

### Getting a SecurityTrails API Key

1. Visit [securitytrails.com](https://securitytrails.com/)
2. Create an account
3. Navigate to [API Credentials](https://securitytrails.com/app/account/credentials)
4. Generate API key

### Pricing

- **Free**: 50 API calls/month
- **Startup**: $99/month (2,000 calls)
- **Professional**: $299/month (10,000 calls)
- **Enterprise**: Custom pricing

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **SecurityTrails**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

- **Historical DNS**: Past DNS records
- **Subdomain Discovery**: Comprehensive subdomain list
- **WHOIS History**: Historical registration data
- **Associated Domains**: Related domains

### Example Usage

```javascript
// SecurityTrails subdomain data
{
  "subdomains": [
    "www", "mail", "api", "dev", "staging",
    "admin", "blog", "shop", "cdn"
  ],
  "count": 9,
  "historical": true
}
```

### Rate Limits

- Free: 50 calls/month
- Paid: Based on plan

## BuiltWith Integration

### What is BuiltWith?

BuiltWith provides technology profiling:
- Web technologies used
- Analytics platforms
- Advertising networks
- Hosting providers
- CMS and frameworks

### Getting a BuiltWith API Key

1. Visit [builtwith.com](https://builtwith.com/)
2. Sign up for API access
3. Navigate to [API](https://api.builtwith.com/)
4. Purchase API credits

### Pricing

- **Basic**: $295/month (20,000 lookups)
- **Pro**: $495/month (100,000 lookups)
- **Enterprise**: Custom pricing

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **BuiltWith**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

- **Technology Detection**: Comprehensive tech stack
- **Analytics Tracking**: Marketing tools used
- **Hosting Information**: Infrastructure details
- **Historical Data**: Technology changes over time

## OpenCage Integration

### What is OpenCage?

OpenCage provides geocoding services:
- Forward geocoding
- Reverse geocoding
- Multiple languages
- Detailed location data

### Getting an OpenCage API Key

1. Visit [opencagedata.com](https://opencagedata.com/)
2. Sign up for free account
3. Navigate to [Dashboard](https://opencagedata.com/dashboard)
4. Copy API key

### Pricing

- **Free**: 2,500 requests/day
- **Starter**: $50/month (10,000 requests/day)
- **Standard**: $200/month (50,000 requests/day)
- **Pro**: Custom pricing

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **OpenCage**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

- **Enhanced Geocoding**: Detailed location data
- **Multiple Languages**: 50+ languages supported
- **Timezone Information**: Accurate timezone data
- **Address Formatting**: Localized address formats

## Hunter.io Integration

### What is Hunter.io?

Hunter.io provides email discovery:
- Email address finding
- Domain search
- Email verification
- Company information

### Getting a Hunter.io API Key

1. Visit [hunter.io](https://hunter.io/)
2. Create an account
3. Go to [API](https://hunter.io/api)
4. Copy your API key

### Pricing

- **Free**: 25 searches/month
- **Starter**: $49/month (500 searches)
- **Growth**: $99/month (2,500 searches)
- **Business**: $399/month (50,000 searches)

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **Hunter.io**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

- **Email Discovery**: Find email addresses
- **Domain Search**: All emails for domain
- **Email Verification**: Validate email addresses
- **Company Data**: Organization information

## Clearbit Integration

### What is Clearbit?

Clearbit provides business intelligence:
- Company data enrichment
- Logo API
- Business information
- Employee data

### Getting a Clearbit API Key

1. Visit [clearbit.com](https://clearbit.com/)
2. Sign up for account
3. Navigate to [API](https://clearbit.com/api)
4. Copy API key

### Pricing

- Custom pricing based on usage
- Contact sales for quote

### Configuration

1. Go to **Settings** → **API Integration**
2. Select **Clearbit**
3. Enter your API key
4. Click **Test API Key**
5. Save configuration

### Features Enabled

- **Company Enrichment**: Detailed business data
- **Logo Retrieval**: Company logos
- **Employee Information**: Team size and roles
- **Technology Stack**: Tools and platforms used

## Testing API Keys

### Test Process

1. Navigate to **Settings** → **API Integration**
2. Select service
3. Enter API key
4. Click **Test API Key**
5. Wait for validation

### Test Results

✅ **Success**:
```
API Key Valid
Service: Shodan
Rate Limit: 1 req/sec
Credits: 95/100
Status: Active
```

❌ **Failure**:
```
API Key Invalid
Error: Authentication failed
Please check your API key
```

### Manual Testing

Test keys directly with service APIs:

**Shodan**:
```bash
curl https://api.shodan.io/api-info?key=YOUR_API_KEY
```

**VirusTotal**:
```bash
curl -H "x-apikey: YOUR_API_KEY" \
  https://www.virustotal.com/api/v3/domains/example.com
```

**SecurityTrails**:
```bash
curl -H "APIKEY: YOUR_API_KEY" \
  https://api.securitytrails.com/v1/ping
```

## Best Practices

### Key Management

✅ **Do**:
- Create separate keys for ABSpider
- Use descriptive key names
- Document key purposes
- Set expiration dates
- Monitor usage regularly

❌ **Don't**:
- Share keys publicly
- Commit keys to Git
- Use same key everywhere
- Ignore usage alerts

### Rate Limiting

- Respect API rate limits
- Implement backoff strategies
- Cache results when possible
- Use batch operations
- Monitor quota usage

### Cost Management

- Start with free tiers
- Monitor API costs
- Set usage alerts
- Optimize API calls
- Consider caching strategies

### Security

- Rotate keys regularly (monthly)
- Use minimum required permissions
- Monitor for unauthorized use
- Revoke compromised keys immediately
- Enable IP restrictions when available

### Performance

- Cache API responses
- Batch requests when possible
- Use async operations
- Implement retry logic
- Handle errors gracefully

---

For configuration details, see [Configuration Guide](./configuration.md).

For security best practices, see [Security Guide](./security.md).
