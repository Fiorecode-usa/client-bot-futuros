import axios, { type AxiosInstance, AxiosError } from 'axios';
import { tokenStore } from './tokenStore';


const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

export const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 15_000,
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
      tokenStore.set(data);
      return data.idToken as string;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.request.use((cfg) => {
  const isPublicAuth = cfg.url?.startsWith('/auth/');
  if (isPublicAuth) return cfg;
  const token = tokenStore.getIdToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    if (!err.response) throw err;
    const original = err.config as
      | (AxiosError['config'] & { _retried?: boolean })
      | undefined;
    if (err.response.status === 401 && original && !original._retried) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      tokenStore.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw err;
  },
);
