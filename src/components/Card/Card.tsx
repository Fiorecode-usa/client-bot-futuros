import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, trailing, children, className }: CardProps): JSX.Element {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      {title && (
        <div className={styles.title}>
          <span>{title}</span>
          {trailing}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
  trend?: 'positive' | 'negative' | 'neutral';
  hint?: string;
}

export function Metric({ label, value, trend = 'neutral', hint }: MetricProps): JSX.Element {
  const cls =
    trend === 'positive' ? styles.positive : trend === 'negative' ? styles.negative : '';
  return (
    <Card title={label}>
      <div className={`${styles.value} ${cls}`}>{value}</div>
      {hint && <div className={styles.subtitle}>{hint}</div>}
    </Card>
  );
}
