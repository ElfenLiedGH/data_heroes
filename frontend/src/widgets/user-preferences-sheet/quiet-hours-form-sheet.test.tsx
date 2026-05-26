import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuietHoursFormSheet } from './QuietHoursFormSheet';
import { renderWithProviders } from '../../shared/test/render-with-providers';

describe('QuietHoursFormSheet', () => {
  it('submits default values when opened without initialValues', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    renderWithProviders(
      <QuietHoursFormSheet
        open
        title="Новые quiet hours"
        saving={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      start_time: '22:00',
      end_time: '08:00',
      timezone: 'Europe/Moscow',
      enabled: true,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('passes through initialValues when editing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <QuietHoursFormSheet
        open
        title="Редактировать quiet hours"
        initialValues={{
          start_time: '23:30',
          end_time: '07:00',
          timezone: 'UTC',
          enabled: false,
        }}
        saving={false}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(onSubmit).toHaveBeenCalledWith({
      start_time: '23:30',
      end_time: '07:00',
      timezone: 'UTC',
      enabled: false,
    });
  });

  it('returns null when not open', () => {
    const { container } = renderWithProviders(
      <QuietHoursFormSheet
        open={false}
        title="Новые quiet hours"
        saving={false}
        onClose={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    expect(container.querySelector('form')).toBeNull();
  });
});
