import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@smwb/summer-ui';
import styles from './NotFoundPage.module.less';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Card>
      <div className={styles.content}>
        <h1>404</h1>
        <p>Страница не найдена</p>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </div>
    </Card>
  );
}
