import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  label: string;
}

const items: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/trades', label: 'Trades' },
  { to: '/config', label: 'Configuración' },
];

export function Sidebar(): JSX.Element {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={styles.aside}>
      <div className={styles.brand}>
        <div className={styles.logoBox}>BF</div>
        <div>
          <div className={styles.brandText}>Bot Futuros</div>
          <span className={styles.brandSub}>Institutional</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.label}>Trading</div>
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/dashboard'}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            <span className={styles.dot} />
            {i.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.label}>{user?.email}</div>
        <button type="button" onClick={handleSignOut} className={styles.signOut}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
