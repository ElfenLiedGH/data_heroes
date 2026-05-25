import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Modal, SelectField, TextField } from '@smwb/summer-ui';
import type { CreateUserBodyDto } from '../../shared/api/api';
import { REGIONS, toSelectItems } from '../../shared/config/domain-options';
import styles from './CreateUserFormModal.module.less';

const defaultValues: CreateUserBodyDto = {
  user_id: '',
  region: 'EU',
};

type Props = {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserBodyDto) => Promise<void>;
};

export function CreateUserFormModal({ open, saving, onClose, onSubmit }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserBodyDto>({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    if (!values.user_id.trim()) return;
    await onSubmit({ ...values, user_id: values.user_id.trim() });
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset(defaultValues);
        onClose();
      }}
    >
      <form onSubmit={submit} className={styles.form}>
        <h2 className={styles.title}>Новый пользователь</h2>
        <Controller
          name="user_id"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              label="User ID"
              value={field.value}
              error={!!errors.user_id}
              helperText={errors.user_id ? 'Обязательное поле' : undefined}
              onChange={(e) => field.onChange(e.target.value)}
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
                field.onChange(String(data.value ?? '') as CreateUserBodyDto['region'])
              }
            />
          )}
        />
        <div className={styles.actions}>
          <Button type="button" variant="text" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
}
