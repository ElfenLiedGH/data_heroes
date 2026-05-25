import { Button, Modal } from '@smwb/summer-ui';
import styles from './DeleteConfirmModal.module.less';

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} role="alertdialog" aria-labelledby="delete-confirm-title">
      <div className={styles.content}>
        <h2 id="delete-confirm-title">{title}</h2>
        <p>{description}</p>
        <div className={styles.actions}>
          <Button variant="text" disabled={loading} onClick={onClose}>
            Отмена
          </Button>
          <Button color="error" icon="delete" disabled={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
