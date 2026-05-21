import { useEffect, useState } from 'react';
import { Badge } from '../../components/Badge/Badge';
import { tradingApi } from '../../api/trading';
import { useSocket } from '../../hooks/useSocket';
import type { TradeRecord } from '../../types/api';
import styles from './Trades.module.css';

function fmt(num: number, digits = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function TradesPage(): JSX.Element {
  const { socket } = useSocket();
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  useEffect(() => {
    void tradingApi.trades(200).then(setTrades);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onTrade = (payload: { trade: TradeRecord }): void => {
      setTrades((prev) => [payload.trade, ...prev].slice(0, 200));
    };
    socket.on('trade', onTrade);
    return () => {
      socket.off('trade', onTrade);
    };
  }, [socket]);

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Operaciones</h1>
        <p className={styles.subtitle}>Historial de las últimas operaciones del bot.</p>
      </div>

      {trades.length === 0 ? (
        <div className={styles.empty}>
          Aún no hay operaciones cerradas. El histórico se irá llenando mientras
          el bot opere.
        </div>
      ) : (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <div className={`${styles.col} ${styles.colTime}`}>Fecha</div>
            <div className={`${styles.col} ${styles.colSide}`}>Side</div>
            <div className={`${styles.col} ${styles.colPx}`}>Entrada</div>
            <div className={`${styles.col} ${styles.colPx}`}>Salida</div>
            <div className={`${styles.col} ${styles.colPx}`}>Qty</div>
            <div className={`${styles.col} ${styles.colReason}`}>Motivo</div>
            <div className={`${styles.col} ${styles.colPnl}`}>PnL</div>
          </div>
          {trades.map((t) => (
            <div key={t.tradeId} className={styles.row}>
              <div className={`${styles.col} ${styles.colTime}`}>
                {new Date(t.closedAt).toLocaleString()}
              </div>
              <div className={`${styles.col} ${styles.colSide}`}>
                <Badge tone={t.side === 'LONG' ? 'green' : 'red'}>{t.side}</Badge>
              </div>
              <div className={`${styles.col} ${styles.colPx}`}>${fmt(t.entryPrice)}</div>
              <div className={`${styles.col} ${styles.colPx}`}>${fmt(t.exitPrice)}</div>
              <div className={`${styles.col} ${styles.colPx}`}>{fmt(t.quantity, 4)}</div>
              <div className={`${styles.col} ${styles.colReason}`}>{t.exitReason}</div>
              <div
                className={`${styles.col} ${styles.colPnl} ${
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
  );
}
