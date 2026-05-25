/// <reference types="vite/client" />

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OPENAPI_UI_URL: string;
  readonly VITE_GRAFANA_URL: string;
  readonly VITE_GRAFANA_ADMIN_USER: string;
  readonly VITE_GRAFANA_ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
