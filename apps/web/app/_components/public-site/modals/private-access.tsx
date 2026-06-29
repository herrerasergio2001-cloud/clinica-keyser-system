'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AlertTriangle, Loader2, LockKeyhole, X } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function PrivateAccessModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      window.location.href = '/panel';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#142044]/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-md rounded-[22px] bg-white p-7 text-[#1b2a57] shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="private-access-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b2a57] text-white">
              <LockKeyhole className="h-7 w-7" />
            </span>
            <h2 id="private-access-title" className="mt-5 text-2xl font-bold tracking-[-0.01em]">Acceso privado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sistema EMR / ERP para personal autorizado de Clínica Keyser.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-600">
            Correo
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required className="h-12 rounded-xl border border-slate-200 px-4 text-[15px] text-[#1b2a57] outline-none focus:border-[#1b2a57]" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-600">
            Contraseña
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="h-12 rounded-xl border border-slate-200 px-4 text-[15px] text-[#1b2a57] outline-none focus:border-[#1b2a57]" />
          </label>
          <button disabled={loading} className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1b2a57] px-4 text-sm font-bold text-white shadow-lg shadow-[#1b2a57]/20 transition hover:bg-[#16234a] disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {loading ? 'Ingresando...' : 'Entrar al EMR'}
          </button>
          <Link href="/login?next=/panel" className="text-center text-sm font-semibold text-slate-500 hover:text-[#1b2a57]">
            Usar pantalla clásica de inicio de sesión
          </Link>
        </form>
      </section>
    </div>
  );
}
