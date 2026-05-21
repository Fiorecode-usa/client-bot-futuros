import type { ReactNode } from 'react';
import styles from './Auth.module.css';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps): JSX.Element {
  return (
    <div className={styles.shell}>
      <div className={styles.left}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <div className={styles.logo}>BF</div>
            <div>
              <div className={styles.brandText}>Bot Futuros</div>
              <span className={styles.brandSub}>Institutional</span>
            </div>
          </div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.rightContent}>
          <span className={styles.rightTag}>BTC / USDC Perpetuals</span>
          <h2 className={styles.rightTitle}>
            Trading institucional sin gestionar la complejidad.
          </h2>
          <p className={styles.rightSub}>
            Estrategia cuantitativa basada en sweeps de liquidez, displacement
            y order flow agresivo. Ejecución event-driven, custodia en tu propio
            exchange. Tú configuras tu riesgo, nosotros operamos por ti.
          </p>
          <div className={styles.rightBullets}>
            <div className={styles.bullet}>
              <span className={styles.bulletDot} />
              <span>API Keys encriptadas con AWS KMS, jamás en texto plano.</span>
            </div>
            <div className={styles.bullet}>
              <span className={styles.bulletDot} />
              <span>
                Risk Engine separado: cap por trade, leverage máximo, circuit breakers.
              </span>
            </div>
            <div className={styles.bullet}>
              <span className={styles.bulletDot} />
              <span>Realtime: balance, PnL, trades y estado del bot en tiempo real.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { styles as authStyles };
