import { useNavigate } from 'react-router-dom';
import { Card, Icon } from '@smwb/summer-ui';
import { appNavItems } from '../../shared/config/app-nav';
import styles from './HomePage.module.less';

export function HomePage() {
  const navigate = useNavigate();
  const sections = appNavItems.filter((item) => item.to !== '/');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notification Preferences</h1>
      <p className={styles.subtitle}>Управление предпочтениями, политиками и мониторингом</p>
      <div className={styles.grid}>
        {sections.map((item) => (
          <button
            key={item.to}
            type="button"
            className={styles.tile}
            onClick={() => navigate(item.to)}
          >
            <Card className={styles.tileCard}>
              <Icon name={item.icon} size={28} />
              <span className={styles.tileLabel}>{item.label}</span>
              <span className={styles.tileDescription}>{item.description}</span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
