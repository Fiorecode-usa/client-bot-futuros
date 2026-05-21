import { api } from './client';
import type { UserProfile } from '../types/api';

export const usersApi = {
  async me(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/users/me');
    return data;
  },
  async updateRisk(riskPct: number): Promise<UserProfile> {
    const { data } = await api.put<UserProfile>('/users/me/risk', { riskPct });
    return data;
  },
};
