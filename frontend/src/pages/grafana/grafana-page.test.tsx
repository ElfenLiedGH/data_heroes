import { render, screen } from '@testing-library/react';
import { GrafanaPage } from './GrafanaPage';

describe('GrafanaPage', () => {
  it('renders iframe with grafana url', () => {
    render(<GrafanaPage />);
    const iframe = screen.getByTitle('Grafana') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('/grafana/');
  });

  it('renders grafana credentials', () => {
    const { container } = render(<GrafanaPage />);
    const credentials = container.querySelector('[class*="credentials"]');
    expect(credentials?.textContent).toBe('Логин: admin · Пароль: admin');
  });
});
