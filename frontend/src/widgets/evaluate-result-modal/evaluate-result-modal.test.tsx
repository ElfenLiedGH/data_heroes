import { renderWithProviders } from '../../shared/test/render-with-providers';
import { getEvaluateReasonMessage } from '../../shared/hooks/use-app-snackbar';
import { EvaluateResultModal } from './EvaluateResultModal';

describe('EvaluateResultModal', () => {
  it('shows allow result with localized reason', () => {
    const { getByText } = renderWithProviders(
      <EvaluateResultModal open decision="allow" reason="allowed" onClose={() => {}} />,
    );
    expect(getByText(/Разрешено/)).toBeInTheDocument();
    expect(getByText(new RegExp(getEvaluateReasonMessage('allowed')))).toBeInTheDocument();
  });

  it('shows deny result with localized reason', () => {
    const { getByText } = renderWithProviders(
      <EvaluateResultModal
        open
        decision="deny"
        reason="blocked_by_global_policy"
        onClose={() => {}}
      />,
    );
    expect(getByText(/Запрещено/)).toBeInTheDocument();
    expect(
      getByText(new RegExp(getEvaluateReasonMessage('blocked_by_global_policy'))),
    ).toBeInTheDocument();
  });
});
