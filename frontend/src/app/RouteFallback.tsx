import styles from './RouteFallback.module.less';

export function RouteFallback() {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span>Загрузка…</span>
    </div>
  );
}
