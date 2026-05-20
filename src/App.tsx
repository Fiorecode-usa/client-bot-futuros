import { FormEvent, useCallback, useEffect, useState } from 'react';
import { lookupByEmail, setApiKeys, setRiskPercent as saveRiskPercent, toggleBot, type LookupResult } from './api';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { clearSession, loadSession, saveSession } from './session';

type StatusVariant = 'info' | 'success' | 'warning' | 'error';

interface Status {
  message: string;
  variant: StatusVariant;
}

function statusFromUser(user: LookupResult): Status | null {
  if (user.pagoValido !== 'TRUE') {
    return {
      message: 'Tu membresía no está activa. Contacta soporte en Telegram para activar el pago.',
      variant: 'warning',
    };
  }
  if (!user.hasApiKeys) {
    return { message: 'Membresía activa. Configura tus API keys para activar el bot.', variant: 'info' };
  }
  if (user.botActivo === 'TRUE') {
    return { message: 'Tu bot está activo y operando.', variant: 'success' };
  }
  return { message: 'Todo listo. Puedes activar el bot.', variant: 'success' };
}

let sessionRestored = false;

export default function App() {
  const [email, setEmail] = useState('');
  const [currentUser, setCurrentUser] = useState<LookupResult | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [keysFormVisible, setKeysFormVisible] = useState(false);
  const [riskPercent, setRiskPercent] = useState(2);
  const [verifying, setVerifying] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [savingRisk, setSavingRisk] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);

  const { showHelp, helpText, showInstallButton, install } = useInstallPrompt();

  const paid = currentUser?.pagoValido === 'TRUE';
  const active = currentUser?.botActivo === 'TRUE';
  const showPaidSections = Boolean(currentUser && paid);

  const applyUserState = useCallback((user: LookupResult, nextStatus?: Status | null) => {
    setCurrentUser(user);
    saveSession({ email: user.email, uid: user.uid });
    setRiskPercent(user.riskPercent);

    if (!user.hasApiKeys && user.pagoValido === 'TRUE') {
      setKeysFormVisible(true);
    }

    setStatus(nextStatus ?? statusFromUser(user));
  }, []);

  const verifyEmail = useCallback(
    async (value: string) => {
      setVerifying(true);
      setCurrentUser(null);
      setStatus(null);
      setKeysFormVisible(false);

      try {
        const user = await lookupByEmail(value);
        applyUserState(user);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo verificar';
        setStatus({ message: msg, variant: 'error' });
        clearSession();
      } finally {
        setVerifying(false);
      }
    },
    [applyUserState],
  );

  useEffect(() => {
    if (sessionRestored) return;
    sessionRestored = true;

    const saved = loadSession();
    if (saved?.email) {
      setEmail(saved.email);
      void verifyEmail(saved.email);
    }
  }, [verifyEmail]);

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    await verifyEmail(value);
  }

  async function handleSaveKeys(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser) return;

    const fd = new FormData(e.currentTarget);
    const exchangeId = String(fd.get('exchangeId') ?? '').trim();

    setSavingKeys(true);
    try {
      const updated = await setApiKeys(currentUser.uid, {
        apiKey: String(fd.get('apiKey')),
        secretKey: String(fd.get('secretKey')),
        ...(exchangeId ? { exchangeId } : {}),
      });
      e.currentTarget.reset();
      setKeysFormVisible(false);
      applyUserState(updated, { message: 'API keys guardadas correctamente.', variant: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar las keys';
      setStatus({ message: msg, variant: 'error' });
    } finally {
      setSavingKeys(false);
    }
  }

  async function handleSaveRisk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser) return;

    setSavingRisk(true);
    try {
      const updated = await saveRiskPercent(currentUser.uid, riskPercent);
      applyUserState(updated, {
        message: `Pérdida máxima configurada: ${riskPercent}% de tu saldo si toca el stop loss.`,
        variant: 'success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setStatus({ message: msg, variant: 'error' });
    } finally {
      setSavingRisk(false);
    }
  }

  async function handleToggleBot(nextActive: boolean) {
    if (!currentUser) return;

    setTogglingBot(true);
    try {
      const updated = await toggleBot(currentUser.uid, nextActive);
      applyUserState(updated, {
        message: nextActive ? 'Bot activado correctamente.' : 'Bot desactivado.',
        variant: 'success',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar el bot';
      setStatus({ message: msg, variant: 'error' });
    } finally {
      setTogglingBot(false);
    }
  }

  const showKeysToggle = Boolean(currentUser && paid && currentUser.hasApiKeys);
  const showKeysForm = showPaidSections && (keysFormVisible || !currentUser?.hasApiKeys);

  return (
    <div className="app">
      <header className="header">
        <div className="logo" aria-hidden="true">
          ⚡
        </div>
        <h1>Bot Futuros</h1>
        <p className="subtitle">Control de tu bot</p>
      </header>

      <main className="card">
        <form onSubmit={handleVerify} noValidate>
          <label htmlFor="email">Email registrado</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" disabled={verifying}>
            Verificar cuenta
          </button>
        </form>

        {status && (
          <div className={`status status--${status.variant}`} role="status" aria-live="polite">
            {status.message}
          </div>
        )}

        {showPaidSections && (
          <section className="keys-section">
            <h2 className="keys-title">API keys del exchange</h2>
            <p className="keys-hint">Se guardan cifradas. Solo tú las configuras aquí.</p>

            {showKeysForm && (
              <form onSubmit={handleSaveKeys}>
                <label htmlFor="api-key">API Key</label>
                <input
                  id="api-key"
                  name="apiKey"
                  type="password"
                  autoComplete="off"
                  required
                  minLength={8}
                />

                <label htmlFor="secret-key">Secret Key</label>
                <input
                  id="secret-key"
                  name="secretKey"
                  type="password"
                  autoComplete="off"
                  required
                  minLength={8}
                />

                <label htmlFor="exchange-id">Exchange (opcional)</label>
                <input
                  id="exchange-id"
                  name="exchangeId"
                  type="text"
                  placeholder="binanceusdm"
                  maxLength={40}
                />

                <button type="submit" className="btn btn-secondary" disabled={savingKeys}>
                  Guardar API keys
                </button>
              </form>
            )}

            {showKeysToggle && (
              <button
                type="button"
                className="btn-link"
                onClick={() => setKeysFormVisible((v) => !v)}
              >
                {keysFormVisible ? 'Ocultar formulario' : 'Cambiar API keys'}
              </button>
            )}
          </section>
        )}

        {showPaidSections && (
          <section className="risk-section">
            <h2 className="keys-title">Configuración de trading</h2>
            <p className="keys-hint">
              Margen <strong>isolated</strong>. El bot calcula el apalancamiento según tu saldo. El
              % es la <strong>pérdida máxima</strong> si toca el stop loss.
            </p>
            <form onSubmit={handleSaveRisk}>
              <label htmlFor="risk-percent">
                Pérdida máxima por operación ({riskPercent}% del saldo)
              </label>
              <input
                id="risk-percent"
                name="riskPercent"
                type="range"
                min={0.5}
                max={100}
                step={0.5}
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
              />
              <button type="submit" className="btn btn-secondary" disabled={savingRisk}>
                Guardar riesgo
              </button>
            </form>
          </section>
        )}

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!paid || active || !currentUser?.hasApiKeys || togglingBot}
            onClick={() => void handleToggleBot(true)}
          >
            Activar bot
          </button>
          {paid && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={!active || togglingBot}
              onClick={() => void handleToggleBot(false)}
            >
              Desactivar bot
            </button>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Membresía activa requerida para operar.</p>
        {showHelp && (
          <div className="install-help">
            <strong>📲 Instalar en el celular</strong>
            <p>{helpText}</p>
          </div>
        )}
        {showInstallButton && (
          <button type="button" className="btn-install" onClick={() => void install()}>
            Instalar app
          </button>
        )}
      </footer>
    </div>
  );
}
