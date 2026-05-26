import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import { UpdateUserPreferencesUseCase } from './update-user-preferences.use-case';

describe('UpdateUserPreferencesUseCase', () => {
  const mockUserRepo = {
    findById: jest.fn(),
  };
  const mockPrefRepo = {
    applyUserChangesAtomically: jest.fn(),
  };
  const mockPolicyCache = {
    getByRegions: jest.fn(),
  };
  const mockGetPrefs = {
    execute: jest.fn(),
  };
  const mockMetrics = {
    recordPreferenceUpdate: jest.fn(),
  };
  const mockLogger = {
    event: jest.fn(),
  };

  let useCase: UpdateUserPreferencesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateUserPreferencesUseCase(
      mockUserRepo as never,
      mockPrefRepo as never,
      mockPolicyCache as never,
      mockGetPrefs as never,
      mockMetrics as never,
      mockLogger as never,
    );
    mockUserRepo.findById.mockResolvedValue({ id: 'user-07', region: Region.EU });
    mockPolicyCache.getByRegions.mockResolvedValue([
      {
        notification_type: NotificationType.marketing,
        channel: Channel.sms,
        region: Region.EU,
        action: 'deny',
      },
    ]);
    mockGetPrefs.execute.mockResolvedValue({ user_id: 'user-07' });
  });

  it('should apply preference change atomically when allowed', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-02', region: Region.US });
    mockPolicyCache.getByRegions.mockResolvedValue([]);

    await useCase.execute('user-02', [
      {
        notification_type: NotificationType.marketing,
        channel: Channel.sms,
        enabled: true,
      },
    ]);

    expect(mockPrefRepo.applyUserChangesAtomically).toHaveBeenCalledTimes(1);
    expect(mockPrefRepo.applyUserChangesAtomically).toHaveBeenCalledWith(
      'user-02',
      expect.objectContaining({
        changes: expect.arrayContaining([
          expect.objectContaining({ enabled: true, channel: Channel.sms }),
        ]),
      }),
    );
  });

  it('should throw 403 when global policy blocks enable', async () => {
    await expect(
      useCase.execute('user-07', [
        {
          notification_type: NotificationType.marketing,
          channel: Channel.sms,
          enabled: true,
        },
      ]),
    ).rejects.toMatchObject({
      response: { message: API_ERROR.BLOCKED_BY_GLOBAL_POLICY },
    });
    expect(mockPrefRepo.applyUserChangesAtomically).not.toHaveBeenCalled();
  });

  it('should be idempotent on double apply same change', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-03', region: Region.US });
    mockPolicyCache.getByRegions.mockResolvedValue([]);
    const change = {
      notification_type: NotificationType.marketing,
      channel: Channel.email,
      enabled: false,
    };

    await useCase.execute('user-03', [change]);
    await useCase.execute('user-03', [change]);

    expect(mockPrefRepo.applyUserChangesAtomically).toHaveBeenCalledTimes(2);
    expect(mockGetPrefs.execute).toHaveBeenCalledTimes(2);
  });
});
