import Link from 'next/link';
import { ArrowLeft, FileText, Home, Search } from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu } from '../../_components/session';

export function ClinicalShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <ProtectedModule module="expediente">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <AppSidebar active="Expediente" />
        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900 max-sm:flex-col max-sm:items-start">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Link href="/panel" className="inline-flex items-center gap-1 text-clinic-teal"><Home className="h-3.5 w-3.5" />Inicio</Link>
                <span>/</span>
                <Link href="/pacientes" className="hover:text-clinic-teal">Pacientes</Link>
                <span>/</span>
                <span>Expediente</span>
                <span>/</span>
                <span>{subtitle}</span>
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <UserMenu />
              <Link href="/pacientes" className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4" />
                Regresar
              </Link>
              <div className="flex h-10 w-72 max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950">
                <Search className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-500">Buscar expediente o paciente</span>
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
    </ProtectedModule>
  );
}

export function SectionTitle({ title, icon: Icon = FileText }: { title: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-clinic-teal" />
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

export function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-900 dark:text-slate-100">{value || 'No registrado'}</p>
    </div>
  );
}

export function TextInput({ label, name, type = 'text' }: { label: string; name: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <input name={name} type={type} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

export function TextArea({ label, name, rows = 4 }: { label: string; name: string; rows?: number }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <textarea name={name} rows={rows} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}
