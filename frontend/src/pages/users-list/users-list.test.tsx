import { renderWithProviders } from '../../shared/test/render-with-providers';
import { UsersListPage } from './UsersListPage';

describe('UsersListPage', () => {
  it('renders users heading', () => {
    const { getByRole } = renderWithProviders(<UsersListPage />);
    expect(getByRole('heading', { name: 'Пользователи' })).toBeInTheDocument();
  });
});
