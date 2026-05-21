import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AxiosError } from 'axios';
import { AuthShell, authStyles as styles } from './AuthShell';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { authApi } from '../../api/auth';

export function VerifyEmailPage(): JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState<string>(params.get('email') ?? '');
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await authApi.confirm(email, code);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'Código inválido',
      );
    } finally {
      setBusy(false);
    }
  }

  async function resend(): Promise<void> {
    try {
      await authApi.resend(email);
      setInfo('Código reenviado a tu email.');
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'No fue posible reenviar',
      );
    }
  }

  return (
    <AuthShell
      title="Verificar email"
      subtitle="Introduce el código de 6 dígitos que enviamos a tu correo."
    >
      <form onSubmit={submit} className={styles.form}>
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
          required
        />
        <Input
          label="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
        />
        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? 'Verificando…' : 'Verificar'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={resend}>
            Reenviar código
          </Button>
        </div>
      </form>
      <div className={styles.altLink}>
        <Link to="/login">Volver al inicio</Link>
      </div>
    </AuthShell>
  );
}
