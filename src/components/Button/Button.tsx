import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'ghost' | 'danger' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.full : ''} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
