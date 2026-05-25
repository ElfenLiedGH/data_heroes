import type { PreferenceItemDto } from '../../api/api';
import styles from './PreferenceSourceBadge.module.less';

type Props = {
  source: NonNullable<PreferenceItemDto['source']>;
};

export function PreferenceSourceBadge({ source }: Props) {
  return <span className={`${styles.badge} ${styles[source]}`}>{source}</span>;
}
