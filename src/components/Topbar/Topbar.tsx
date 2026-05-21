import { useLocation } from 'react-router';
import { useSocket } from '../../hooks/useSocket';
import styles from './Topbar.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/trades': 'Trades',
  '/config': 'Configuración',
};

export function Topbar(): JSX.Element {
  const { connected } = useSocket();
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Panel';

  return (
    <div className={styles.topbar}>
      <div className={styles.title}>
        <span className={styles.pageName}>{pageTitle}</span>
        <span className={styles.market}>BTC/USDC Perpetual Futures</span>
      </div>
      <div className={styles.right}>
        <div className={styles.status}>
          <span
            className={`${styles.statusDot} ${
              connected ? styles.statusOnline : styles.statusOffline
            }`}
          />
          {connected ? 'Realtime conectado' : 'Sin conexión realtime'}
        </div>
      </div>
    </div>
  );
}
