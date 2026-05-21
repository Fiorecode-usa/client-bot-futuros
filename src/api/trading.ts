import { api } from './client';
import type {
  PositionRecord,
  SessionStatus,
  TradeRecord,
  TradingSession,
} from '../types/api';

export const tradingApi = {
  async start(): Promise<TradingSession> {
    const { data } = await api.post<TradingSession>('/trading/start');
    return data;
  },
  async stop(): Promise<TradingSession> {
    const { data } = await api.post<TradingSession>('/trading/stop');
    return data;
  },
  async status(): Promise<SessionStatus> {
    const { data } = await api.get<SessionStatus>('/trading/status');
    return data;
  },
  async positions(): Promise<PositionRecord[]> {
    const { data } = await api.get<PositionRecord[]>('/trading/positions');
    return data;
  },
  async trades(limit = 50): Promise<TradeRecord[]> {
    const { data } = await api.get<TradeRecord[]>('/trading/trades', { params: { limit } });
    return data;
  },
};
