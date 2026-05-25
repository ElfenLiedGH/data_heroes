import { Card } from '@smwb/summer-ui';
import { EvaluateForm } from '../../features/evaluate-form/EvaluateForm';

export function EvaluatePage() {
  return (
    <Card>
      <h1>Проверка отправки</h1>
      <EvaluateForm />
    </Card>
  );
}
