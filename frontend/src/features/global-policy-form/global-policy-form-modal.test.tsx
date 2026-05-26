import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GlobalPolicyFormModal } from './GlobalPolicyFormModal';
import { renderWithProviders } from '../../shared/test/render-with-providers';

describe('GlobalPolicyFormModal', () => {
  it('submits default values when no initialValues provided', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    renderWithProviders(
      <GlobalPolicyFormModal
        open
        title="Новая политика"
        saving={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      notification_type: 'marketing',
      channel: 'email',
      region: 'EU',
      action: 'deny',
      reason_code: 'blocked_by_global_policy',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('preserves initialValues when editing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <GlobalPolicyFormModal
        open
        title="Редактировать"
        initialValues={{
          notification_type: 'transactional',
          channel: 'sms',
          region: 'US',
          action: 'deny',
          reason_code: 'blocked_by_global_policy',
        }}
        saving={false}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'transactional',
        channel: 'sms',
        region: 'US',
      }),
    );
  });
});
