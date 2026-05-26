import { render, screen } from '@testing-library/react';
import { ApiDocsPage } from './ApiDocsPage';

describe('ApiDocsPage', () => {
  it('renders swagger iframe with docs url', () => {
    render(<ApiDocsPage />);
    const frame = screen.getByTitle('OpenAPI') as HTMLIFrameElement;
    expect(frame.src).toContain('/api/docs/');
  });
});
