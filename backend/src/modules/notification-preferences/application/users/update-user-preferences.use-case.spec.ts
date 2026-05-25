import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import { UpdateUserPreferencesUseCase } from './update-user-preferences.use-case';

describe('UpdateUserPreferencesUseCase', () => {
  const mockUserRepo = {
    findById: jest.fn(),
  };
  const mockPrefRepo = {
    upsertUserPreference: jest.fn(),
    upsertQuietHours: jest.fn(),
  };
  const mockPolicyRepo = {
    findAll: jest.fn(),
  };
  const mockGetPrefs = {
    execute: jest.fn(),
  };
  const mockMetrics = {
    recordPreferenceUpdate: jest.fn(),
  };

  let useCase: UpdateUserPreferencesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateUserPreferencesUseCase(
      mockUserRepo as never,
      mockPrefRepo as never,
      mockPolicyRepo as never,
      mockGetPrefs as never,
      mockMetrics as never,
    );
    mockUserRepo.findById.mockResolvedValue({ id: 'user-07', region: Region.EU });
    mockPolicyRepo.findAll.mockResolvedValue([
      {
        notification_type: NotificationType.marketing,
        channel: Channel.sms,
        region: Region.EU,
        action: 'deny',
      },
    ]);
    mockGetPrefs.execute.mockResolvedValue({ user_id: 'user-07' });
  });

  it('should upsert preference when allowed', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-02', region: Region.US });
    mockPolicyRepo.findAll.mockResolvedValue([]);

    await useCase.execute('user-02', [
      {
        notification_type: NotificationType.marketing,
        channel: Channel.sms,
        enabled: true,
      },
    ]);

    expect(mockPrefRepo.upsertUserPreference).toHaveBeenCalled();
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
  });

  it('should be idempotent on double apply same change', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-03', region: Region.US });
    mockPolicyRepo.findAll.mockResolvedValue([]);
    const change = {
      notification_type: NotificationType.marketing,
      channel: Channel.email,
      enabled: false,
    };

    await useCase.execute('user-03', [change]);
    await useCase.execute('user-03', [change]);

    expect(mockPrefRepo.upsertUserPreference).toHaveBeenCalledTimes(2);
    expect(mockGetPrefs.execute).toHaveBeenCalledTimes(2);
  });
});
