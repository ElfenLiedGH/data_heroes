const DEV_FALLBACK_KEY = 'dev-notification-prefs-key-7f3e9a2b';

export function resolveClientApiKey(): string {
  const key = import.meta.env.VITE_API_KEY;
  if (key) {
    return key;
  }
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_KEY environment variable is required in production builds');
  }
  return DEV_FALLBACK_KEY;
}
