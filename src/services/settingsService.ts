import { supabase } from '@/SupabaseClient';

export interface Settings {
  discordWebhook: string;
  proxyList: string;
  defaultThreads: number;
  timeout: number;
}

const defaultSettings: Settings = {
  discordWebhook: '',
  proxyList: '',
  defaultThreads: 20,
  timeout: 30,
};

// Define the structure for the Supabase table row
interface UserSettingsRow {
  user_id: string;
  settings: Settings;
}

export const getSettings = async (): Promise<Settings> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      console.warn('[Settings] No active session, returning default settings.');
      return defaultSettings;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found', which is fine
      throw error;
    }

    return data?.settings || defaultSettings;
  } catch (error: any) {
    console.error('[Settings] Failed to load from Supabase:', error.message);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: Settings) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      throw new Error('No active user session to save settings.');
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: session.user.id, settings: settings } as UserSettingsRow, {
        onConflict: 'user_id',
      });

    if (error) throw error;

    console.log('[Settings] Saved successfully to Supabase');
  } catch (error: any) {
    console.error('[Settings] Failed to save to Supabase:', error.message);
    throw new Error(`Failed to save settings: ${error.message}`);
  }
};

// New validation function for Discord webhook URL
export const isValidDiscordWebhookUrl = (url: string): boolean => {
  if (!url) return false;
  // Regex to match valid Discord webhook URLs
  const discordWebhookRegex = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/;
  return discordWebhookRegex.test(url);
};

export const testDiscordWebhook = async (webhookUrl: string) => {
  console.log('[Discord Test] Sending test message to:', webhookUrl.substring(0, 50) + '...');

  // Validate the URL before sending
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    throw new Error('Invalid Discord webhook URL format. Please ensure it is a valid Discord webhook URL.');
  }

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