import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { AuthShell, authStyles as styles } from './AuthShell';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { isNewPasswordChallenge } from '../../types/api';

const PASSWORD_SESSION_KEY = 'bot-futuros:password-change-session';

type AuthStep = 'login' | 'forgot' | 'confirm_reset' | 'force_password';

function parseError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.error?.message || err.message;
  }
  return fallback;
}

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login, establishSession } = useAuth();

  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const result = await login(email, password);
      if (isNewPasswordChallenge(result)) {
        sessionStorage.setItem(
          PASSWORD_SESSION_KEY,
          JSON.stringify({ session: result.session }),
        );
        setStep('force_password');
        return;
      }
      await establishSession(result);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(parseError(err, 'No fue posible iniciar sesión'));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await authApi.forgotPassword(email);
      setInfo('Código enviado a tu email.');
      setStep('confirm_reset');
    } catch (err) {
      setError(parseError(err, 'No fue posible enviar el código'));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReset(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await authApi.confirmForgotPassword(email, code, newPassword);
      setInfo('Contraseña restablecida. Ya puedes iniciar sesión.');
      setPassword('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('login');
    } catch (err) {
      setError(parseError(err, 'Código inválido o contraseña no válida'));
    } finally {
      setBusy(false);
    }
  }

  async function handleForcePassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const raw = sessionStorage.getItem(PASSWORD_SESSION_KEY);
      if (!raw) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      const { session } = JSON.parse(raw) as { session: string };
      const tokens = await authApi.forcePasswordChange(email, session, newPassword);
      sessionStorage.removeItem(PASSWORD_SESSION_KEY);
      await establishSession(tokens);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(parseError(err, 'No fue posible establecer la nueva contraseña'));
    } finally {
      setBusy(false);
    }
  }

  function backToLogin(): void {
    setStep('login');
    setError('');
    setInfo('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
  }

  if (step === 'forgot') {
    return (
      <AuthShell
        title="Restablecer contraseña"
        subtitle="Te enviaremos un código de verificación a tu correo."
      >
        <form onSubmit={handleForgot} className={styles.form}>
          {error && <div className={styles.alert}>{error}</div>}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
          <div className={styles.actions}>
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar código'}
            </Button>
          </div>
        </form>
        <div className={styles.altLink}>
          <button type="button" className={styles.linkBtn} onClick={backToLogin}>
            Volver al inicio de sesión
          </button>
        </div>
      </AuthShell>
    );
  }

  if (step === 'confirm_reset') {
    return (
      <AuthShell
        title="Nueva contraseña"
        subtitle={`Introduce el código enviado a ${email}`}
      >
        <form onSubmit={handleConfirmReset} className={styles.form}>
          {error && <div className={styles.alert}>{error}</div>}
          {info && (
            <div
              className={styles.alert}
              style={{
                background: 'var(--green-dim)',
                color: 'var(--green)',
                borderColor: 'rgba(30,194,139,0.3)',
              }}
            >
              {info}
            </div>
          )}
          <Input
            label="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          <div className={styles.actions}>
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Guardando…' : 'Restablecer contraseña'}
            </Button>
          </div>
        </form>
        <div className={styles.altLink}>
          <button type="button" className={styles.linkBtn} onClick={backToLogin}>
            Volver al inicio de sesión
          </button>
        </div>
      </AuthShell>
    );
  }

  if (step === 'force_password') {
    return (
      <AuthShell
        title="Nueva contraseña requerida"
        subtitle="Debes establecer una contraseña nueva para continuar."
      >
        <form onSubmit={handleForcePassword} className={styles.form}>
          {error && <div className={styles.alert}>{error}</div>}
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          <div className={styles.actions}>
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Guardando…' : 'Continuar'}
            </Button>
          </div>
        </form>
        <div className={styles.altLink}>
          <button type="button" className={styles.linkBtn} onClick={backToLogin}>
            Volver al inicio de sesión
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu panel de trading institucional."
    >
      <form onSubmit={handleLogin} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}
        {info && (
          <div
            className={styles.alert}
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
              borderColor: 'rgba(30,194,139,0.3)',
            }}
          >
            {info}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          placeholder="tu@email.com"
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        <div className={styles.forgotRow}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => {
              setStep('forgot');
              setError('');
              setInfo('');
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? 'Iniciando…' : 'Iniciar sesión'}
          </Button>
        </div>
      </form>
      <div className={styles.altLink}>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </div>
    </AuthShell>
  );
}
