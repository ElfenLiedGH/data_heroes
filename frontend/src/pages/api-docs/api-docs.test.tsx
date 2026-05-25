import { render, screen } from '@testing-library/react';
import { ApiDocsPage } from './ApiDocsPage';

describe('ApiDocsPage', () => {
  it('renders swagger link with docs url', () => {
    render(<ApiDocsPage />);
    const link = screen.getByRole('link', { name: 'Открыть Swagger UI' }) as HTMLAnchorElement;
    expect(link.href).toContain('/api/docs/');
  });
});
