import { api } from './client';
import type { AuthTokens, LoginResponse } from '../types/api';

export const authApi = {
  async signUp(email: string, password: string): Promise<{ userId: string; needsConfirmation: boolean }> {
    const { data } = await api.post('/auth/signup', { email, password });
    return data;
  },
  async confirm(email: string, code: string): Promise<void> {
    await api.post('/auth/confirm', { email, code });
  },
  async resend(email: string): Promise<void> {
    await api.post('/auth/resend', { email });
  },
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },
  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    await api.post('/auth/confirm-forgot-password', { email, code, newPassword });
  },
  async forcePasswordChange(
    email: string,
    session: string,
    newPassword: string,
  ): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/force-password-change', {
      email,
      session,
      newPassword,
    });
    return data;
  },
  async signOut(): Promise<void> {
    await api.post('/auth/signout');
  },
};
