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

type UpdateFormValues = UpdateDefaultPreferenceBodyDto;

type CommonProps = {
  open: boolean;
  title: string;
  saving: boolean;
  onClose: () => void;
};

type CreateProps = CommonProps & {
  mode: 'create';
  onSubmit: (values: DefaultPreferenceBodyDto) => Promise<void>;
};

type UpdateProps = CommonProps & {
  mode: 'update';
  editing: DefaultPreferenceItemDto;
  onSubmit: (values: UpdateDefaultPreferenceBodyDto) => Promise<void>;
};

type Props = CreateProps | UpdateProps;

const NOTIFICATION_TYPE_ITEMS = toSelectItems(NOTIFICATION_TYPES);
const CHANNEL_ITEMS = toSelectItems(CHANNELS);
const REGION_ITEMS = [
  { text: 'Все регионы', value: ALL_REGIONS_VALUE },
  ...toSelectItems(REGIONS),
];

export function DefaultPreferenceFormModal(props: Props) {
  if (props.mode === 'update') {
    return <UpdateForm {...props} />;
  }
  return <CreateForm {...props} />;
}

function CreateForm({ open, title, saving, onClose, onSubmit }: CreateProps) {
  const { control, handleSubmit, reset } = useForm<CreateFormValues>({
    defaultValues: {
      regionChoice: ALL_REGIONS_VALUE,
      notification_type: 'transactional',
      channel: 'email',
      enabled: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        regionChoice: ALL_REGIONS_VALUE,
        notification_type: 'transactional',
        channel: 'email',
        enabled: true,
      });
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      region:
        values.regionChoice === ALL_REGIONS_VALUE
          ? null
          : (values.regionChoice as DefaultPreferenceBodyDto['region']),
      notification_type: values.notification_type,
      channel: values.channel,
      enabled: values.enabled,
    });
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className={styles.form}>
        <h2 className={styles.title}>{title}</h2>
        <Controller
          name="regionChoice"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Region"
              value={field.value}
              items={REGION_ITEMS}
              onChange={(_e, data) => field.onChange(String(data.value ?? ALL_REGIONS_VALUE))}
            />
          )}
        />
        <Controller
          name="notification_type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Notification type"
              value={field.value}
              items={NOTIFICATION_TYPE_ITEMS}
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
              items={CHANNEL_ITEMS}
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
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

function UpdateForm({ open, title, editing, saving, onClose, onSubmit }: UpdateProps) {
  const { control, handleSubmit, reset } = useForm<UpdateFormValues>({
    defaultValues: {
      notification_type: editing.notification_type,
      channel: editing.channel,
      enabled: editing.enabled,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        notification_type: editing.notification_type,
        channel: editing.channel,
        enabled: editing.enabled,
      });
    }
  }, [open, editing, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className={styles.form}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.regionReadonly}>Регион: {formatRegion(editing.region)}</p>
        <Controller
          name="notification_type"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Notification type"
              value={field.value}
              items={NOTIFICATION_TYPE_ITEMS}
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
              items={CHANNEL_ITEMS}
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
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

function FormActions({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return (
    <div className={styles.actions}>
      <Button type="button" variant="text" onClick={onClose} disabled={saving}>
        Отмена
      </Button>
      <Button type="submit" disabled={saving}>
        Сохранить
      </Button>
    </div>
  );
}
