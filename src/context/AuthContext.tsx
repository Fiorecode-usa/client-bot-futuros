import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { tokenStore } from '../api/tokenStore';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import type { AuthTokens, LoginResponse, UserProfile } from '../types/api';

interface AuthContextValue {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  establishSession: (tokens: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => tokenStore.get());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const me = await usersApi.me();
      setUser(me);
    } catch {
      setUser(null);
      tokenStore.clear();
      setTokens(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (tokens) {
        await loadProfile();
      }
      setLoading(false);
    })();
  }, [tokens, loadProfile]);

  const establishSession = useCallback(
    async (result: AuthTokens): Promise<void> => {
      tokenStore.set(result);
      setTokens(result);
      await loadProfile();
    },
    [loadProfile],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      return authApi.login(email, password);
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authApi.signOut();
    } catch {
      // ignore
    }
    tokenStore.clear();
    setTokens(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      loading,
      login,
      establishSession,
      signOut,
      refreshUser: loadProfile,
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, tokens, loading, login, establishSession, signOut, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
