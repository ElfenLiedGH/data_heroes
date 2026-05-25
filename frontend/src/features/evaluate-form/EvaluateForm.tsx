import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, SelectField, TextField } from '@smwb/summer-ui';
import {
  useEvaluateNotificationMutation,
  type EvaluateBodyDto,
  type EvaluateResponseDto,
} from '../../shared/api/api';
import {
  CHANNELS,
  NOTIFICATION_TYPES,
  REGIONS,
  toSelectItems,
} from '../../shared/config/domain-options';
import { EvaluateResultModal } from '../../widgets/evaluate-result-modal/EvaluateResultModal';
import { getApiErrorMessage, useAppSnackbar } from '../../shared/hooks/use-app-snackbar';
import { UserSearchSelect } from './UserSearchSelect';
import styles from './EvaluateForm.module.less';

type EvaluateFormValues = {
  user_id: string;
  notification_type: EvaluateBodyDto['notification_type'];
  channel: EvaluateBodyDto['channel'];
  region: EvaluateBodyDto['region'];
  datetime: string;
};

const defaultValues: EvaluateFormValues = {
  user_id: 'user-01',
  notification_type: NOTIFICATION_TYPES[0] as EvaluateBodyDto['notification_type'],
  channel: CHANNELS[0] as EvaluateBodyDto['channel'],
  region: REGIONS[0] as EvaluateBodyDto['region'],
  datetime: '2026-05-21T12:00:00Z',
};

export function EvaluateForm() {
  const { control, handleSubmit } = useForm<EvaluateFormValues>({ defaultValues });
  const [evaluate, { isLoading }] = useEvaluateNotificationMutation();
  const { showSuccess, showError } = useAppSnackbar();
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState<EvaluateResponseDto | null>(null);

  const onSubmit = async (values: EvaluateFormValues) => {
    if (!values.user_id.trim()) return;
    try {
      const res = await evaluate({
        evaluateBodyDto: {
          user_id: values.user_id,
          notification_type: values.notification_type,
          channel: values.channel,
          region: values.region,
          datetime: values.datetime,
        },
      }).unwrap();
      setResult(res);
      setModalOpen(true);
      showSuccess('Проверка выполнена');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Ошибка проверки'));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Controller
          name="user_id"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <UserSearchSelect value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          name="notification_type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Notification type"
              value={field.value}
              items={toSelectItems(NOTIFICATION_TYPES)}
              onChange={(_e, data) =>
                field.onChange(String(data.value ?? '') as EvaluateBodyDto['notification_type'])
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
                field.onChange(String(data.value ?? '') as EvaluateBodyDto['channel'])
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
                field.onChange(String(data.value ?? '') as EvaluateBodyDto['region'])
              }
            />
          )}
        />
        <Controller
          name="datetime"
          control={control}
          render={({ field }) => (
            <TextField
              label="Datetime (ISO)"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Button type="submit" disabled={isLoading}>
          Проверить
        </Button>
      </form>
      <EvaluateResultModal
        open={modalOpen}
        decision={result?.decision ?? null}
        reason={result?.reason ?? null}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
