export function resolveGrafanaUrl() {
  const url = import.meta.env.VITE_GRAFANA_URL ?? '/grafana';
  return url.endsWith('/') ? url : `${url}/`;
}

export function resolveGrafanaAdminUser() {
  return import.meta.env.VITE_GRAFANA_ADMIN_USER ?? 'admin';
}

export function resolveGrafanaAdminPassword() {
  return import.meta.env.VITE_GRAFANA_ADMIN_PASSWORD ?? 'admin';
}
