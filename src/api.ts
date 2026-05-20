const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

export interface LookupResult {
  uid: string;
  email: string;
  pagoValido: 'TRUE' | 'FALSE';
  botActivo: 'TRUE' | 'FALSE';
  hasApiKeys: boolean;
  isReadyToTrade: boolean;
  riskPercent: number;
}

interface ApiEnvelope<T> {
  data: T;
}

interface ApiErrorBody {
  error?: { message?: string; code?: string };
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.message ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export async function lookupByEmail(email: string): Promise<LookupResult> {
  const res = await fetch(`${baseUrl}/api/v1/users/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const json = (await res.json()) as ApiEnvelope<LookupResult>;
  return json.data;
}

interface UserPublic extends LookupResult {
  nombre: string;
  apellido: string;
  pais: string;
  exchangeId: string;
}

function toLookupResult(data: UserPublic): LookupResult {
  return {
    uid: data.uid,
    email: data.email,
    pagoValido: data.pagoValido,
    botActivo: data.botActivo,
    hasApiKeys: data.hasApiKeys,
    isReadyToTrade: data.isReadyToTrade,
    riskPercent: data.riskPercent,
  };
}

export async function setRiskPercent(uid: string, riskPercent: number): Promise<LookupResult> {
  const res = await fetch(`${baseUrl}/api/v1/users/${uid}/risk-percent`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riskPercent }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const json = (await res.json()) as ApiEnvelope<UserPublic>;
  return toLookupResult(json.data);
}

export async function setApiKeys(
  uid: string,
  input: { apiKey: string; secretKey: string; exchangeId?: string },
): Promise<LookupResult> {
  const res = await fetch(`${baseUrl}/api/v1/users/${uid}/api-keys`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: input.apiKey,
      secretKey: input.secretKey,
      ...(input.exchangeId ? { exchangeId: input.exchangeId } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const json = (await res.json()) as ApiEnvelope<UserPublic>;
  return toLookupResult(json.data);
}

export async function toggleBot(uid: string, active: boolean): Promise<LookupResult> {
  const res = await fetch(`${baseUrl}/api/v1/users/${uid}/toggle-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const json = (await res.json()) as ApiEnvelope<UserPublic>;
  return toLookupResult(json.data);
}
