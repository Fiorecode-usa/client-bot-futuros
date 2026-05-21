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
