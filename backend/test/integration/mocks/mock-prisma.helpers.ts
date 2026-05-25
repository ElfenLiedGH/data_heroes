import type { Region } from '../../../generated/client';
import type { MockDb, UserWhere } from './mock-db.types';

export const SEED_TIMESTAMP = new Date('2026-05-25T10:00:00Z');

export function sortDefaultPreferences(items: MockDb['defaultPreferences']) {
  return [...items].sort((a, b) => {
    const regionA = a.region ?? '';
    const regionB = b.region ?? '';
    const regionCmp = regionA.localeCompare(regionB);
    if (regionCmp !== 0) return regionCmp;
    const typeCmp = a.notification_type.localeCompare(b.notification_type);
    if (typeCmp !== 0) return typeCmp;
    return a.channel.localeCompare(b.channel);
  });
}

export function filterUsersByWhere(
  users: Array<{ id: string; region: Region; created_at: Date }>,
  where?: UserWhere,
) {
  const term = where?.id?.contains?.toLowerCase();
  if (!term) return users;
  return users.filter((user) => user.id.toLowerCase().includes(term));
}

export function prismaNotFoundError() {
  const err = new Error('not found') as Error & { code: string };
  err.code = 'P2025';
  return err;
}

export function prismaUniqueError() {
  const err = new Error('unique') as Error & { code: string };
  err.code = 'P2002';
  return err;
}

export function prismaRestrictError() {
  const err = new Error('restrict') as Error & { code: string };
  err.code = 'P2003';
  return err;
}
