import { Region } from '../../../../../generated/client';
import { PREFERENCE_SOURCE } from '../../../../shared/constants';
import {
  getSeedQuietHours,
  getSeedUserRegion,
  resolveSeedEffectivePreferences,
  SEED_PREFERENCE_SCENARIOS,
} from '../../../../shared/fixtures/seed-preferences.helper';
import {
  SEED_GLOBAL_POLICIES,
  SEED_USER_PREFERENCES,
  SEED_USER_QUIET_HOURS,
} from '../../../../shared/fixtures/seed-data.fixture';
import { GlobalPolicyCacheService } from '../global-policies/global-policy-cache.service';
import { UserPreferenceRepositoryPort } from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';
import { GetUserPreferencesUseCase } from './get-user-preferences.use-case';
import { UserPreferenceContextService } from './user-preference-context.service';

describe('GetUserPreferencesUseCase', () => {
  const mockUserRepo = {
    findById: jest.fn(),
  };
  const mockPrefRepo = {
    findUserPreferences: jest.fn(),
    findQuietHours: jest.fn(),
  };
  const mockPolicyCache = {
    getByRegions: jest.fn(),
  };

  let useCase: GetUserPreferencesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPolicyCache.getByRegions.mockImplementation((regions: Region[]) =>
      Promise.resolve(
        SEED_GLOBAL_POLICIES.map((p, i) => ({ ...p, id: `gp-${i}` })).filter((p) =>
          regions.includes(p.region),
        ),
      ),
    );
    const context = new UserPreferenceContextService(
      mockUserRepo as unknown as UserRepositoryPort,
      mockPrefRepo as unknown as UserPreferenceRepositoryPort,
      mockPolicyCache as unknown as GlobalPolicyCacheService,
    );
    useCase = new GetUserPreferencesUseCase(context);
  });

  describe.each(SEED_PREFERENCE_SCENARIOS)(
    'seed user $user_id ($description)',
    ({ user_id }) => {
      beforeEach(() => {
        mockUserRepo.findById.mockResolvedValue({
          id: user_id,
          region: getSeedUserRegion(user_id),
          created_at: new Date('2026-05-25T10:00:00Z'),
        });
        mockPrefRepo.findUserPreferences.mockResolvedValue(
          SEED_USER_PREFERENCES.filter((p) => p.user_id === user_id).map((p) => ({
            notification_type: p.notification_type,
            channel: p.channel,
            enabled: p.enabled,
            source: p.source,
          })),
        );
        mockPrefRepo.findQuietHours.mockResolvedValue(
          SEED_USER_QUIET_HOURS.find((q) => q.user_id === user_id) ?? null,
        );
      });

      it('should return effective preferences matching seed resolver', async () => {
        const result = await useCase.execute(user_id);
        const expected = resolveSeedEffectivePreferences(user_id);

        expect(result?.user_id).toBe(user_id);
        expect(result?.region).toBe(getSeedUserRegion(user_id));
        expect(result?.preferences).toEqual(expected);
      });

      it('should return quiet hours from seed or null', async () => {
        const result = await useCase.execute(user_id);
        expect(result?.quiet_hours).toEqual(getSeedQuietHours(user_id));
      });
    },
  );

  it('user-01 should have no source badges for copied defaults', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-01',
      region: Region.US,
      created_at: new Date(),
    });
    mockPrefRepo.findUserPreferences.mockResolvedValue(
      SEED_USER_PREFERENCES.filter((p) => p.user_id === 'user-01').map((p) => ({
        notification_type: p.notification_type,
        channel: p.channel,
        enabled: p.enabled,
        source: p.source,
      })),
    );
    mockPrefRepo.findQuietHours.mockResolvedValue(null);

    const result = await useCase.execute('user-01');
    expect(result?.preferences.every((p) => p.source === null)).toBe(true);
  });

  it('user-07 should expose blocked marketing sms for EU with global source', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-07',
      region: Region.EU,
      created_at: new Date(),
    });
    mockPrefRepo.findUserPreferences.mockResolvedValue(
      SEED_USER_PREFERENCES.filter((p) => p.user_id === 'user-07').map((p) => ({
        notification_type: p.notification_type,
        channel: p.channel,
        enabled: p.enabled,
        source: p.source,
      })),
    );
    mockPrefRepo.findQuietHours.mockResolvedValue(null);

    const result = await useCase.execute('user-07');
    const sms = result?.preferences.find(
      (p) => p.notification_type === 'marketing' && p.channel === 'sms',
    );
    expect(sms?.source).toBe(PREFERENCE_SOURCE.GLOBAL);
    expect(sms?.enabled).toBe(false);
    expect(sms?.blocked_by_global).toBe(true);
  });

  it('should return null when user not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute('missing-user');
    expect(result).toBeNull();
  });
});
