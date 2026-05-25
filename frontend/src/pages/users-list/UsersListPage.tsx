import { KeyboardEvent, useState } from 'react';
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
  useCreateUserMutation,
  useGetUsersCountQuery,
  useGetUsersQuery,
  type CreateUserBodyDto,
} from '../../shared/api/api';
import { useOffsetPagination } from '../../shared/hooks/use-offset-pagination';
import { getApiErrorMessage, useAppSnackbar } from '../../shared/hooks/use-app-snackbar';
import { CreateUserFormModal } from '../../features/create-user-form/CreateUserFormModal';
import {
  findPreference,
  PREFERENCE_COLUMNS,
} from '../../shared/ui/preference-source-badge/preference-catalog';
import { PreferenceSourceBadge } from '../../shared/ui/preference-source-badge/PreferenceSourceBadge';
import { UserPreferencesSheet } from '../../widgets/user-preferences-sheet/UserPreferencesSheet';
import styles from './UsersListPage.module.less';

export function UsersListPage() {
  const { page, limit, offset, limitOptions, onPrev, onNext, onLimitChange, resetPage } =
    useOffsetPagination();
  const { data, isLoading, error } = useGetUsersQuery({ offset, limit });
  const { data: countData } = useGetUsersCountQuery({});
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const { showSuccess, showError } = useAppSnackbar();

  const totalCount = countData?.count ?? 0;
  const users = data?.users ?? [];
  const hasNextPage = offset + users.length < totalCount;

  const handleCreateUser = async (values: CreateUserBodyDto) => {
    try {
      await createUser({ createUserBodyDto: values }).unwrap();
      resetPage();
      showSuccess('Пользователь создан');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось создать пользователя'));
      throw err;
    }
  };

  const openUser = (userId: string) => setSelectedUserId(userId);

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, userId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openUser(userId);
    }
  };

  return (
    <Card>
      <div className={styles.header}>
        <h1 className={styles.title}>Пользователи</h1>
        <Button icon="add" onClick={() => setCreateFormOpen(true)}>
          Добавить
        </Button>
      </div>
      {error && <Message severity="error">Ошибка загрузки списка пользователей</Message>}
      {!error && (
        <Table
          className={styles.table}
          isLoading={isLoading}
          stickyHeader
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
              <TableHeadCell>User ID</TableHeadCell>
              <TableHeadCell>Region</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              {PREFERENCE_COLUMNS.map((col) => (
                <TableHeadCell key={`${col.notification_type}-${col.channel}`}>
                  {col.label}
                </TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3 + PREFERENCE_COLUMNS.length}>Нет пользователей</TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow
                key={user.user_id}
                className={styles.clickableRow}
                tabIndex={0}
                role="button"
                aria-label={`Открыть настройки ${user.user_id}`}
                onClick={() => openUser(user.user_id)}
                onKeyDown={(e) => handleRowKeyDown(e, user.user_id)}
              >
                <TableCell>{user.user_id}</TableCell>
                <TableCell>{user.region}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                {PREFERENCE_COLUMNS.map((col) => {
                  const pref = findPreference(
                    user.preferences,
                    col.notification_type,
                    col.channel,
                  );
                  return (
                    <TableCell key={`${user.user_id}-${col.notification_type}-${col.channel}`}>
                      {pref ? (
                        <div className={styles.prefCell}>
                          <span className={styles.prefStatus}>{pref.enabled ? 'on' : 'off'}</span>
                          {pref.source && <PreferenceSourceBadge source={pref.source} />}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <UserPreferencesSheet
        userId={selectedUserId}
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
      <CreateUserFormModal
        open={createFormOpen}
        saving={creating}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateUser}
      />
    </Card>
  );
}
