import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { exchangesApi } from '../../api/exchanges';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import styles from './Config.module.css';

export function ConfigPage(): JSX.Element {
  const { user, refreshUser } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [riskPct, setRiskPct] = useState<number>(20);
  const [configured, setConfigured] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    try {
      const status = await exchangesApi.status();
      setConfigured(status.configured);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (user) setRiskPct(user.riskPct);
  }, [refresh, user]);

  async function saveCreds(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await exchangesApi.saveBinance(apiKey, apiSecret);
      setApiKey('');
      setApiSecret('');
      setInfo('Credenciales guardadas y verificadas correctamente.');
      await refresh();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'No fue posible guardar',
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveRisk(): Promise<void> {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await usersApi.updateRisk(riskPct);
      await refreshUser();
      setInfo('Riesgo actualizado.');
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'No fue posible actualizar',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeCreds(): Promise<void> {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await exchangesApi.remove();
      setInfo('Credenciales eliminadas.');
      await refresh();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.error?.message || err.message
          : 'No fue posible eliminar',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Configuración</h1>
        <p className={styles.subtitle}>
          Conecta tu cuenta de Binance Futures y define tu riesgo por trade.
        </p>
      </div>

      {info && <div className={styles.success}>{info}</div>}
      {error && <div className={styles.alert}>{error}</div>}

      <div className={styles.card}>
        <div className={styles.statusRow}>
          <h2 className={styles.cardTitle}>Binance Futures · BTC/USDC</h2>
          <Badge tone={configured ? 'green' : 'neutral'}>
            {configured ? 'Configurado' : 'No configurado'}
          </Badge>
        </div>
        <p className={styles.cardDescription}>
          Tus API Keys se cifran con AWS KMS antes de almacenarse. Nunca se guardan en
          texto plano y solo se desencriptan en memoria durante la ejecución.
        </p>
        <div className={styles.notice}>
          Crea una API Key en Binance con permisos de futuros activados, sin retiros
          y restringida a tu IP del servidor. Ese key se usará exclusivamente para
          operar BTC/USDC perpetuos.
        </div>
        <form onSubmit={saveCreds} className={styles.form}>
          <Input
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Binance API key"
            autoComplete="off"
          />
          <Input
            label="API Secret"
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Binance secret"
            autoComplete="off"
          />
          <div className={styles.cta}>
            <Button type="submit" disabled={busy || !apiKey || !apiSecret}>
              {busy ? 'Guardando…' : configured ? 'Reemplazar credenciales' : 'Guardar credenciales'}
            </Button>
            {configured && (
              <Button
                type="button"
                variant="danger"
                onClick={removeCreds}
                disabled={busy}
              >
                Eliminar
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Riesgo por trade</h2>
        <p className={styles.cardDescription}>
          Porcentaje máximo de tu equity en riesgo por operación (pérdida máxima
          si salta el stop). Ejemplo: 20% con $100 ≈ $20 por trade; 25% con $20 ≈ $5.
        </p>
        <div className={styles.row}>
          <Input
            label="Riesgo %"
            type="number"
            step="1"
            min="5"
            max="25"
            value={String(riskPct)}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            hint="Rango permitido: 5% – 25%. Mínimo de cuenta: $20 USDC."
          />
        </div>
        <div className={styles.cta}>
          <Button onClick={saveRisk} disabled={busy}>
            Guardar riesgo
          </Button>
        </div>
      </div>
    </div>
  );
}
