import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { VerifyEmailPage } from './pages/Auth/VerifyEmailPage';
import { HomePage } from './pages/Home/HomePage';
import { ConfigPage } from './pages/Config/ConfigPage';
import { TradesPage } from './pages/Trades/TradesPage';
import { Layout } from './components/Layout/Layout';
import type { JSX } from 'react';

function AppLoading(): JSX.Element {
  return <div className="app-loading">Cargando…</div>;
}

function RootRedirect(): JSX.Element {
  const { tokens, loading } = useAuth();
  if (loading) return <AppLoading />;
  return <Navigate to={tokens ? '/dashboard' : '/login'} replace />;
}

function GuestLayout(): JSX.Element {
  const { tokens, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (tokens) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function ProtectedLayout(): JSX.Element {
  const { tokens, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (!tokens) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<GuestLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />
          </Route>

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/trades" element={<TradesPage />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
