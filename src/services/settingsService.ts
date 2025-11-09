interface Settings {
  discordWebhook: string;
  proxyList: string;
  defaultThreads: number;
  timeout: number;
}

const defaultSettings: Settings = {
  discordWebhook: '',
  proxyList: '',
  defaultThreads: 5,
  timeout: 30,
};

export const getSettings = (): Settings => {
  const stored = localStorage.getItem('abspider-settings');
  return stored ? JSON.parse(stored) : defaultSettings;
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem('abspider-settings', JSON.stringify(settings));
  console.log('[Settings] Saved successfully');
};

export const testDiscordWebhook = async (webhookUrl: string) => {
  console.log('[Discord Test] Sending test message to:', webhookUrl.substring(0, 50) + '...');

  const payload = {
    embeds: [{
      title: '✅ Webhook Test Successful',
      description: 'Your Discord webhook is configured correctly and ready to receive scan notifications!',
      color: 0x10B981,
      fields: [
        {
          name: '🔧 Configuration',
          value: 'ABSpider Recon Dashboard',
          inline: true,
        },
        {
          name: '⏰ Test Time',
          value: new Date().toLocaleString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ABSpider Recon Dashboard',
      },
    }],
    username: 'ABSpider Recon',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(webhookUrl, {
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
    console.error('[Discord Test] Error:', errorText);
    throw new Error(`Webhook test failed with status ${response.status}: ${errorText}`);
  }

  console.log('[Discord Test] ✓ Test message sent successfully');
  return true;
};