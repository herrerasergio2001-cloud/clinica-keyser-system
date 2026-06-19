'use client';

import { FormEvent, ReactNode, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2, LockKeyhole } from 'lucide-react';
import { apiBase, ensureAuthenticatedSession } from '../_components/api-client';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/panel';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionMessage = sessionStorage.getItem('sessionMessage');
    if (sessionMessage) {
      setMessage(sessionMessage);
      sessionStorage.removeItem('sessionMessage');
    }
    if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
      void ensureAuthenticatedSession().then((valid) => {
        if (valid) router.replace(next);
      });
    }
  }, [next, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Correo o contraseña incorrectos.');
      const tokens = (await response.json()) as { accessToken: string; refreshToken: string };
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginShell>
        <div className="mb-6 flex items-center gap-3">
          <img src="/clinica-keyser-logo.jpg" alt="Clínica Keyser" className="h-12 w-12 rounded-lg object-contain" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Clínica Keyser</p>
            <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {message && <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100">{message}</div>}

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Correo
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Contraseña
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <button disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
    </LoginShell>
  );
}

function LoginShell({ children }: { children?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children ?? (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        )}
      </section>
    </main>
  );
}
