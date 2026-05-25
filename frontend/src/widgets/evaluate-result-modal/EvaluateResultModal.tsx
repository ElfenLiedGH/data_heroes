import { Button, Modal, Message } from '@smwb/summer-ui';
import { getEvaluateReasonMessage } from '../../shared/hooks/use-app-snackbar';
import styles from './EvaluateResultModal.module.less';

type Props = {
  open: boolean;
  decision: string | null;
  reason: string | null;
  onClose: () => void;
};

export function EvaluateResultModal({ open, decision, reason, onClose }: Props) {
  const reasonLabel = getEvaluateReasonMessage(reason);

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.content}>
        <h2>Результат проверки</h2>
        {decision && (
          <Message severity={decision === 'allow' ? 'success' : 'error'}>
            {decision === 'allow' ? 'Разрешено' : 'Запрещено'}
            {reasonLabel ? `: ${reasonLabel}` : ''}
          </Message>
        )}
        <div className={styles.actions}>
          <Button onClick={onClose}>ОК</Button>
        </div>
      </div>
    </Modal>
  );
}
