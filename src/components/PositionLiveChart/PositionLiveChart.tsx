import { useMemo } from 'react';
import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';
import type { LivePositionView, PricePoint } from '../../types/api';
import styles from './PositionLiveChart.module.css';

interface PositionLiveChartProps {
  position: LivePositionView | null;
  priceHistory: PricePoint[];
  livePrice: number | null;
}

const COLORS = {
  entry: '#6ea8fe',
  stop: '#ff5572',
  tp: '#3ecf8e',
  price: '#c084fc',
  grid: 'rgba(255,255,255,0.06)',
  text: 'rgba(255,255,255,0.45)',
};

function fmt(n: number | null, digits = 1): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

interface LevelLine {
  label: string;
  price: number;
  color: string;
}

export function PositionLiveChart({
  position,
  priceHistory,
  livePrice,
}: PositionLiveChartProps): JSX.Element {
  const chart = useMemo(() => {
    const W = 800;
    const H = 280;
    const pad = { top: 18, right: 72, bottom: 24, left: 12 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    if (!position?.hasPosition) return null;

    const levels: LevelLine[] = [];
    if (position.entryPrice != null && position.entryPrice > 0) {
      levels.push({ label: 'Entrada', price: position.entryPrice, color: COLORS.entry });
    }
    if (position.stopLoss != null && position.stopLoss > 0) {
      levels.push({ label: 'SL', price: position.stopLoss, color: COLORS.stop });
    }
    position.takeProfits.forEach((tp, i) => {
      if (tp > 0) levels.push({ label: `TP${i + 1}`, price: tp, color: COLORS.tp });
    });

    const current = livePrice ?? position.markPrice ?? null;

    // Eje Y anclado a niveles de trade + precio actual (siempre visibles)
    const anchorPrices = [
      ...levels.map((l) => l.price),
      ...(current != null && current > 0 ? [current] : []),
    ].filter((p) => p > 0);

    if (anchorPrices.length === 0) return null;

    let min = Math.min(...anchorPrices);
    let max = Math.max(...anchorPrices);

    for (const pt of priceHistory) {
      if (pt.p > 0) {
        min = Math.min(min, pt.p);
        max = Math.max(max, pt.p);
      }
    }

    const mid = (min + max) / 2;
    const minSpan = Math.max(mid * 0.0015, 80);
    if (max - min < minSpan) {
      min = mid - minSpan / 2;
      max = mid + minSpan / 2;
    }

    const span = max - min;
    min -= span * 0.14;
    max += span * 0.14;

    const yFor = (price: number): number =>
      pad.top + innerH - ((price - min) / (max - min)) * innerH;

    const labelY = (y: number): number => {
      if (y < pad.top + 10) return pad.top + 12;
      if (y > pad.top + innerH - 6) return pad.top + innerH - 2;
      return y + 4;
    };

    const times = priceHistory.map((p) => p.t);
    const tMin = times.length > 0 ? times[0]! : Date.now() - 60_000;
    const tMax = times.length > 0 ? times[times.length - 1]! : Date.now();
    const tSpan = Math.max(tMax - tMin, 60_000);

    const xFor = (t: number): number => {
      if (priceHistory.length <= 1) return pad.left + innerW;
      return pad.left + ((t - tMin) / tSpan) * innerW;
    };

    const path =
      priceHistory.length > 0
        ? priceHistory
            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xFor(pt.t).toFixed(1)} ${yFor(pt.p).toFixed(1)}`)
            .join(' ')
        : '';

    const currentY = current != null ? yFor(current) : null;
    const currentX = pad.left + innerW;

    return { W, H, pad, innerH, levels, yFor, labelY, path, current, currentX, currentY, min, max };
  }, [position, priceHistory, livePrice]);

  if (!position?.hasPosition) {
    return (
      <Card title="Posición en vivo">
        <div className={styles.empty}>
          No hay posición abierta en Binance. Cuando no haya operación activa y se cumplan
          las condiciones de la estrategia, el bot entrará automáticamente.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Posición en vivo"
      trailing={
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone={position.side === 'LONG' ? 'green' : 'red'}>{position.side}</Badge>
          <Badge tone={position.openedByBot ? 'brand' : 'yellow'}>
            {position.openedByBot ? 'Bot' : 'Manual'}
          </Badge>
        </div>
      }
    >
      <div className={styles.chartWrap}>
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Símbolo</span>
            <span className={styles.metaValue}>{position.symbol}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Cantidad</span>
            <span className={styles.metaValue}>{fmt(position.quantity, 4)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Entrada</span>
            <span className={styles.metaValue}>${fmt(position.entryPrice)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Mark</span>
            <span className={styles.metaValue}>${fmt(livePrice ?? position.markPrice)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>PnL</span>
            <span
              className={`${styles.metaValue} ${
                position.unrealizedPnl >= 0 ? styles.positive : styles.negative
              }`}
            >
              {position.unrealizedPnl >= 0 ? '+' : ''}${fmt(position.unrealizedPnl, 2)}
            </span>
          </div>
          {position.stopLoss != null && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Stop loss</span>
              <span className={styles.metaValue} style={{ color: COLORS.stop }}>
                ${fmt(position.stopLoss)}
              </span>
            </div>
          )}
          {position.takeProfits.map((tp, i) => (
            <div key={`tp-${tp}`} className={styles.metaItem}>
              <span className={styles.metaLabel}>TP{i + 1}</span>
              <span className={styles.metaValue} style={{ color: COLORS.tp }}>
                ${fmt(tp)}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.chartBox}>
          {chart && (
            <svg
              className={styles.chartSvg}
              viewBox={`0 0 ${chart.W} ${chart.H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Gráfico de precio en vivo con niveles de entrada, stop y take profit"
            >
              {chart.levels.map((level) => {
                const y = chart.yFor(level.price);
                const clampedY = Math.max(chart.pad.top + 2, Math.min(chart.pad.top + chart.innerH - 2, y));
                return (
                  <g key={`${level.label}-${level.price}`}>
                    <line
                      x1={12}
                      y1={clampedY}
                      x2={chart.W - 72}
                      y2={clampedY}
                      stroke={level.color}
                      strokeWidth={level.label === 'Entrada' ? 2 : 1.5}
                      strokeDasharray={level.label === 'Entrada' ? '0' : '6 4'}
                      opacity={0.9}
                    />
                    <text
                      x={chart.W - 8}
                      y={chart.labelY(y)}
                      fill={level.color}
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      textAnchor="end"
                      fontWeight={level.label === 'Entrada' ? 600 : 400}
                    >
                      {level.label} {fmt(level.price)}
                    </text>
                  </g>
                );
              })}

              {chart.path && (
                <path
                  d={chart.path}
                  fill="none"
                  stroke={COLORS.price}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {chart.current != null && chart.currentY != null && (
                <>
                  <line
                    x1={12}
                    y1={chart.currentY}
                    x2={chart.currentX}
                    y2={chart.currentY}
                    stroke={COLORS.price}
                    strokeWidth={1}
                    opacity={0.35}
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={chart.currentX}
                    cy={chart.currentY}
                    r={5}
                    fill={COLORS.price}
                  />
                  <text
                    x={chart.currentX - 8}
                    y={chart.labelY(chart.currentY)}
                    fill={COLORS.price}
                    fontSize={11}
                    fontFamily="var(--font-mono)"
                    textAnchor="end"
                  >
                    {fmt(chart.current)}
                  </text>
                </>
              )}
            </svg>
          )}
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: COLORS.entry }} />
            Entrada
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: COLORS.stop }} />
            Stop loss
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: COLORS.tp }} />
            Take profit
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: COLORS.price }} />
            Precio en vivo
          </div>
        </div>

        <div className={styles.note}>
          Datos reales de Binance (posición + órdenes abiertas). Mientras haya una operación
          activa, el bot no abrirá otra; al cerrarla, seguirá operando en automático si las
          condiciones de la estrategia se cumplen.
        </div>
      </div>
    </Card>
  );
}
