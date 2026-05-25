import { getEvaluateReasonMessage } from '../hooks/use-app-snackbar';

describe('getEvaluateReasonMessage', () => {
  it('localizes known reasons', () => {
    expect(getEvaluateReasonMessage('blocked_by_quiet_hours')).toBe('Запрещено quiet hours');
  });

  it('returns raw reason for unknown values', () => {
    expect(getEvaluateReasonMessage('custom_reason')).toBe('custom_reason');
  });
});
