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
  useCreateGlobalPolicyMutation,
  useDeleteGlobalPolicyMutation,
  useGetGlobalPoliciesCountQuery,
  useGetGlobalPoliciesQuery,
  useUpdateGlobalPolicyMutation,
  type GlobalPolicyBodyDto,
  type GlobalPolicyItemDto,
} from '../../shared/api/api';
import { DeleteConfirmModal } from '../../shared/ui/delete-confirm-modal/DeleteConfirmModal';
import { useOffsetPagination } from '../../shared/hooks/use-offset-pagination';
import { getApiErrorMessage, useAppSnackbar } from '../../shared/hooks/use-app-snackbar';
import { GlobalPolicyFormModal } from '../../features/global-policy-form/GlobalPolicyFormModal';
import styles from './GlobalPoliciesPage.module.less';

export function GlobalPoliciesPage() {
  const { page, limit, offset, limitOptions, onPrev, onNext, onLimitChange, resetPage } =
    useOffsetPagination();
  const { data, isLoading, error } = useGetGlobalPoliciesQuery({ offset, limit });
  const { data: countData } = useGetGlobalPoliciesCountQuery();
  const [createPolicy, { isLoading: creating }] = useCreateGlobalPolicyMutation();
  const [updatePolicy, { isLoading: updating }] = useUpdateGlobalPolicyMutation();
  const [deletePolicy, { isLoading: deleting }] = useDeleteGlobalPolicyMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GlobalPolicyItemDto | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<GlobalPolicyItemDto | null>(null);
  const { showSuccess, showError } = useAppSnackbar();

  const totalCount = countData?.count ?? 0;
  const policies = data?.policies ?? [];
  const hasNextPage = offset + policies.length < totalCount;

  const handleCreate = async (values: GlobalPolicyBodyDto) => {
    try {
      await createPolicy({ globalPolicyBodyDto: values }).unwrap();
      resetPage();
      showSuccess('Политика создана');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось создать политику'));
      throw err;
    }
  };

  const handleUpdate = async (values: GlobalPolicyBodyDto) => {
    if (!editing) return;
    try {
      await updatePolicy({ id: editing.id, globalPolicyBodyDto: values }).unwrap();
      showSuccess('Политика обновлена');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось обновить политику'));
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deletingPolicy) return;
    try {
      await deletePolicy({ id: deletingPolicy.id }).unwrap();
      setDeletingPolicy(null);
      showSuccess('Политика удалена');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось удалить политику'));
    }
  };

  const saving = creating || updating;

  return (
    <Card>
      <div className={styles.header}>
        <h1 className={styles.title}>Глобальные политики</h1>
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
      {error && <Message severity="error">Ошибка загрузки политик</Message>}
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
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Channel</TableHeadCell>
              <TableHeadCell>Region</TableHeadCell>
              <TableHeadCell>Action</TableHeadCell>
              <TableHeadCell>Reason</TableHeadCell>
              <TableHeadCell cellAlign="right">Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && policies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>Нет политик</TableCell>
              </TableRow>
            )}
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.notification_type}</TableCell>
                <TableCell>{policy.channel}</TableCell>
                <TableCell>{policy.region}</TableCell>
                <TableCell>{policy.action}</TableCell>
                <TableCell>{policy.reason_code}</TableCell>
                <TableCell cellAlign="right">
                  <Button
                    variant="text"
                    icon="edit"
                    disabled={deleting}
                    aria-label="Редактировать"
                    onClick={() => {
                      setEditing(policy);
                      setFormOpen(true);
                    }}
                  />
                  <Button
                    variant="text"
                    icon="delete"
                    disabled={deleting}
                    aria-label="Удалить"
                    onClick={() => setDeletingPolicy(policy)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <GlobalPolicyFormModal
        open={formOpen}
        title={editing ? 'Редактировать политику' : 'Новая политика'}
        initialValues={
          editing
            ? {
                notification_type: editing.notification_type,
                channel: editing.channel,
                region: editing.region,
                action: editing.action,
                reason_code: editing.reason_code,
              }
            : undefined
        }
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
      <DeleteConfirmModal
        open={!!deletingPolicy}
        title="Удалить политику?"
        description="Глобальная политика будет удалена без возможности восстановления."
        loading={deleting}
        onClose={() => setDeletingPolicy(null)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
