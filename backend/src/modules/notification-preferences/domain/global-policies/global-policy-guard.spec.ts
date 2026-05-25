import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { SEED_GLOBAL_POLICIES } from '../../../../shared/fixtures/seed-data.fixture';
import { GlobalPolicyGuard } from './global-policy-guard';

describe('GlobalPolicyGuard', () => {
  const globalPolicies = SEED_GLOBAL_POLICIES.map((p) => ({ ...p, id: 'policy-seed' }));

  it('should allow enable when no policy matches', () => {
    expect(
      GlobalPolicyGuard.canEnablePreference(
        Region.US,
        NotificationType.marketing,
        Channel.sms,
        globalPolicies,
      ),
    ).toBe(true);
  });

  it('should deny enable for EU marketing sms', () => {
    expect(
      GlobalPolicyGuard.canEnablePreference(
        Region.EU,
        NotificationType.marketing,
        Channel.sms,
        globalPolicies,
      ),
    ).toBe(false);
  });
});
