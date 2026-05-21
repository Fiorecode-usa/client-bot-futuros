import { api } from './client';
import type { BalanceResponse } from '../types/api';

export const exchangesApi = {
  async saveBinance(apiKey: string, apiSecret: string): Promise<void> {
    await api.post('/exchanges/binance', { apiKey, apiSecret });
  },
  async status(): Promise<{ configured: boolean }> {
    const { data } = await api.get('/exchanges/binance');
    return data;
  },
  async remove(): Promise<void> {
    await api.delete('/exchanges/binance');
  },
  async balance(): Promise<BalanceResponse> {
    const { data } = await api.get<BalanceResponse>('/exchanges/binance/balance');
    return data;
  },
};
