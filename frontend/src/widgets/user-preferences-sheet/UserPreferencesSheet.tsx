import {
  useDeleteUserMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  type PreferenceItemDto,
  type QuietHoursDto,
} from '../../shared/api/api';
import {
  Button,
  Message,
  Modal,
  Sheet,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Toggle,
} from '@smwb/summer-ui';
import { PreferenceSourceBadge } from '../../shared/ui/preference-source-badge/PreferenceSourceBadge';
import { getApiErrorMessage, useAppSnackbar } from '../../shared/hooks/use-app-snackbar';
import { useSheetPlacement } from '../../shared/hooks/use-sheet-placement';
import { useState } from 'react';
import { QuietHoursFormSheet } from './QuietHoursFormSheet';
import styles from './UserPreferencesSheet.module.less';

type Props = {
  userId: string | null;
  open: boolean;
  onClose: () => void;
};

export function UserPreferencesSheet({ userId, open, onClose }: Props) {
  const sheetPlacement = useSheetPlacement('right');
  const isMobileSheet = sheetPlacement === 'bottom';
  const { data, isLoading, error } = useGetUserPreferencesQuery(
    { userId: userId! },
    { skip: !userId },
  );
  const [updatePrefs, { isLoading: saving }] = useUpdateUserPreferencesMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [quietHoursSheetOpen, setQuietHoursSheetOpen] = useState(false);
  const [editingQuietHours, setEditingQuietHours] = useState<QuietHoursDto | null>(null);
  const [deleteQuietHoursConfirmOpen, setDeleteQuietHoursConfirmOpen] = useState(false);
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);
  const { showSuccess, showError } = useAppSnackbar();

  const handleToggle = async (pref: PreferenceItemDto, enabled: boolean) => {
    if (!userId) return;
    try {
      await updatePrefs({
        userId,
        updateUserPreferencesBodyDto: {
          changes: [
            {
              notification_type: pref.notification_type,
              channel: pref.channel,
              enabled,
            },
          ],
        },
      }).unwrap();
      showSuccess('Настройка обновлена');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось обновить настройку'));
    }
  };

  const handleSaveQuietHours = async (quietHours: QuietHoursDto) => {
    if (!userId) return;
    try {
      await updatePrefs({
        userId,
        updateUserPreferencesBodyDto: {
          changes: [],
          quiet_hours: quietHours,
        },
      }).unwrap();
      showSuccess(editingQuietHours ? 'Quiet hours обновлены' : 'Quiet hours добавлены');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось сохранить quiet hours'));
      throw err;
    }
  };

  const handleDeleteQuietHours = async () => {
    if (!userId) return;
    try {
      await updatePrefs({
        userId,
        updateUserPreferencesBodyDto: {
          changes: [],
          quiet_hours: null,
        },
      }).unwrap();
      setDeleteQuietHoursConfirmOpen(false);
      showSuccess('Quiet hours удалены');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось удалить quiet hours'));
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    try {
      await deleteUser({ userId }).unwrap();
      setDeleteUserConfirmOpen(false);
      showSuccess('Пользователь удалён');
      onClose();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Не удалось удалить пользователя'));
    }
  };

  const openCreateQuietHours = () => {
    setEditingQuietHours(null);
    setQuietHoursSheetOpen(true);
  };

  const openEditQuietHours = (quietHours: QuietHoursDto) => {
    setEditingQuietHours(quietHours);
    setQuietHoursSheetOpen(true);
  };

  if (!open) return null;
  return (
    <>
      <Sheet
        isOpen={open}
        onClose={onClose}
        placement={sheetPlacement}
        withSizeToggle={!isMobileSheet}
        resizable
        size={isMobileSheet ? '88%' : '60%'}
      >
        <div className={styles.content}>
          <div className={styles.sheetHeader}>
            <h2 className={styles.sheetTitle}>{userId}</h2>
            <Button
              variant="text"
              icon="delete"
              color="error"
              disabled={saving || deleting || isLoading}
              onClick={() => setDeleteUserConfirmOpen(true)}
              aria-label="Удалить пользователя"
            />
          </div>
          {isLoading && <p aria-live="polite">Загрузка...</p>}
          {error && <Message severity="error">Ошибка загрузки предпочтений</Message>}
          {data && (
            <>
              <p>
                Регион: <strong>{data.region}</strong>
              </p>
              <div className={styles.tableWrap}>
                <Table className={styles.table}>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Type</TableHeadCell>
                      <TableHeadCell>Channel</TableHeadCell>
                      <TableHeadCell>Enabled</TableHeadCell>
                      <TableHeadCell>Source</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.preferences.map((pref) => (
                      <TableRow key={`${pref.notification_type}-${pref.channel}`}>
                        <TableCell>{pref.notification_type}</TableCell>
                        <TableCell>{pref.channel}</TableCell>
                        <TableCell>
                          <Toggle
                            checked={pref.enabled}
                            disabled={pref.blocked_by_global || saving}
                            onChange={(_e, checked) => handleToggle(pref, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          {pref.source ? <PreferenceSourceBadge source={pref.source} /> : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className={styles.quietHours}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Quiet hours</h3>
                  {!data.quiet_hours && (
                    <Button
                      variant="text"
                      icon="add"
                      disabled={saving}
                      onClick={openCreateQuietHours}
                      aria-label="Добавить quiet hours"
                    />
                  )}
                </div>
                <div className={styles.tableWrap}>
                  <Table className={styles.table}>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>Start</TableHeadCell>
                        <TableHeadCell>End</TableHeadCell>
                        <TableHeadCell>Timezone</TableHeadCell>
                        <TableHeadCell>Enabled</TableHeadCell>
                        <TableHeadCell cellAlign="right">Actions</TableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!data.quiet_hours && (
                        <TableRow>
                          <TableCell colSpan={5}>Нет quiet hours</TableCell>
                        </TableRow>
                      )}
                      {data.quiet_hours && (
                        <TableRow>
                          <TableCell>{data.quiet_hours.start_time}</TableCell>
                          <TableCell>{data.quiet_hours.end_time}</TableCell>
                          <TableCell>{data.quiet_hours.timezone}</TableCell>
                          <TableCell>{data.quiet_hours.enabled ? 'on' : 'off'}</TableCell>
                          <TableCell cellAlign="right">
                            <Button
                              variant="text"
                              icon="edit"
                              disabled={saving}
                              onClick={() => openEditQuietHours(data.quiet_hours!)}
                              aria-label="Редактировать quiet hours"
                            />
                            <Button
                              variant="text"
                              icon="delete"
                              color="error"
                              disabled={saving || deleting}
                              onClick={() => setDeleteQuietHoursConfirmOpen(true)}
                              aria-label="Удалить quiet hours"
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </Sheet>
      <QuietHoursFormSheet
        open={quietHoursSheetOpen}
        title={editingQuietHours ? 'Редактировать quiet hours' : 'Новые quiet hours'}
        initialValues={editingQuietHours ?? undefined}
        saving={saving}
        onClose={() => {
          setQuietHoursSheetOpen(false);
          setEditingQuietHours(null);
        }}
        onSubmit={handleSaveQuietHours}
      />
      <Modal
        open={deleteQuietHoursConfirmOpen}
        onClose={() => setDeleteQuietHoursConfirmOpen(false)}
        role="alertdialog"
        aria-labelledby="delete-quiet-hours-title"
      >
        <div className={styles.deleteConfirm}>
          <h2 id="delete-quiet-hours-title">Удалить quiet hours?</h2>
          <p>Настройки тихих часов будут удалены без возможности восстановления.</p>
          <div className={styles.deleteConfirmActions}>
            <Button
              variant="text"
              disabled={saving || deleting}
              onClick={() => setDeleteQuietHoursConfirmOpen(false)}
            >
              Отмена
            </Button>
            <Button
              color="error"
              icon="delete"
              disabled={saving || deleting}
              onClick={handleDeleteQuietHours}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={deleteUserConfirmOpen}
        onClose={() => setDeleteUserConfirmOpen(false)}
        role="alertdialog"
        aria-labelledby="delete-user-title"
      >
        <div className={styles.deleteConfirm}>
          <h2 id="delete-user-title">Удалить пользователя?</h2>
          <p>
            Пользователь <strong>{userId}</strong> и все его настройки будут удалены без
            возможности восстановления.
          </p>
          <div className={styles.deleteConfirmActions}>
            <Button
              variant="text"
              disabled={deleting}
              onClick={() => setDeleteUserConfirmOpen(false)}
            >
              Отмена
            </Button>
            <Button color="error" icon="delete" disabled={deleting} onClick={handleDeleteUser}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
