import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Tone = 'neutral' | 'green' | 'red' | 'yellow' | 'brand';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps): JSX.Element {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span className={styles.dot} />
      {children}
    </span>
  );
}
