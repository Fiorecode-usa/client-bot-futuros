import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { AuthShell, authStyles as styles } from './AuthShell';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { authApi } from '../../api/auth';

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await authApi.signUp(email, password);
      navigate(`/verify?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      if (err instanceof AxiosError) {
        const code = err.response?.data?.error?.code;
        const msg = err.response?.data?.error?.message || err.message;
        if (code === 'CONFLICT') {
          setError('Este email ya está registrado. Inicia sesión o restablece tu contraseña.');
        } else {
          setError(msg);
        }
      } else {
        setError('Error al crear cuenta');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Te enviaremos un código de verificación a tu email."
    >
      <form onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          hint="Debe incluir mayúsculas, minúsculas y números."
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Repite tu contraseña"
        />
        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </div>
      </form>
      <div className={styles.altLink}>
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </div>
    </AuthShell>
  );
}
