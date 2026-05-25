import { Card } from '@smwb/summer-ui';
import {
  resolveGrafanaAdminPassword,
  resolveGrafanaAdminUser,
  resolveGrafanaUrl,
} from '../../shared/config/grafana-url';
import styles from './GrafanaPage.module.less';

export function GrafanaPage() {
  const login = resolveGrafanaAdminUser();
  const password = resolveGrafanaAdminPassword();

  return (
    <Card className={styles.card}>
      <div className={styles.credentials}>
        Логин: <strong>{login}</strong> · Пароль: <strong>{password}</strong>
      </div>
      <iframe title="Grafana" src={resolveGrafanaUrl()} className={styles.frame} />
    </Card>
  );
}
