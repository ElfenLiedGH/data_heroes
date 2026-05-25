const DEV_FALLBACK_KEY = 'dev-notification-prefs-key-7f3e9a2b';

export function resolveApiKey(): string {
  const key = process.env.API_KEY;
  if (key) {
   return key;
  }
  if (process.env.NODE_ENV === 'production') {
   throw new Error('API_KEY environment variable is required in production');
  }
  return DEV_FALLBACK_KEY;
}
