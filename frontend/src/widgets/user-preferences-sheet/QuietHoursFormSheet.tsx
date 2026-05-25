import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Sheet, TextField, Toggle } from '@smwb/summer-ui';
import type { QuietHoursDto } from '../../shared/api/api';
import { useSheetPlacement } from '../../shared/hooks/use-sheet-placement';
import styles from './QuietHoursFormSheet.module.less';

const defaultValues: QuietHoursDto = {
  start_time: '22:00',
  end_time: '08:00',
  timezone: 'Europe/Moscow',
  enabled: true,
};

type Props = {
  open: boolean;
  title: string;
  initialValues?: QuietHoursDto;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: QuietHoursDto) => Promise<void>;
};

export function QuietHoursFormSheet({
  open,
  title,
  initialValues,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const sheetPlacement = useSheetPlacement('right');
  const isMobileSheet = sheetPlacement === 'bottom';
  const { control, handleSubmit, reset } = useForm<QuietHoursDto>({
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

  if (!open) return null;

  return (
    <Sheet
      isOpen={open}
      onClose={onClose}
      placement={sheetPlacement}
      resizable={isMobileSheet}
      size={isMobileSheet ? '75%' : '420px'}
    >
      <form onSubmit={submit} className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <Controller
          name="start_time"
          control={control}
          render={({ field }) => (
            <TextField
              label="Start"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="end_time"
          control={control}
          render={({ field }) => (
            <TextField
              label="End"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <TextField
              label="Timezone"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="enabled"
          control={control}
          render={({ field }) => (
            <Toggle
              checked={field.value}
              label="Enabled"
              onChange={(_e, checked) => field.onChange(checked)}
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
    </Sheet>
  );
}
