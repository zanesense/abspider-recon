import { Scan } from './scanService';
import { getSettings } from './settingsService'; // Import getSettings from Supabase-backed service

export const sendDiscordWebhook = async (scan: Scan) => {
  try {
    const settings = await getSettings(); // Fetch settings from Supabase
    
    if (!settings.discordWebhook) {
      throw new Error('Discord webhook URL not configured in Settings');
    }

    let embedColor;
    switch (scan.status) {
      case 'completed': embedColor = 0x06B6D4; break; // Cyan
      case 'stopped': embedColor = 0xF59E0B; break; // Amber/Orange
      case 'failed': embedColor = 0xEF4444; break; // Red
      case 'running': embedColor = 0xFACC15; break; // Yellow
      case 'paused': embedColor = 0x3B82F6; break; // Blue
      default: embedColor = 0x808080; break; // Gray for unknown
    }

    const embed = {
      title: '🔍 ABSpider Reconnaissance Update', // Changed title to be more general
      description: `Scan **${scan.target}** has been **${scan.status.toUpperCase()}**`, // Updated description
      color: embedColor,
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
          name: '✅ Last Update', // Changed from Completed to Last Update
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
      // Directly use scan.results.headers as it contains the analysis
      const headersAnalysis = scan.results.headers; 
      if (headersAnalysis?.securityHeaders) {
        embed.fields.push({
          name: '🔒 Security Headers',
          value: `${headersAnalysis.securityHeaders.present.length} present, ${headersAnalysis.securityHeaders.missing.length} missing`,
          inline: true,
        });
      }
    }

    if (scan.results.subdomains) {
      embed.fields.push({
        name: '🌐 Subdomains',
        value: `${scan.results.subdomains.subdomains.length} discovered`,
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Discord Webhook] Error response:', errorText);
      throw new Error(`Discord webhook failed with status ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error: any) {
    console.error('[Discord Webhook] ✗ Failed:', error);
    throw new Error(`Failed to send Discord webhook: ${error.message}`, { cause: error });
  }
};