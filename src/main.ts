import './styles.css';
import { lookupByEmail, setApiKeys, setRiskPercent, toggleBot, type LookupResult } from './api.js';

const STORAGE_KEY = 'bot-futuros-session';

interface Session {
  email: string;
  uid: string;
}

const form = document.getElementById('verify-form') as HTMLFormElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const btnVerify = document.getElementById('btn-verify') as HTMLButtonElement;
const keysSection = document.getElementById('keys-section') as HTMLElement;
const formKeys = document.getElementById('form-keys') as HTMLFormElement;
const btnSaveKeys = document.getElementById('btn-save-keys') as HTMLButtonElement;
const btnToggleKeys = document.getElementById('btn-toggle-keys') as HTMLButtonElement;
const btnActivate = document.getElementById('btn-activate') as HTMLButtonElement;
const btnDeactivate = document.getElementById('btn-deactivate') as HTMLButtonElement;
const riskSection = document.getElementById('risk-section') as HTMLElement;
const formRisk = document.getElementById('form-risk') as HTMLFormElement;
const riskInput = document.getElementById('risk-percent') as HTMLInputElement;
const riskValue = document.getElementById('risk-value') as HTMLSpanElement;
const btnSaveRisk = document.getElementById('btn-save-risk') as HTMLButtonElement;

let currentUser: LookupResult | null = null;
let keysFormVisible = false;

function setStatus(message: string, variant: 'info' | 'success' | 'warning' | 'error') {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status status--${variant}`;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = '';
  statusEl.className = 'status';
}

function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function setKeysFormVisible(visible: boolean) {
  keysFormVisible = visible;
  formKeys.hidden = !visible;
  const paid = currentUser?.pagoValido === 'TRUE';
  const hasKeys = currentUser?.hasApiKeys ?? false;
  btnToggleKeys.hidden = !currentUser || !paid || !hasKeys;
  btnToggleKeys.textContent = visible ? 'Ocultar formulario' : 'Cambiar API keys';
}

function updateRiskSection(user: LookupResult | null) {
  const paid = user?.pagoValido === 'TRUE';
  riskSection.hidden = !user || !paid;
  if (user && paid) {
    riskInput.value = String(user.riskPercent);
    riskValue.textContent = String(user.riskPercent);
  }
}

function updateKeysSection(user: LookupResult | null) {
  const paid = user?.pagoValido === 'TRUE';
  keysSection.hidden = !user || !paid;

  if (!user || !paid) {
    setKeysFormVisible(false);
    formKeys.reset();
    return;
  }

  if (!user.hasApiKeys) {
    setKeysFormVisible(true);
    btnToggleKeys.hidden = true;
    return;
  }

  setKeysFormVisible(keysFormVisible);
}

function updateButtons(user: LookupResult | null) {
  const paid = user?.pagoValido === 'TRUE';
  const active = user?.botActivo === 'TRUE';

  btnActivate.disabled = !paid || active || !user?.hasApiKeys;
  btnDeactivate.hidden = !paid;
  btnDeactivate.disabled = !paid || !active;
}

function applyUserState(user: LookupResult) {
  currentUser = user;
  saveSession({ email: user.email, uid: user.uid });
  updateKeysSection(user);
  updateRiskSection(user);

  if (user.pagoValido !== 'TRUE') {
    setStatus(
      'Tu membresía no está activa. Contacta soporte en Telegram para activar el pago.',
      'warning',
    );
    updateButtons(user);
    return;
  }

  if (!user.hasApiKeys) {
    setStatus('Membresía activa. Configura tus API keys para activar el bot.', 'info');
    updateButtons(user);
    return;
  }

  if (user.botActivo === 'TRUE') {
    setStatus('Tu bot está activo y operando.', 'success');
  } else {
    setStatus('Todo listo. Puedes activar el bot.', 'success');
  }

  updateButtons(user);
}

function resetAfterVerifyStart() {
  clearStatus();
  currentUser = null;
  keysSection.hidden = true;
  riskSection.hidden = true;
  formKeys.reset();
  keysFormVisible = false;
  btnActivate.disabled = true;
  btnDeactivate.hidden = true;
  btnDeactivate.disabled = true;
}

async function verifyEmail(email: string) {
  btnVerify.disabled = true;
  resetAfterVerifyStart();

  try {
    const user = await lookupByEmail(email);
    applyUserState(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No se pudo verificar';
    setStatus(msg, 'error');
    localStorage.removeItem(STORAGE_KEY);
  } finally {
    btnVerify.disabled = false;
  }
}

async function saveKeys(e: Event) {
  e.preventDefault();
  if (!currentUser) return;

  const fd = new FormData(formKeys);
  const exchangeId = String(fd.get('exchangeId') ?? '').trim();

  btnSaveKeys.disabled = true;

  try {
    const updated = await setApiKeys(currentUser.uid, {
      apiKey: String(fd.get('apiKey')),
      secretKey: String(fd.get('secretKey')),
      ...(exchangeId ? { exchangeId } : {}),
    });
    formKeys.reset();
    keysFormVisible = false;
    applyUserState(updated);
    setStatus('API keys guardadas correctamente.', 'success');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar las keys';
    setStatus(msg, 'error');
  } finally {
    btnSaveKeys.disabled = false;
  }
}

async function setBotActive(active: boolean) {
  if (!currentUser) return;

  const btn = active ? btnActivate : btnDeactivate;
  btn.disabled = true;
  btnActivate.disabled = true;
  btnDeactivate.disabled = true;

  try {
    const updated = await toggleBot(currentUser.uid, active);
    applyUserState(updated);
    setStatus(
      active ? 'Bot activado correctamente.' : 'Bot desactivado.',
      'success',
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al cambiar el bot';
    setStatus(msg, 'error');
    updateButtons(currentUser);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (!email) return;
  void verifyEmail(email);
});

formKeys.addEventListener('submit', (e) => void saveKeys(e));

riskInput.addEventListener('input', () => {
  riskValue.textContent = riskInput.value;
});

formRisk.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const riskPercent = Number(riskInput.value);
  btnSaveRisk.disabled = true;

  try {
    const updated = await setRiskPercent(currentUser.uid, riskPercent);
    applyUserState(updated);
    setStatus(`Operarás con el ${riskPercent}% de tu saldo total en USDC.`, 'success');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar';
    setStatus(msg, 'error');
  } finally {
    btnSaveRisk.disabled = false;
  }
});

btnToggleKeys.addEventListener('click', () => {
  setKeysFormVisible(!keysFormVisible);
});

btnActivate.addEventListener('click', () => void setBotActive(true));
btnDeactivate.addEventListener('click', () => void setBotActive(false));

const saved = loadSession();
if (saved?.email) {
  emailInput.value = saved.email;
  void verifyEmail(saved.email);
}
