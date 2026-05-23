export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';
export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  userId: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  botEnabled: boolean;
  riskPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface NewPasswordChallengeResponse {
  challengeName: 'NEW_PASSWORD_REQUIRED';
  session: string;
  message: 'NEW_PASSWORD_REQUIRED';
}

export type LoginResponse = AuthTokens | NewPasswordChallengeResponse;

export function isNewPasswordChallenge(
  data: LoginResponse,
): data is NewPasswordChallengeResponse {
  return (
    'challengeName' in data &&
    data.challengeName === 'NEW_PASSWORD_REQUIRED' &&
    typeof data.session === 'string'
  );
}

export type SessionState =
  | 'IDLE'
  | 'SCANNING'
  | 'EXECUTING'
  | 'MANAGING'
  | 'COOLDOWN'
  | 'DISABLED'
  | 'ERROR';

export interface TradingSession {
  userId: string;
  state: SessionState;
  startedAt: string;
  lastTickAt: string;
  balance: number;
  equity: number;
  openPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  errorMessage?: string;
}

export interface SessionStatus {
  session: TradingSession;
  running: boolean;
}

export interface TradeRecord {
  tradeId: string;
  userId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  fees: number;
  openedAt: string;
  closedAt: string;
  exitReason: 'TP1' | 'TP2' | 'STOP' | 'MANUAL' | 'TIME';
}

export interface PositionRecord {
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  openedAt: string;
  unrealizedPnl: number;
}

export interface BalanceResponse {
  usdc: number;
  usdcAvailable: number;
  usdt: number;
}

export type BlockReason =
  | 'BOT_STOPPED'
  | 'POSITION_OPEN'
  | 'WARMUP'
  | 'COOLDOWN'
  | 'VOL_LOW'
  | 'VOL_HIGH'
  | 'NO_LEVEL'
  | 'SWEEP_ACCUMULATING'
  | 'SWEEP_EXPIRED'
  | 'SIGNAL_LOW'
  | 'RISK_REJECTED'
  | 'READY'
  | 'NONE';

export interface StrategyEvent {
  at: string;
  type:
    | 'SWEEP_DETECTED'
    | 'SWEEP_EXPIRED'
    | 'SIGNAL_REJECT'
    | 'TRADE_INTENT'
    | 'RISK_REJECT'
    | 'EXECUTING';
  message: string;
}

export interface StrategyTelemetry {
  updatedAt: string;
  symbol: string;
  running: boolean;
  marketAlive: boolean;
  lastTickAgeMs: number | null;
  lastPrice: number | null;
  sessionState: string;
  fsm: string;
  volGate: {
    pass: boolean;
    realizedVolPct: number | null;
    min: number;
    max: number;
  };
  levels: {
    untouched: number;
    invalidated: number;
    consumed: number;
    total: number;
    nearest: {
      side: 'HIGH' | 'LOW';
      price: number;
      distancePct: number;
    } | null;
  };
  activeSweep: {
    side: 'HIGH' | 'LOW';
    levelPrice: number;
    ageMs: number;
    expiresInMs: number;
  } | null;
  signal: {
    z: number;
    threshold: number;
    pass: boolean;
    components: {
      zCvd: number;
      zVol: number;
      zSigma: number;
      zSpread: number;
    } | null;
  } | null;
  risk: {
    equity: number;
    canTrade: boolean;
    hasOpenPosition: boolean;
    minEquity: number;
  };
  lastBlock: {
    reason: BlockReason;
    message: string;
    at: string;
  };
  recentEvents: StrategyEvent[];
}

export interface StrategyDiagnosticsResponse {
  telemetry: StrategyTelemetry;
  running: boolean;
}

export interface LivePositionView {
  hasPosition: boolean;
  symbol: string;
  side: 'LONG' | 'SHORT' | null;
  quantity: number;
  entryPrice: number | null;
  markPrice: number | null;
  unrealizedPnl: number;
  stopLoss: number | null;
  takeProfits: number[];
  liquidationPrice: number | null;
  leverage: number | null;
  openedByBot: boolean;
  source: 'binance';
}

export interface PricePoint {
  t: number;
  p: number;
}
