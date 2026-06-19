'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpenText,
  CalendarDays,
  FileSignature,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Pill,
  Settings,
  ShieldCheck,
  UserCircle,
  UserCog,
  UsersRound,
} from 'lucide-react';
import { apiBase, ensureAuthenticatedSession } from './api-client';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'ASSISTANT' | 'RECEPTION' | 'CASHIER' | 'PHARMACY' | 'LABORATORY' | 'ACCOUNTING';

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
  name: string;
  minsaCode?: string;
};

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMINISTRACIÓN',
  DOCTOR: 'MÉDICO EVENTUAL',
  ASSISTANT: 'ASISTENTE',
  RECEPTION: 'RECEPCIÓN',
  CASHIER: 'CAJA',
  PHARMACY: 'FARMACIA',
  LABORATORY: 'LABORATORIO',
  ACCOUNTING: 'CONTABILIDAD',
};

const baseNav = [
  { label: 'Panel principal', href: '/panel', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTION', 'PHARMACY', 'LABORATORY', 'ASSISTANT', 'CASHIER', 'ACCOUNTING'] },
  { label: 'Pacientes', href: '/pacientes', icon: UsersRound, roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'ASSISTANT'] },
  { label: 'Citas', href: '/citas', icon: CalendarDays, roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'ASSISTANT'] },
  { label: 'Expediente', href: '/expediente', icon: Activity, roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY', 'ASSISTANT'] },
  { label: 'Farmacia', href: '/farmacia', icon: Pill, roles: ['SUPER_ADMIN', 'PHARMACY'] },
  { label: 'Laboratorio', href: '/laboratorio', icon: FlaskConical, roles: ['SUPER_ADMIN', 'DOCTOR', 'LABORATORY'] },
  { label: 'Crear orden', href: '/laboratorio/ordenes/nueva', icon: FileSignature, roles: ['RECEPTION'] },
  { label: 'Productos', href: '/farmacia/productos', icon: Pill, roles: ['SUPER_ADMIN', 'PHARMACY'] },
  { label: 'Inventario', href: '/farmacia/inventario', icon: PackageSearch, roles: ['SUPER_ADMIN', 'PHARMACY'] },
  { label: 'Punto de venta', href: '/farmacia/venta', icon: PackageSearch, roles: ['SUPER_ADMIN', 'PHARMACY', 'CASHIER'] },
  { label: 'Usuarios y médicos', href: '/usuarios', icon: UserCog, roles: ['SUPER_ADMIN'] },
  { label: 'Configuración clínica', href: '/configuracion/clinica', icon: Settings, roles: ['SUPER_ADMIN'] },
  { label: 'Recetas y documentos', href: '/recetas/nueva', icon: FileSignature, roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION'] },
  { label: 'Recetario Digital', href: '/recetario', icon: BookOpenText, roles: ['SUPER_ADMIN', 'DOCTOR', 'PHARMACY'] },
  { label: 'Auditoría', href: '/auditoria', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
  { label: 'Página pública', href: '/admin/pagina-publica', icon: Settings, roles: ['SUPER_ADMIN'] },
];

export function decodeSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions ?? [],
      name: payload.name ?? payload.fullName ?? payload.email,
      minsaCode: payload.minsaCode,
    };
  } catch {
    return null;
  }
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => setUser(decodeSession()), []);
  return user;
}

export function signOut(router: ReturnType<typeof useRouter>, message = 'Sesión cerrada correctamente') {
  const refreshToken = localStorage.getItem('refreshToken');
  const accessToken = localStorage.getItem('accessToken');
  if (refreshToken && accessToken) {
    void fetch(`${apiBase}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.setItem('sessionMessage', message);
  router.replace('/login');
}

export function allowedNav(role?: string) {
  return baseNav.filter((item) => role && item.roles.includes(role));
}

export function canAccess(role: string | undefined, module: string) {
  if (!role) return false;
  const map: Record<string, string[]> = {
    panel: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTION', 'PHARMACY', 'LABORATORY', 'ASSISTANT', 'CASHIER', 'ACCOUNTING'],
    users: ['SUPER_ADMIN'],
    clinicSettings: ['SUPER_ADMIN'],
    prescriptions: ['SUPER_ADMIN', 'DOCTOR'],
    digitalPrescriptions: ['SUPER_ADMIN', 'DOCTOR', 'PHARMACY'],
    audit: ['SUPER_ADMIN'],
    pharmacy: ['SUPER_ADMIN', 'PHARMACY'],
    laboratory: ['SUPER_ADMIN', 'DOCTOR', 'LABORATORY', 'RECEPTION'],
    expediente: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY', 'ASSISTANT'],
    patients: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'ASSISTANT'],
    appointments: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'ASSISTANT'],
    publicAdmin: ['SUPER_ADMIN'],
  };
  return (map[module] ?? ['SUPER_ADMIN']).includes(role);
}

export function ProtectedModule({ module, children }: { module: string; children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void ensureAuthenticatedSession().then((authenticated) => {
      if (!active) return;
      const session = authenticated ? decodeSession() : null;
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setUser(session);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return <main className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Cargando accesos...</main>;
  if (!canAccess(user?.role, module)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold">No tiene permiso para acceder a este módulo.</h1>
          <p className="mt-2 text-sm text-slate-500">Ingrese con un usuario autorizado o vuelva al panel principal.</p>
          <Link href="/panel" className="mt-5 inline-flex h-10 items-center rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white">Volver al panel principal</Link>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}

export function AppSidebar({ active }: { active: string }) {
  const router = useRouter();
  const user = useSession();
  const items = useMemo(() => allowedNav(user?.role), [user?.role]);
  return (
    <aside className="flex min-h-screen flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 max-lg:hidden">
      <div className="mb-8">
        <img src="/clinica-keyser-logo.jpg" alt="Clínica Keyser" className="mb-3 h-14 w-14 rounded-lg object-contain" />
        <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Clínica Keyser</p>
        <h1 className="mt-1 text-xl font-semibold">ERP / EMR</h1>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium ${item.label === active ? 'bg-teal-50 text-clinic-teal dark:bg-teal-950' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={() => signOut(router)} className="mt-auto flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950">
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </aside>
  );
}

export function UserMenu() {
  const router = useRouter();
  const user = useSession();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-clinic-teal dark:bg-teal-950">
          <UserCircle className="h-5 w-5" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-semibold">{user.name}</span>
          <span className="block text-xs text-slate-500">{roleLabels[user.role] ?? user.role}{user.minsaCode ? ` · MINSA ${user.minsaCode}` : ''}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Link href="/configuracion/medicos" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Ver perfil</Link>
          <button onClick={() => signOut(router, 'Cambie de usuario para continuar')} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Cambiar usuario</button>
          <button onClick={() => signOut(router)} className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950">Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}
