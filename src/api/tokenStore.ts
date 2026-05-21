import type { AuthTokens } from '../types/api';

const KEY = 'bot-futuros:auth';

export const tokenStore = {
  set(tokens: AuthTokens): void {
    localStorage.setItem(KEY, JSON.stringify(tokens));
  },
  get(): AuthTokens | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthTokens;
    } catch {
      return null;
    }
  },
  getIdToken(): string | null {
    return this.get()?.idToken ?? null;
  },
  getRefreshToken(): string | null {
    return this.get()?.refreshToken ?? null;
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
};
