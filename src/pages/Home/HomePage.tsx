import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AxiosError } from 'axios';
import { Metric } from '../../components/Card/Card';
import { Card } from '../../components/Card/Card';
import { Badge } from '../../components/Badge/Badge';
import { Button } from '../../components/Button/Button';
import { useSocket } from '../../hooks/useSocket';
import { tradingApi } from '../../api/trading';
import { exchangesApi } from '../../api/exchanges';
import type {
  BalanceResponse,
  SessionState,
  StrategyTelemetry,
  TradeRecord,
  TradingSession,
} from '../../types/api';
import { StrategyMonitor } from '../../components/StrategyMonitor/StrategyMonitor';
import styles from './Home.module.css';

function stateTone(state: SessionState): 'green' | 'red' | 'brand' | 'yellow' | 'neutral' {
  switch (state) {
    case 'SCANNING':
    case 'MANAGING':
      return 'green';
    case 'EXECUTING':
      return 'brand';
    case 'COOLDOWN':
      return 'yellow';
    case 'ERROR':
      return 'red';
    case 'DISABLED':
    case 'IDLE':
    default:
      return 'neutral';
  }
}

function fmt(num: number, digits = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function HomePage(): JSX.Element {
  const { socket } = useSocket();
  const [session, setSession] = useState<TradingSession | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [openPnl, setOpenPnl] = useState<number>(0);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [configured, setConfigured] = useState<boolean>(true);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [strategyTelemetry, setStrategyTelemetry] = useState<StrategyTelemetry | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const [status, exchStatus, recent, diagnostics] = await Promise.all([
        tradingApi.status(),
        exchangesApi.status(),
        tradingApi.trades(20),
        tradingApi.diagnostics().catch(() => null),
      ]);
      setSession(status.session);
      setRunning(status.running);
      setOpenPnl(status.session.openPnl);
      setConfigured(exchStatus.configured);
      setTrades(recent);
      if (diagnostics) setStrategyTelemetry(diagnostics.telemetry);
      if (exchStatus.configured) {
        try {
          const b = await exchangesApi.balance();
          setBalance(b);
        } catch {
          // ignore balance read issues
        }
      }
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'Error cargando datos';
      setError(msg);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('subscribe:status');

    const onStatus = (payload: { state: SessionState }): void => {
      setSession((s) => (s ? { ...s, state: payload.state } : s));
    };
    const onBalance = (payload: { balance: number; equity: number }): void => {
      setBalance((b) => (b ? { ...b, usdc: payload.balance } : { usdc: payload.balance, usdcAvailable: payload.balance, usdt: 0 }));
    };
    const onPnl = (payload: { openPnl: number; equity: number }): void => {
      setOpenPnl(payload.openPnl);
    };
    const onTrade = (payload: { trade: TradeRecord }): void => {
      setTrades((prev) => [payload.trade, ...prev].slice(0, 20));
      void refreshAll();
    };
    const onStrategySnapshot = (payload: { telemetry: StrategyTelemetry }): void => {
      setStrategyTelemetry(payload.telemetry);
    };

    socket.on('status', onStatus);
    socket.on('balance', onBalance);
    socket.on('pnl', onPnl);
    socket.on('trade', onTrade);
    socket.on('strategy:snapshot', onStrategySnapshot);

    return () => {
      socket.off('status', onStatus);
      socket.off('balance', onBalance);
      socket.off('pnl', onPnl);
      socket.off('trade', onTrade);
      socket.off('strategy:snapshot', onStrategySnapshot);
    };
  }, [socket, refreshAll]);

  const equity = useMemo(() => {
    const b = balance?.usdc ?? 0;
    return b + openPnl;
  }, [balance, openPnl]);

  const winrate = useMemo(() => {
    if (!session || session.totalTrades === 0) return 0;
    return (session.winningTrades / session.totalTrades) * 100;
  }, [session]);

  async function toggleBot(): Promise<void> {
    setActionBusy(true);
    setError('');
    try {
      if (running) {
        await tradingApi.stop();
      } else {
        await tradingApi.start();
      }
      await refreshAll();
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'Acción no permitida';
      setError(msg);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Estado del bot, balance y operaciones recientes.
          </p>
        </div>
        <div className={styles.actions}>
          <Badge tone={stateTone(session?.state ?? 'IDLE')}>
            {session?.state ?? 'IDLE'}
          </Badge>
          <Button
            variant={running ? 'danger' : 'success'}
            disabled={actionBusy || !configured}
            onClick={toggleBot}
          >
            {actionBusy ? '...' : running ? 'Detener bot' : 'Activar bot'}
          </Button>
        </div>
      </div>

      {!configured && (
        <div className={styles.warn}>
          <span>
            Antes de activar el bot debes configurar tus API Keys de Binance.
          </span>
          <Link to="/config">
            <Button variant="ghost">Ir a configuración</Button>
          </Link>
        </div>
      )}

      {error && (
        <div
          className={styles.warn}
          style={{
            background: 'var(--red-dim)',
            color: 'var(--red)',
            borderColor: 'rgba(255,85,114,0.3)',
          }}
        >
          {error}
        </div>
      )}

      <div className={styles.metrics}>
        <Metric
          label="Balance (USDC)"
          value={balance ? `$${fmt(balance.usdc)}` : '$0.00'}
          hint={balance ? `Disponible: $${fmt(balance.usdcAvailable)}` : ''}
        />
        <Metric
          label="Equity"
          value={`$${fmt(equity)}`}
          hint="Balance + PnL abierto"
        />
        <Metric
          label="PnL abierto"
          value={`${openPnl >= 0 ? '+' : ''}$${fmt(openPnl)}`}
          trend={openPnl > 0 ? 'positive' : openPnl < 0 ? 'negative' : 'neutral'}
        />
        <Metric
          label="PnL total"
          value={`${(session?.totalPnl ?? 0) >= 0 ? '+' : ''}$${fmt(session?.totalPnl ?? 0)}`}
          trend={
            (session?.totalPnl ?? 0) > 0
              ? 'positive'
              : (session?.totalPnl ?? 0) < 0
                ? 'negative'
                : 'neutral'
          }
        />
        <Metric
          label="Operaciones"
          value={String(session?.totalTrades ?? 0)}
          hint={`Ganadas ${session?.winningTrades ?? 0} · Perdidas ${session?.losingTrades ?? 0}`}
        />
        <Metric
          label="Winrate"
          value={`${fmt(winrate, 1)}%`}
          trend={winrate >= 50 ? 'positive' : 'neutral'}
        />
      </div>

      <StrategyMonitor telemetry={strategyTelemetry} running={running} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Operaciones recientes</h2>
          <Link to="/trades" style={{ fontSize: 13 }}>
            Ver todas →
          </Link>
        </div>
        {trades.length === 0 ? (
          <div className={styles.empty}>
            Aún no hay operaciones. El bot ejecutará trades automáticamente cuando
            detecte una señal válida según la estrategia.
          </div>
        ) : (
          <div className={styles.tradesList}>
            {trades.slice(0, 8).map((t) => (
              <div key={t.tradeId} className={styles.trade}>
                <div className={styles.tradeLeft}>
                  <Badge tone={t.side === 'LONG' ? 'green' : 'red'}>{t.side}</Badge>
                  <span>{t.symbol}</span>
                  <span style={{ color: 'var(--text-3)' }}>
                    {new Date(t.closedAt).toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--text-3)' }}>· {t.exitReason}</span>
                </div>
                <div
                  className={`${styles.tradePnl} ${
                    t.pnl >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {t.pnl >= 0 ? '+' : ''}${fmt(t.pnl)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
