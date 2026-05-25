import { Card } from '@smwb/summer-ui';
import styles from './ApiDocsPage.module.less';

export function ApiDocsPage() {
  const src = import.meta.env.VITE_OPENAPI_UI_URL ?? '/api/docs';
  const docsUrl = src.endsWith('/') ? src : `${src}/`;

  return (
    <Card className={styles.card}>
      <a href={docsUrl} className={styles.link}>
        Открыть Swagger UI
      </a>
    </Card>
  );
}
