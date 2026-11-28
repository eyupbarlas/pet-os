const env = (name: string): string => {
  const v = process.env[name];
  if (!v) console.warn(`[config] ${name} is not set. Copy apps/mobile/.env.example to .env.local.`);
  return v ?? '';
};

// Read each variable literally: Expo inlines process.env.EXPO_PUBLIC_* at build time.
export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  powersyncUrl: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  /** Base of invite links (and later care cards); served by apps/web. */
  webUrl: process.env.EXPO_PUBLIC_WEB_URL || 'https://healthypaw.app',
  isConfigured: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
};
void env;
