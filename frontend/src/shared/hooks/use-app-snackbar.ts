import { useSnackbar } from '@smwb/summer-ui';
import { useCallback } from 'react';

const API_ERROR_MESSAGES: Record<string, string> = {
  blocked_by_global_policy: 'Запрещено глобальной политикой',
  validation_failed: 'Ошибка валидации',
  user_not_found: 'Пользователь не найден',
  user_already_exists: 'Пользователь уже существует',
  policy_already_exists: 'Политика уже существует',
  policy_has_references: 'Политику нельзя удалить: есть связанные записи',
  default_preference_not_found: 'Дефолтная настройка не найдена',
  default_preference_already_exists: 'Дефолтная настройка уже существует',
};

export const EVALUATE_REASON_MESSAGES: Record<string, string> = {
  allowed: 'Разрешено',
  blocked_by_global_policy: 'Запрещено глобальной политикой',
  disabled_by_user_preference: 'Отключено пользователем',
  disabled_by_default: 'Отключено по умолчанию',
  blocked_by_quiet_hours: 'Запрещено quiet hours',
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const message = (error.data as { message?: string } | undefined)?.message;
    if (message) {
      return API_ERROR_MESSAGES[message] ?? message;
    }
  }
  return fallback;
}

export function getEvaluateReasonMessage(reason: string | null) {
  if (!reason) return '';
  return EVALUATE_REASON_MESSAGES[reason] ?? reason;
}

export function useAppSnackbar() {
  const { addSnackbar } = useSnackbar();

  const showSuccess = useCallback(
    (message: string) => {
      addSnackbar({ message, variant: 'success', position: 'top-right' });
    },
    [addSnackbar],
  );

  const showError = useCallback(
    (message: string) => {
      addSnackbar({ message, variant: 'danger', position: 'top-right' });
    },
    [addSnackbar],
  );

  return { showSuccess, showError };
}
