import { useState } from 'react';
import {
  Button,
  Card,
  Message,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from '@smwb/summer-ui';
import {
  useCreateDefaultPreferenceMutation,
  useDeleteDefaultPreferenceMutation,
  useGetDefaultPreferencesCountQuery,
  useGetDefaultPreferencesQuery,
  useUpdateDefaultPreferenceMutation,
  type DefaultPreferenceBodyDto,
  type DefaultPreferenceItemDto,
  type UpdateDefaultPreferenceBodyDto,
} from '../../shared/api/api';
import { formatRegion } from '../../shared/lib/format-region';
import { DeleteConfirmModal } from '../../shared/ui/delete-confirm-modal/DeleteConfirmModal';
import { useOffsetPagination } from '../../shared/hooks/use-offset-pagination';
import { getApiErrorMessage, useAppSnackbar } from '../../shared/hooks/use-app-snackbar';
import { DefaultPreferenceFormModal } from '../../features/default-preference-form/DefaultPreferenceFormModal';
import styles from './DefaultPreferencesPage.module.less';

export function DefaultPreferencesPage() {
  const { page, limit, offset, limitOptions, onPrev, onNext, onLimitChange, resetPage } =
    useOffsetPagination();
  const { data, isLoading, error } = useGetDefaultPreferencesQuery({ offset, limit });
  const { data: countData } = useGetDefaultPreferencesCountQuery();
  const [createPreference, { isLoading: creating }] = useCreateDefaultPreferenceMutation();
  const [updatePreference, { isLoading: updating }] = useUpdateDefaultPreferenceMutation();
  const [deletePreference, { isLoading: deleting }] = useDeleteDefaultPreferenceMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DefaultPreferenceItemDto | null>(null);
  const [deletingItem, setDeletingItem] = useState<DefaultPreferenceItemDto | null>(null);
  const { showSuccess, showError } = useAppSnackbar();

  const totalCount = countData?.count ?? 0;
  const preferences = data?.preferences ?? [];
  const hasNextPage = offset + preferences.length < totalCount;

  const handleCreate = async (values: DefaultPreferenceBodyDto) => {
    try {
      await createPreference({ defaultPreferenceBodyDto: values }).unwrap();
      resetPage();
      showSuccess('Дефолтная настройка создана');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось создать дефолтную настройку'));
      throw err;
    }
  };

  const handleUpdate = async (values: UpdateDefaultPreferenceBodyDto) => {
    if (!editing) return;
    try {
      await updatePreference({ id: editing.id, updateDefaultPreferenceBodyDto: values }).unwrap();
      showSuccess('Дефолтная настройка обновлена');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось обновить дефолтную настройку'));
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deletePreference({ id: deletingItem.id }).unwrap();
      setDeletingItem(null);
      showSuccess('Дефолтная настройка удалена');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось удалить дефолтную настройку'));
    }
  };

  const saving = creating || updating;

  return (
    <Card>
      <div className={styles.header}>
        <h1 className={styles.title}>Дефолтные настройки</h1>
        <Button
          icon="add"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Добавить
        </Button>
      </div>
      {error && <Message severity="error">Ошибка загрузки дефолтных настроек</Message>}
      {!error && (
        <Table
          className={styles.table}
          isLoading={isLoading}
          paginationSettings={{
            page,
            limit,
            totalCount,
            onPrev: page > 1 ? onPrev : undefined,
            onNext: hasNextPage ? onNext : undefined,
            limitOptions,
            onLimitChange,
          }}
        >
          <TableHead>
            <TableRow>
              <TableHeadCell>Region</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Channel</TableHeadCell>
              <TableHeadCell>Enabled</TableHeadCell>
              <TableHeadCell cellAlign="right">Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && preferences.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>Нет дефолтных настроек</TableCell>
              </TableRow>
            )}
            {preferences.map((preference) => (
              <TableRow key={preference.id}>
                <TableCell>{formatRegion(preference.region, 'Все')}</TableCell>
                <TableCell>{preference.notification_type}</TableCell>
                <TableCell>{preference.channel}</TableCell>
                <TableCell>{preference.enabled ? 'on' : 'off'}</TableCell>
                <TableCell cellAlign="right">
                  <Button
                    variant="text"
                    icon="edit"
                    disabled={deleting}
                    aria-label="Редактировать"
                    onClick={() => {
                      setEditing(preference);
                      setFormOpen(true);
                    }}
                  />
                  <Button
                    variant="text"
                    icon="delete"
                    disabled={deleting}
                    aria-label="Удалить"
                    onClick={() => setDeletingItem(preference)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <DefaultPreferenceFormModal
        open={formOpen}
        title={editing ? 'Редактировать дефолтную настройку' : 'Новая дефолтная настройка'}
        editing={editing}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <DeleteConfirmModal
        open={!!deletingItem}
        title="Удалить дефолтную настройку?"
        description="Дефолтная настройка будет удалена без возможности восстановления."
        loading={deleting}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
