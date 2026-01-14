# Configuration Guide

This guide covers all configuration options for ABSpider Recon, including environment setup, application settings, and advanced configurations.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Application Settings](#application-settings)
- [Proxy Configuration](#proxy-configuration)
- [Discord Webhooks](#discord-webhooks)
- [API Keys](#api-keys)
- [Scan Profiles](#scan-profiles)

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Getting Supabase Credentials

1. Visit [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Navigate to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**
5. Paste them into your `.env` file

### Optional Variables

```env
# Development Settings
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug

# Feature Flags
VITE_ENABLE_SCHEDULING=true
VITE_ENABLE_PROXY_ROTATION=true
```

## Supabase Setup

### Database Tables

Run this SQL in your Supabase SQL Editor to create required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Settings Table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- API Keys Table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

-- User Profiles Table (Optional)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create Policies for api_keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Create Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Email Templates

Configure email templates in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Customize the **Magic Link** template
3. Add your branding and styling

Example Magic Link template:

```html
<h2>Welcome to ABSpider Recon</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In to ABSpider</a></p>
<p>This link expires in 1 hour.</p>
```

## Application Settings

Access settings via the sidebar → **Settings** icon.

### User Preferences

#### Theme Settings
- **Theme**: Light or Dark mode
- **Auto Theme**: Follow system preferences (coming soon)
- **Accent Color**: Customize primary color (coming soon)

#### Language Settings
- **Language**: Interface language (English default, more coming soon)
- **Date Format**: Customize date display format
- **Timezone**: Set your timezone for scheduling

#### Default Scan Settings
- **Default Threads**: Set default thread count (1-50)
- **Default Timeout**: Request timeout in seconds (5-60)
- **Auto-Save Scans**: Automatically save completed scans
- **Scan History Limit**: Maximum scans to keep (10-1000)

### Scanning Configuration

#### Thread Management
```javascript
{
  "threads": 5,              // Concurrent requests (1-50)
  "requestDelay": 100,       // Delay between requests (ms)
  "retryAttempts": 3,        // Failed request retries
  "retryDelay": 1000         // Delay between retries (ms)
}
```

#### Timeout Settings
```javascript
{
  "connectionTimeout": 10000,  // Connection timeout (ms)
  "requestTimeout": 30000,     // Request timeout (ms)
  "scanTimeout": 300000        // Overall scan timeout (ms)
}
```

#### Advanced Options
```javascript
{
  "followRedirects": true,     // Follow HTTP redirects
  "maxRedirects": 5,           // Maximum redirect hops
  "validateSSL": true,         // Validate SSL certificates
  "userAgent": "custom-agent"  // Custom User-Agent string
}
```

## Proxy Configuration

### Adding Proxies

Navigate to **Settings** → **Proxy & Network**

#### Proxy Format

```
http://proxy1.example.com:8080
https://proxy2.example.com:3128
socks5://proxy3.example.com:1080
http://username:password@proxy4.example.com:8080
```

#### Proxy Configuration

```javascript
{
  "proxies": [
    "http://proxy1.example.com:8080",
    "http://proxy2.example.com:8080"
  ],
  "rotationStrategy": "round-robin",  // or "random"
  "proxyTimeout": 5000,                // Proxy connection timeout
  "validateProxies": true,             // Test proxies before use
  "fallbackToDirect": true             // Use direct connection if all proxies fail
}
```

### Testing Proxies

1. Add proxy URLs in settings
2. Click **Test Proxies** button
3. View results showing working/failed proxies
4. Save configuration

### Proxy Best Practices

- Use dedicated proxy services for reliability
- Rotate proxies to avoid rate limiting
- Test proxies regularly
- Monitor proxy performance
- Use authenticated proxies for better security

## Discord Webhooks

### Creating a Webhook

1. Open Discord and go to your server
2. Navigate to **Server Settings** → **Integrations**
3. Click **Create Webhook**
4. Name it "ABSpider Notifications"
5. Select the channel for notifications
6. Copy the webhook URL

### Configuring in ABSpider

1. Go to **Settings** → **Notifications**
2. Paste webhook URL in **Discord Webhook URL** field
3. Click **Test Webhook** to verify
4. Enable **Send Scan Completion Notifications**
5. Save settings

### Webhook Configuration

```javascript
{
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "enableNotifications": true,
  "notifyOnComplete": true,
  "notifyOnError": true,
  "notifyOnVulnerability": true,
  "minimumSeverity": "medium"  // low, medium, high, critical
}
```

### Notification Format

Discord messages include:
- Scan target and duration
- Modules executed
- Vulnerabilities found
- Severity breakdown
- Direct link to results

## API Keys

### Supported Services

Configure API keys in **Settings** → **API Integration**

#### Shodan
- **Purpose**: Enhanced port scanning and banner grabbing
- **Get Key**: [shodan.io/account](https://account.shodan.io/)
- **Free Tier**: 100 queries/month
- **Paid Plans**: Starting at $59/month

#### VirusTotal
- **Purpose**: Domain reputation and malware scanning
- **Get Key**: [virustotal.com/gui/join-us](https://www.virustotal.com/gui/join-us)
- **Free Tier**: 4 requests/minute
- **Paid Plans**: Starting at $10/month

#### SecurityTrails
- **Purpose**: Historical DNS data and subdomain discovery
- **Get Key**: [securitytrails.com/app/account/credentials](https://securitytrails.com/app/account/credentials)
- **Free Tier**: 50 queries/month
- **Paid Plans**: Starting at $99/month

#### BuiltWith
- **Purpose**: Technology stack detection
- **Get Key**: [builtwith.com/api](https://api.builtwith.com/)
- **Free Tier**: Limited
- **Paid Plans**: Starting at $295/month

#### OpenCage
- **Purpose**: Enhanced geocoding
- **Get Key**: [opencagedata.com/users/sign_up](https://opencagedata.com/users/sign_up)
- **Free Tier**: 2,500 requests/day
- **Paid Plans**: Starting at $50/month

#### Hunter.io
- **Purpose**: Email discovery
- **Get Key**: [hunter.io/api](https://hunter.io/api)
- **Free Tier**: 25 searches/month
- **Paid Plans**: Starting at $49/month

#### Clearbit
- **Purpose**: Company data enrichment
- **Get Key**: [clearbit.com/api](https://clearbit.com/api)
- **Free Tier**: Limited
- **Paid Plans**: Custom pricing

### Adding API Keys

1. Navigate to **Settings** → **API Integration**
2. Select the service
3. Enter your API key
4. Click **Test API Key** to verify
5. Save configuration

### API Key Security

⚠️ **Important Security Notice**

API keys are stored in your Supabase database but are accessible client-side. This means:

- Any XSS vulnerability could expose keys
- Browser extensions can access keys
- Physical access to your device exposes keys

**Recommendations:**
- Use test/development API keys only
- Never store production or paid API keys
- Rotate keys regularly
- Monitor API usage for anomalies
- Consider a backend proxy for production use

## Scan Profiles

### Predefined Profiles

#### Quick Scan
```javascript
{
  "name": "Quick Scan",
  "threads": 10,
  "timeout": 10,
  "modules": [
    "siteInfo",
    "headers",
    "techStack",
    "dns"
  ]
}
```

#### Balanced Scan
```javascript
{
  "name": "Balanced Scan",
  "threads": 5,
  "timeout": 30,
  "modules": [
    "siteInfo",
    "headers",
    "techStack",
    "whois",
    "dns",
    "subdomains",
    "ports"
  ]
}
```

#### Comprehensive Scan
```javascript
{
  "name": "Comprehensive Scan",
  "threads": 3,
  "timeout": 60,
  "modules": "all"
}
```

#### Stealth Scan
```javascript
{
  "name": "Stealth Scan",
  "threads": 1,
  "timeout": 45,
  "requestDelay": 2000,
  "useProxy": true,
  "modules": [
    "siteInfo",
    "headers",
    "dns",
    "whois"
  ]
}
```

### Creating Custom Profiles

1. Go to **New Scan**
2. Configure your desired settings
3. Click **Save as Template**
4. Name your profile
5. Use it for future scans

## Advanced Configuration

### Custom User Agents

```javascript
{
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
  ],
  "rotateUserAgents": true
}
```

### Request Headers

```javascript
{
  "customHeaders": {
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache"
  }
}
```

### CORS Bypass Configuration

```javascript
{
  "corsProxy": "https://cors-anywhere.herokuapp.com/",
  "fallbackProxies": [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?"
  ],
  "enableCorsWorkaround": true
}
```

## Troubleshooting Configuration

### Common Issues

**Supabase Connection Failed**
- Verify URL and anon key are correct
- Check project is not paused
- Ensure RLS policies are configured

**Proxies Not Working**
- Test proxy connectivity manually
- Verify proxy format is correct
- Check proxy authentication credentials
- Ensure proxy supports HTTPS

**Discord Webhook Failed**
- Verify webhook URL is complete
- Check channel permissions
- Test webhook in Discord settings
- Ensure webhook hasn't been deleted

**API Keys Not Working**
- Verify key is active and valid
- Check API rate limits
- Ensure correct service is selected
- Test key directly with service API

### Configuration Reset

To reset all settings to defaults:

1. Go to **Settings** → **Data Management**
2. Click **Reset to Defaults**
3. Confirm the action
4. Restart the application

### Export/Import Settings

**Export Settings:**
```javascript
// Settings → Data Management → Export Settings
// Downloads: abspider-settings-YYYY-MM-DD.json
```

**Import Settings:**
```javascript
// Settings → Data Management → Import Settings
// Upload previously exported JSON file
```

---

For usage instructions, see the [User Guide](./user-guide.md).

For troubleshooting, see [Troubleshooting Guide](./troubleshooting.md).
