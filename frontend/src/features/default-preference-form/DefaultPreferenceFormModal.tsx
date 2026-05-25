import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Modal, SelectField, Toggle } from '@smwb/summer-ui';
import type {
  DefaultPreferenceBodyDto,
  DefaultPreferenceItemDto,
  UpdateDefaultPreferenceBodyDto,
} from '../../shared/api/api';
import {
  ALL_REGIONS_VALUE,
  CHANNELS,
  NOTIFICATION_TYPES,
  REGIONS,
  toSelectItems,
} from '../../shared/config/domain-options';
import { formatRegion } from '../../shared/lib/format-region';
import styles from './DefaultPreferenceFormModal.module.less';

type CreateFormValues = {
  regionChoice: string;
  notification_type: DefaultPreferenceBodyDto['notification_type'];
  channel: DefaultPreferenceBodyDto['channel'];
  enabled: boolean;
};

type Props = {
  open: boolean;
  title: string;
  editing?: DefaultPreferenceItemDto | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (values: DefaultPreferenceBodyDto) => Promise<void>;
  onUpdate: (values: UpdateDefaultPreferenceBodyDto) => Promise<void>;
};

export function DefaultPreferenceFormModal({
  open,
  title,
  editing,
  saving,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const { control, handleSubmit, reset } = useForm<
    CreateFormValues | UpdateDefaultPreferenceBodyDto
  >();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        notification_type: editing.notification_type,
        channel: editing.channel,
        enabled: editing.enabled,
      });
      return;
    }
    reset({
      regionChoice: ALL_REGIONS_VALUE,
      notification_type: 'transactional',
      channel: 'email',
      enabled: true,
    });
  }, [open, editing, reset]);

  const submit = handleSubmit(async (values) => {
    if (editing) {
      await onUpdate(values as UpdateDefaultPreferenceBodyDto);
    } else {
      const createValues = values as CreateFormValues;
      await onCreate({
        region:
          createValues.regionChoice === ALL_REGIONS_VALUE
            ? null
            : (createValues.regionChoice as DefaultPreferenceBodyDto['region']),
        notification_type: createValues.notification_type,
        channel: createValues.channel,
        enabled: createValues.enabled,
      });
    }
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className={styles.form}>
        <h2 className={styles.title}>{title}</h2>
        {editing ? (
          <p className={styles.regionReadonly}>Регион: {formatRegion(editing.region)}</p>
        ) : (
          <Controller
            name="regionChoice"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Region"
                value={field.value}
                items={[
                  { text: 'Все регионы', value: ALL_REGIONS_VALUE },
                  ...toSelectItems(REGIONS),
                ]}
                onChange={(_e, data) => field.onChange(String(data.value ?? ALL_REGIONS_VALUE))}
              />
            )}
          />
        )}
        <Controller
          name="notification_type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Notification type"
              value={field.value}
              items={toSelectItems(NOTIFICATION_TYPES)}
              onChange={(_e, data) =>
                field.onChange(
                  String(data.value ?? '') as DefaultPreferenceBodyDto['notification_type'],
                )
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
                field.onChange(String(data.value ?? '') as DefaultPreferenceBodyDto['channel'])
              }
            />
          )}
        />
        <Controller
          name="enabled"
          control={control}
          render={({ field }) => (
            <Toggle
              label="Enabled"
              checked={field.value}
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
    </Modal>
  );
}
