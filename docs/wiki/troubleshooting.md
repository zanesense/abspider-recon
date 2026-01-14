# Troubleshooting Guide

Common issues and solutions for ABSpider Recon.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Authentication Problems](#authentication-problems)
- [Scanning Issues](#scanning-issues)
- [Performance Problems](#performance-problems)
- [API Integration Issues](#api-integration-issues)
- [Browser Compatibility](#browser-compatibility)
- [Error Messages](#error-messages)

## Installation Issues

### Node.js Version Error

**Problem**: `Error: The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check your Node.js version
node --version

# Should be v18.0.0 or higher
# Update Node.js if needed
# Visit: https://nodejs.org/
```

### npm Install Fails

**Problem**: Dependencies fail to install

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Port 5000 Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Option 1: Kill process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:5000 | xargs kill -9

# Option 2: Use different port
# Edit vite.config.ts and change port number
```

### Build Errors

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
# Run type checking
npm run typecheck

# Fix reported errors
# Then rebuild
npm run build
```

## Authentication Problems

### Magic Link Not Received

**Problem**: Email with magic link doesn't arrive

**Solutions**:
1. Check spam/junk folder
2. Verify email address is correct
3. Wait 2-3 minutes (email may be delayed)
4. Check Supabase email settings
5. Verify Supabase project is active
6. Try different email address

### Magic Link Expired

**Problem**: `Link expired or already used`

**Solution**:
- Magic links expire after 1 hour
- Request a new magic link
- Click the link immediately after receiving
- Don't click the same link twice

### Session Expired

**Problem**: Logged out unexpectedly

**Solution**:
```javascript
// Sessions expire after 7 days by default
// Configure in Supabase:
// Authentication → Settings → JWT expiry
```

### Can't Access Protected Routes

**Problem**: Redirected to login despite being authenticated

**Solution**:
1. Clear browser cache and cookies
2. Log out and log in again
3. Check browser console for errors
4. Verify Supabase connection
5. Check RLS policies in Supabase

## Scanning Issues

### Scan Stuck at 0%

**Problem**: Scan starts but doesn't progress

**Solutions**:
1. Check browser console for errors
2. Verify target is accessible
3. Check internet connection
4. Disable browser extensions
5. Try different browser
6. Reduce thread count

### Target Not Reachable

**Problem**: `Error: Target is not accessible`

**Solutions**:
1. Verify target URL is correct
2. Check if target is online
3. Try with `https://` prefix
4. Check firewall settings
5. Verify DNS resolution
6. Try from different network

### CORS Errors

**Problem**: `Access to fetch blocked by CORS policy`

**Solutions**:
1. Enable CORS bypass in settings
2. Configure CORS proxy
3. Use proxy rotation
4. Target may block cross-origin requests
5. Some targets cannot be scanned from browser

### Scan Timeout

**Problem**: Scan times out before completing

**Solutions**:
1. Increase timeout in settings
2. Reduce number of modules
3. Lower thread count
4. Check target responsiveness
5. Try during off-peak hours

### Rate Limiting

**Problem**: `429 Too Many Requests`

**Solutions**:
1. Reduce thread count
2. Add request delay
3. Enable proxy rotation
4. Wait before retrying
5. Use stealth scan mode

### Incomplete Results

**Problem**: Some modules return no data

**Solutions**:
1. Check if target supports the feature
2. Verify API keys are configured
3. Check module-specific requirements
4. Review error logs
5. Try running module individually

## Performance Problems

### Slow Scan Speed

**Problem**: Scans take too long to complete

**Solutions**:
1. Increase thread count (up to 50)
2. Reduce timeout values
3. Disable unnecessary modules
4. Check internet speed
5. Close other browser tabs
6. Disable browser extensions

### Browser Freezing

**Problem**: Browser becomes unresponsive during scan

**Solutions**:
1. Reduce thread count
2. Close other tabs
3. Increase browser memory limit
4. Use Chrome/Edge (better performance)
5. Scan smaller targets
6. Disable heavy modules

### High Memory Usage

**Problem**: Browser uses too much RAM

**Solutions**:
1. Clear scan history regularly
2. Reduce concurrent scans
3. Lower thread count
4. Close unused tabs
5. Restart browser periodically

### Slow UI Response

**Problem**: Interface is laggy

**Solutions**:
1. Clear browser cache
2. Disable animations in settings
3. Reduce scan history limit
4. Use hardware acceleration
5. Update browser to latest version

## API Integration Issues

### Shodan API Not Working

**Problem**: Port scanning returns no enhanced data

**Solutions**:
1. Verify API key is correct
2. Check API key is active
3. Verify you have API credits
4. Test key at shodan.io
5. Check rate limits

### VirusTotal Timeout

**Problem**: VirusTotal scans timeout

**Solutions**:
1. Free tier has rate limits (4 req/min)
2. Wait between scans
3. Upgrade to paid plan
4. Check API key validity

### SecurityTrails No Results

**Problem**: Historical DNS data not loading

**Solutions**:
1. Verify API key
2. Check monthly quota
3. Target may have no historical data
4. Try different domain

### API Key Invalid

**Problem**: `Invalid API key` error

**Solutions**:
1. Copy key carefully (no spaces)
2. Regenerate key in service dashboard
3. Check key hasn't expired
4. Verify correct service selected
5. Test key with service's API directly

## Browser Compatibility

### Features Not Working in Safari

**Problem**: Some features don't work in Safari

**Solutions**:
- Safari has stricter security policies
- Use Chrome/Firefox for best experience
- Enable cross-site tracking in Safari settings
- Update Safari to latest version

### Extension Conflicts

**Problem**: Browser extensions interfere with ABSpider

**Solutions**:
1. Disable ad blockers
2. Disable privacy extensions
3. Disable security extensions
4. Try incognito/private mode
5. Whitelist ABSpider domain

### Mobile Browser Issues

**Problem**: Doesn't work well on mobile

**Solutions**:
- ABSpider is optimized for desktop
- Use desktop mode on mobile
- Some features unavailable on mobile
- Use desktop browser for best experience

## Error Messages

### "Failed to fetch"

**Cause**: Network connectivity issue

**Solutions**:
1. Check internet connection
2. Verify target is accessible
3. Check firewall settings
4. Try different network
5. Disable VPN temporarily

### "Supabase connection failed"

**Cause**: Cannot connect to Supabase

**Solutions**:
1. Verify `.env` file exists
2. Check Supabase URL and key
3. Verify project is not paused
4. Check Supabase status page
5. Try different network

### "Module execution failed"

**Cause**: Specific module encountered error

**Solutions**:
1. Check browser console for details
2. Verify target supports module
3. Check API keys if required
4. Try running module alone
5. Report bug if persistent

### "Storage quota exceeded"

**Cause**: Browser storage limit reached

**Solutions**:
1. Clear old scans
2. Export important data
3. Reduce scan history limit
4. Clear browser data
5. Use different browser profile

### "Invalid target format"

**Cause**: Target URL format incorrect

**Solutions**:
```
Valid formats:
✅ example.com
✅ www.example.com
✅ https://example.com
✅ 192.168.1.1

Invalid formats:
❌ example
❌ http://example
❌ example.com/path (use base domain)
```

### "Unauthorized access"

**Cause**: Authentication issue

**Solutions**:
1. Log out and log in again
2. Clear browser cookies
3. Check session hasn't expired
4. Verify Supabase RLS policies
5. Contact support if persistent

## Database Issues

### RLS Policy Errors

**Problem**: `new row violates row-level security policy`

**Solution**:
```sql
-- Verify policies exist
SELECT * FROM pg_policies 
WHERE tablename IN ('user_settings', 'api_keys');

-- Recreate policies if missing
-- See configuration.md for SQL
```

### Data Not Saving

**Problem**: Settings or scans don't persist

**Solutions**:
1. Check browser localStorage
2. Verify Supabase connection
3. Check RLS policies
4. Clear browser cache
5. Try different browser

### Migration Errors

**Problem**: Database schema out of date

**Solution**:
```sql
-- Check current schema
\d user_settings
\d api_keys

-- Run migrations from configuration.md
-- Backup data first!
```

## Proxy Issues

### Proxy Connection Failed

**Problem**: Cannot connect through proxy

**Solutions**:
1. Verify proxy URL format
2. Test proxy manually
3. Check proxy authentication
4. Verify proxy supports HTTPS
5. Try different proxy

### Proxy Rotation Not Working

**Problem**: All requests use same IP

**Solutions**:
1. Verify multiple proxies configured
2. Check rotation strategy setting
3. Test each proxy individually
4. Verify proxies are active
5. Check proxy pool size

## Discord Webhook Issues

### Webhook Not Sending

**Problem**: No notifications received

**Solutions**:
1. Verify webhook URL is complete
2. Test webhook in Discord settings
3. Check channel permissions
4. Verify webhook hasn't been deleted
5. Check Discord server status

### Webhook Format Error

**Problem**: `Invalid webhook format`

**Solution**:
```
Correct format:
https://discord.com/api/webhooks/ID/TOKEN

Common mistakes:
- Missing https://
- Incomplete URL
- Extra spaces
- Wrong domain
```

## Getting Help

### Collecting Debug Information

Before reporting issues:

1. **Browser Console**:
   - Press F12
   - Go to Console tab
   - Copy error messages

2. **Network Tab**:
   - Press F12
   - Go to Network tab
   - Reproduce issue
   - Check failed requests

3. **System Information**:
   - Browser version
   - Operating system
   - Node.js version (for dev)
   - ABSpider version

### Reporting Bugs

Include in bug reports:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Error messages
- Screenshots
- System information

### Community Support

- GitHub Issues: [github.com/zanesense/abspider-recon/issues](https://github.com/zanesense/abspider-recon/issues)
- GitHub Discussions: [github.com/zanesense/abspider-recon/discussions](https://github.com/zanesense/abspider-recon/discussions)

### Emergency Fixes

**Complete Reset**:
```javascript
// Clear all data (use with caution!)
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

**Factory Reset**:
1. Go to Settings → Data Management
2. Click "Reset to Defaults"
3. Confirm action
4. Log out and log in

---

Still having issues? [Open an issue on GitHub](https://github.com/zanesense/abspider-recon/issues/new).
