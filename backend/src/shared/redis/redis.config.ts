export const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const GLOBAL_POLICY_INVALIDATION_CHANNEL =
  process.env.GLOBAL_POLICY_INVALIDATION_CHANNEL ?? 'global-policies:invalidate';

export const GLOBAL_POLICY_CACHE_TTL_MS = (() => {
  const raw = process.env.GLOBAL_POLICY_CACHE_TTL_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10 * 60 * 1000;
})();
