import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';
import type { StrategyTelemetry } from '../../types/api';
import styles from './StrategyMonitor.module.css';

interface StrategyMonitorProps {
  telemetry: StrategyTelemetry | null;
  running: boolean;
}

type DotTone = 'ok' | 'warn' | 'bad' | 'neutral';

function dotClass(tone: DotTone): string {
  return `${styles.dot} ${
    tone === 'ok'
      ? styles.dotOk
      : tone === 'warn'
        ? styles.dotWarn
        : tone === 'bad'
          ? styles.dotBad
          : styles.dotNeutral
  }`;
}

function fmtPrice(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function fmtPct(n: number | null, digits = 1): string {
  if (n == null) return '—';
  return `${n.toFixed(digits)}%`;
}

function fmtAge(ms: number | null): string {
  if (ms == null) return 'sin ticks';
  if (ms < 1000) return '< 1s';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60_000)}m`;
}

function CheckItem({
  label,
  tone,
  value,
  hint,
}: {
  label: string;
  tone: DotTone;
  value: string;
  hint?: string;
}): JSX.Element {
  return (
    <div className={styles.check}>
      <div className={styles.checkHead}>
        <span>{label}</span>
        <span className={dotClass(tone)} aria-hidden />
      </div>
      <div className={styles.checkValue}>{value}</div>
      {hint && <div className={styles.checkHint}>{hint}</div>}
    </div>
  );
}

export function StrategyMonitor({ telemetry, running }: StrategyMonitorProps): JSX.Element {
  if (!telemetry) {
    return (
      <Card title="Monitor de estrategia">
        <div className={styles.emptyEvents}>Cargando telemetría…</div>
      </Card>
    );
  }

  const marketTone: DotTone = !running
    ? 'neutral'
    : telemetry.marketAlive
      ? 'ok'
      : telemetry.marketWsConnected
        ? 'warn'
        : 'bad';

  const volTone: DotTone = !running
    ? 'neutral'
    : telemetry.volGate.pass
      ? 'ok'
      : telemetry.volGate.realizedVolPct == null
        ? 'warn'
        : 'bad';

  const levelsTone: DotTone = !running
    ? 'neutral'
    : telemetry.levels.untouched > 0
      ? 'ok'
      : 'warn';

  const sweepTone: DotTone =
    telemetry.activeSweep != null
      ? 'warn'
      : telemetry.lastBlock.reason === 'SWEEP_EXPIRED'
        ? 'bad'
        : 'neutral';

  const signalTone: DotTone = !telemetry.signal
    ? 'neutral'
    : telemetry.signal.pass
      ? 'ok'
      : 'bad';

  const riskTone: DotTone = !running
    ? 'neutral'
    : telemetry.risk.canTrade
      ? 'ok'
      : 'bad';

  return (
    <Card
      title="Monitor de estrategia"
      trailing={
        <Badge tone={running ? 'green' : 'neutral'}>
          {running ? telemetry.fsm : 'OFF'}
        </Badge>
      }
    >
      <div className={styles.monitor}>
        <div className={styles.grid}>
          <CheckItem
            label="Mercado (Binance WS)"
            tone={marketTone}
            value={
              running
                ? !telemetry.marketWsConnected
                  ? 'WS desconectado — reconectando'
                  : telemetry.marketAlive
                    ? `Vivo · ${fmtPrice(telemetry.lastPrice)}`
                    : 'Sin ticks recientes'
                : 'Bot detenido'
            }
            hint={
              running
                ? telemetry.marketWsConnected
                  ? `Último tick hace ${fmtAge(telemetry.lastTickAgeMs)}`
                  : 'Comprobando conexión con Binance…'
                : undefined
            }
          />
          <CheckItem
            label="Volatilidad 5–90%"
            tone={volTone}
            value={
              telemetry.volGate.realizedVolPct != null
                ? fmtPct(telemetry.volGate.realizedVolPct)
                : '—'
            }
            hint={
              telemetry.volGate.pass
                ? 'Dentro del rango'
                : `Rango ${telemetry.volGate.min}–${telemetry.volGate.max}%`
            }
          />
          <CheckItem
            label="Pivots UNTOUCHED"
            tone={levelsTone}
            value={`${telemetry.levels.untouched} / ${telemetry.levels.total}`}
            hint={
              telemetry.levels.nearest
                ? `Cercano: ${telemetry.levels.nearest.side} ${fmtPrice(telemetry.levels.nearest.price)} (${telemetry.levels.nearest.distancePct.toFixed(2)}%)`
                : 'Sin niveles activos'
            }
          />
          <CheckItem
            label="Sweep / Reclaim"
            tone={sweepTone}
            value={
              telemetry.activeSweep
                ? `${telemetry.activeSweep.side} @ ${fmtPrice(telemetry.activeSweep.levelPrice)} · ${Math.ceil(telemetry.activeSweep.expiresInMs / 1000)}s restantes`
                : 'Sin sweep activo'
            }
            hint={
              telemetry.activeSweep
                ? 'Esperando reclaim (< 90 s)'
                : 'Requiere barrido + reclaim del nivel'
            }
          />
          <CheckItem
            label="Señal z-score"
            tone={signalTone}
            value={
              telemetry.signal
                ? `${telemetry.signal.z.toFixed(2)} / ${telemetry.signal.threshold}`
                : '—'
            }
            hint={
              telemetry.signal?.components
                ? `CVD ${telemetry.signal.components.zCvd.toFixed(2)} · Vol ${telemetry.signal.components.zVol.toFixed(2)}`
                : 'Se calcula al reclaim'
            }
          />
          <CheckItem
            label="Riesgo"
            tone={riskTone}
            value={
              telemetry.risk.hasOpenPosition
                ? 'Posición abierta'
                : `$${telemetry.risk.equity.toFixed(0)} equity`
            }
            hint={
              telemetry.risk.hasOpenPosition
                ? 'Cierra la posición en Binance para nuevas entradas'
                : telemetry.risk.canTrade
                  ? 'Puede operar'
                  : `$${telemetry.risk.equity.toFixed(0)} equity · mínimo $${telemetry.risk.minEquity}`
            }
          />
        </div>

        <div className={styles.blockBox}>
          <div className={styles.blockLabel}>Estado actual</div>
          {telemetry.lastBlock.message}
        </div>

        {telemetry.recentEvents.length > 0 && (
          <div className={styles.events}>
            <div className={styles.blockLabel}>Eventos recientes</div>
            {telemetry.recentEvents.slice(0, 8).map((ev) => (
              <div key={`${ev.at}-${ev.type}-${ev.message}`} className={styles.event}>
                <span className={styles.eventTime}>
                  {new Date(ev.at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span>{ev.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
