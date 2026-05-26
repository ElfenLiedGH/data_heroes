import { Channel, NotificationType, PolicyAction, Region } from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  makeGlobalPolicy,
  makeQuietHours,
  makeUserPreference,
} from '../../../../shared/test/factories';
import { EvaluateNotificationUseCase } from './evaluate-notification.use-case';

type AnyMock = jest.Mock;

function makeUseCase(overrides?: { contextLoad?: AnyMock }) {
  const contextLoad = overrides?.contextLoad ?? jest.fn();
  const contextService = { load: contextLoad } as unknown as ConstructorParameters<
    typeof EvaluateNotificationUseCase
  >[0];
  const evaluationRepository = {
    create: jest.fn().mockResolvedValue(undefined),
  } as unknown as ConstructorParameters<typeof EvaluateNotificationUseCase>[1];
  const metricsService = {
    recordEvaluation: jest.fn(),
  } as unknown as ConstructorParameters<typeof EvaluateNotificationUseCase>[2];
  const logger = {
    event: jest.fn(),
  } as unknown as ConstructorParameters<typeof EvaluateNotificationUseCase>[3];

  const useCase = new EvaluateNotificationUseCase(
    contextService,
    evaluationRepository,
    metricsService,
    logger,
  );

  return { useCase, contextLoad, evaluationRepository, metricsService, logger };
}

const baseInput = {
  user_id: 'user-01',
  notification_type: NotificationType.marketing,
  channel: Channel.email,
  region: Region.US,
  datetime: '2026-05-26T10:00:00Z',
};

const makeContext = (overrides: {
  userId?: string;
  region?: Region;
  prefs?: ReturnType<typeof makeUserPreference>[];
  policies?: ReturnType<typeof makeGlobalPolicy>[];
  quietHours?: ReturnType<typeof makeQuietHours> | null;
}) => ({
  user: { id: overrides.userId ?? 'user-01', region: overrides.region ?? Region.US },
  userPreferences: overrides.prefs ?? [],
  globalPolicies: overrides.policies ?? [],
  quietHours: overrides.quietHours ?? null,
});

describe('EvaluateNotificationUseCase', () => {
  it('throws ApiNotFoundException when user is missing', async () => {
    const { useCase, contextLoad } = makeUseCase();
    contextLoad.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toMatchObject({
      response: { message: API_ERROR.USER_NOT_FOUND, status_code: 404 },
    });
  });

  it('returns allow when user pref enabled and no policy blocks', async () => {
    const { useCase, contextLoad, evaluationRepository, metricsService, logger } = makeUseCase();
    contextLoad.mockResolvedValue(
      makeContext({
        prefs: [
          makeUserPreference({
            user_id: 'user-01',
            notification_type: NotificationType.marketing,
            channel: Channel.email,
            enabled: true,
          }),
        ],
      }),
    );

    const result = await useCase.execute(baseInput);

    expect(result).toEqual({ decision: 'allow', reason: 'allowed' });
    expect(evaluationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'allow', reason: 'allowed', global_policy_id: null }),
    );
    expect(metricsService.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'allow' }),
    );
    expect(logger.event).toHaveBeenCalledWith(
      'INFO',
      'notification.evaluated',
      expect.objectContaining({ 'evaluation.decision': 'allow' }),
    );
  });

  it('returns deny with blocked_by_global_policy when policy denies', async () => {
    const { useCase, contextLoad, evaluationRepository } = makeUseCase();
    contextLoad.mockResolvedValue(
      makeContext({
        region: Region.EU,
        prefs: [
          makeUserPreference({
            user_id: 'user-01',
            notification_type: NotificationType.marketing,
            channel: Channel.sms,
            enabled: true,
          }),
        ],
        policies: [
          makeGlobalPolicy({
            id: 'gp-1',
            notification_type: NotificationType.marketing,
            channel: Channel.sms,
            region: Region.EU,
            action: PolicyAction.deny,
          }),
        ],
      }),
    );

    const result = await useCase.execute({
      ...baseInput,
      region: Region.EU,
      channel: Channel.sms,
    });

    expect(result).toEqual({ decision: 'deny', reason: 'blocked_by_global_policy' });
    expect(evaluationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ global_policy_id: 'gp-1' }),
    );
  });

  it('returns deny with blocked_by_quiet_hours for marketing during quiet window', async () => {
    const { useCase, contextLoad } = makeUseCase();
    contextLoad.mockResolvedValue(
      makeContext({
        prefs: [
          makeUserPreference({
            user_id: 'user-01',
            notification_type: NotificationType.marketing,
            channel: Channel.email,
            enabled: true,
          }),
        ],
        quietHours: makeQuietHours({
          user_id: 'user-01',
          start_time: '22:00',
          end_time: '08:00',
          timezone: 'UTC',
        }),
      }),
    );

    const result = await useCase.execute({
      ...baseInput,
      datetime: '2026-05-26T23:30:00Z',
    });

    expect(result).toEqual({ decision: 'deny', reason: 'blocked_by_quiet_hours' });
  });

  it('returns deny disabled_by_user_preference when pref exists but disabled', async () => {
    const { useCase, contextLoad } = makeUseCase();
    contextLoad.mockResolvedValue(
      makeContext({
        prefs: [
          makeUserPreference({
            user_id: 'user-01',
            notification_type: NotificationType.marketing,
            channel: Channel.email,
            enabled: false,
          }),
        ],
      }),
    );

    const result = await useCase.execute(baseInput);

    expect(result).toEqual({ decision: 'deny', reason: 'disabled_by_user_preference' });
  });

  it('returns deny disabled_by_default when no preference row exists', async () => {
    const { useCase, contextLoad } = makeUseCase();
    contextLoad.mockResolvedValue(makeContext({}));

    const result = await useCase.execute(baseInput);

    expect(result).toEqual({ decision: 'deny', reason: 'disabled_by_default' });
  });
});
