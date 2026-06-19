'use client';

export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let refreshInFlight: Promise<string | null> | null = null;

function tokenExpiresSoon(token: string, thresholdSeconds = 30) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    return !payload.exp || payload.exp * 1000 <= Date.now() + thresholdSeconds * 1000;
  } catch {
    return true;
  }
}

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export async function refreshAccessToken() {
  if (typeof window === 'undefined') return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${apiBase}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        clearSession();
        return null;
      }
      const tokens = (await response.json()) as { accessToken: string; refreshToken: string };
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      return tokens.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function ensureAuthenticatedSession() {
  if (typeof window === 'undefined') return false;
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken && !tokenExpiresSoon(accessToken)) return true;
  return Boolean(await refreshAccessToken());
}

export async function authenticatedFetch(path: string, options: RequestInit = {}) {
  let token = localStorage.getItem('accessToken');
  if (!token || tokenExpiresSoon(token)) token = await refreshAccessToken();

  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiBase}${path}`, { ...options, headers, credentials: 'include' });
  if (response.status !== 401) return response;

  token = await refreshAccessToken();
  if (!token) return response;
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${apiBase}${path}`, { ...options, headers, credentials: 'include' });
}

export async function apiJson<T>(path: string, options: RequestInit = {}) {
  const response = await authenticatedFetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'No se pudo completar la acción' }));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
  return response.json() as Promise<T>;
}

export function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}
