import { Scan } from './scanService';
import { getSettings } from './settingsService'; // Import getSettings from Supabase-backed service

export const sendDiscordWebhook = async (scan: Scan) => {
  try {
    const settings = await getSettings(); // Fetch settings from Supabase
    
    if (!settings.discordWebhook) {
      throw new Error('Discord webhook URL not configured in Settings');
    }

    console.log('[Discord Webhook] Preparing to send scan results');
    console.log('[Discord Webhook] Webhook URL:', settings.discordWebhook.substring(0, 50) + '...');

    const embed = {
      title: '🔍 ABSpider Reconnaissance Complete',
      description: `Scan completed for **${scan.target}**`,
      color: scan.status === 'completed' ? 0x06B6D4 : 0xEF4444,
      fields: [
        {
          name: '🎯 Target',
          value: scan.target,
          inline: true,
        },
        {
          name: '📊 Status',
          value: scan.status.toUpperCase(),
          inline: true,
        },
        {
          name: '🆔 Scan ID',
          value: scan.id,
          inline: false,
        },
        {
          name: '⏰ Started',
          value: new Date(scan.timestamp).toLocaleString(),
          inline: true,
        },
        {
          name: '✅ Completed',
          value: scan.completedAt ? new Date(scan.completedAt).toLocaleString() : 'N/A',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ABSpider Recon Dashboard',
      },
    };

    if (scan.results.geoip && scan.results.geoip.ip) {
      embed.fields.push({
        name: '🌍 Location',
        value: `${scan.results.geoip.city || 'Unknown'}, ${scan.results.geoip.country || 'Unknown'} (${scan.results.geoip.ip})`,
        inline: false,
      });
    }

    if (scan.results.headers) {
      const analysis = scan.results.headers._analysis;
      if (analysis) {
        embed.fields.push({
          name: '🔒 Security Headers',
          value: `${analysis.securityHeaders.present.length} present, ${analysis.securityHeaders.missing.length} missing`,
          inline: true,
        });
      }
    }

    if (scan.results.subdomains) {
      embed.fields.push({
        name: '🌐 Subdomains',
        value: `${scan.results.subdomains.subdomains.length} discovered`, // Corrected to access subdomains array
        inline: true,
      });
    }

    if (scan.results.ports) {
      const openPorts = scan.results.ports.filter((p: any) => p.status === 'open');
      embed.fields.push({
        name: '🔌 Open Ports',
        value: `${openPorts.length} found`,
        inline: true,
      });
    }

    if (scan.results.sqlinjection && scan.results.sqlinjection.vulnerable) {
      embed.fields.push({
        name: '⚠️ SQL Injection',
        value: `${scan.results.sqlinjection.vulnerabilities.length} vulnerabilities found`,
        inline: true,
      });
    }

    if (scan.results.xss && scan.results.xss.vulnerable) {
      embed.fields.push({
        name: '⚠️ XSS',
        value: `${scan.results.xss.vulnerabilities.length} vulnerabilities found`,
        inline: true,
      });
    }

    if (scan.errors && scan.errors.length > 0) {
      embed.fields.push({
        name: '⚠️ Errors',
        value: scan.errors.slice(0, 3).join('\n') || 'Some modules failed',
        inline: false,
      });
    }

    const payload = {
      embeds: [embed],
      username: 'ABSpider Recon',
    };

    console.log('[Discord Webhook] Sending payload...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(settings.discordWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[Discord Webhook] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Discord Webhook] Error response:', errorText);
      throw new Error(`Discord webhook failed with status ${response.status}: ${errorText}`);
    }

    console.log('[Discord Webhook] ✓ Successfully sent');
    return true;
  } catch (error: any) {
    console.error('[Discord Webhook] ✗ Failed:', error);
    throw new Error(`Failed to send Discord webhook: ${error.message}`);
  }
};