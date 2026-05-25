import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Modal, SelectField } from '@smwb/summer-ui';
import type { GlobalPolicyBodyDto } from '../../shared/api/api';
import {
  CHANNELS,
  NOTIFICATION_TYPES,
  REGIONS,
  toSelectItems,
} from '../../shared/config/domain-options';
import styles from './GlobalPolicyFormModal.module.less';

const defaultValues: GlobalPolicyBodyDto = {
  notification_type: 'marketing',
  channel: 'email',
  region: 'EU',
  action: 'deny',
  reason_code: 'blocked_by_global_policy',
};

type Props = {
  open: boolean;
  title: string;
  initialValues?: GlobalPolicyBodyDto;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: GlobalPolicyBodyDto) => Promise<void>;
};

export function GlobalPolicyFormModal({
  open,
  title,
  initialValues,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const { control, handleSubmit, reset } = useForm<GlobalPolicyBodyDto>({
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? defaultValues);
    }
  }, [open, initialValues, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset(initialValues ?? defaultValues);
        onClose();
      }}
    >
      <form onSubmit={submit} className={styles.form}>
        <h2 className={styles.title}>{title}</h2>
        <Controller
          name="notification_type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Notification type"
              value={field.value}
              items={toSelectItems(NOTIFICATION_TYPES)}
              onChange={(_e, data) =>
                field.onChange(String(data.value ?? '') as GlobalPolicyBodyDto['notification_type'])
              }
            />
          )}
        />
        <Controller
          name="channel"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Channel"
              value={field.value}
              items={toSelectItems(CHANNELS)}
              onChange={(_e, data) =>
                field.onChange(String(data.value ?? '') as GlobalPolicyBodyDto['channel'])
              }
            />
          )}
        />
        <Controller
          name="region"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Region"
              value={field.value}
              items={toSelectItems(REGIONS)}
              onChange={(_e, data) =>
                field.onChange(String(data.value ?? '') as GlobalPolicyBodyDto['region'])
              }
            />
          )}
        />
        <div className={styles.actions}>
          <Button type="button" variant="text" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
