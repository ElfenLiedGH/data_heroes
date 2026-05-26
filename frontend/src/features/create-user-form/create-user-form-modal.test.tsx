import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateUserFormModal } from './CreateUserFormModal';
import { renderWithProviders } from '../../shared/test/render-with-providers';

describe('CreateUserFormModal', () => {
  it('submits trimmed user_id and chosen region', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    renderWithProviders(
      <CreateUserFormModal open saving={false} onClose={onClose} onSubmit={onSubmit} />,
    );

    const userIdInput = screen.getByRole('textbox');
    await user.type(userIdInput, '  user-new  ');

    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ user_id: 'user-new', region: 'EU' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not submit and shows error when user_id is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    renderWithProviders(
      <CreateUserFormModal open saving={false} onClose={onClose} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText('Обязательное поле')).toBeInTheDocument();
  });

  it('disables buttons while saving', () => {
    renderWithProviders(
      <CreateUserFormModal
        open
        saving
        onClose={() => {}}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
  });
});
