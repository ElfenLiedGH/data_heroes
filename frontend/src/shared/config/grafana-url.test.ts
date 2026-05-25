import { resolveGrafanaUrl } from './grafana-url';

describe('resolveGrafanaUrl', () => {
  it('returns default grafana subpath url', () => {
    expect(resolveGrafanaUrl()).toBe('/grafana/');
  });
});
