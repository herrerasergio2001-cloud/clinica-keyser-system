'use client';

export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = fetch(`${apiBase}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export async function ensureAuthenticatedSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const ok = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' }).then((r) => r.ok).catch(() => false);
  if (ok) return true;
  return attemptRefresh();
}

export async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${apiBase}${path}`, { ...options, credentials: 'include' });
  if (response.status !== 401) return response;

  const refreshed = await attemptRefresh();
  if (!refreshed) return response;
  return fetch(`${apiBase}${path}`, { ...options, credentials: 'include' });
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'No se pudo completar la acción' }));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : (body.message as string));
  }
  return response.json() as Promise<T>;
}

export function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}
