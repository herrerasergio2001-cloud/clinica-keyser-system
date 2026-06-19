'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText, ImageUp, Loader2, Plus, Power, Printer, Save, Settings, Stethoscope, Trash2, UserRound, UsersRound } from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu, canAccess } from './session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Patient = { id: string; fullName: string; patientCode: string; gender?: string; birthDate?: string; phone?: string };
type Doctor = { id: string; fullName: string; email: string; phone?: string; isActive?: boolean; role?: { name: string }; doctorProfile?: { fullName?: string; specialty?: string; minsaCode?: string; phone?: string; signatureUrl?: string; stampUrl?: string; photoUrl?: string; isActive?: boolean } | null };
type ClinicSettings = { clinicName: string; logoUrl?: string; printLogoUrl?: string; primaryColor: string; secondaryColor: string; accentColor?: string; address: string; phoneMain: string; phoneAesthetic?: string; whatsapp?: string; email?: string; website?: string; schedule?: string };

function authHeaders(json = false): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, options);
  if (!response.ok) {
    const raw = await response.text().catch(() => 'No se pudo completar la acción');
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message ?? raw;
    } catch {
      message = raw;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function currentRole() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1] ?? '')).role ?? '';
  } catch {
    return '';
  }
}

function useProtectedData() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    Promise.all([
      api<{ data?: Patient[] } | Patient[]>('/api/patients', { headers: authHeaders() }),
      api<Doctor[]>('/api/doctors', { headers: authHeaders() }),
      api<ClinicSettings>('/api/clinic-settings', { headers: authHeaders() }),
    ])
      .then(([p, d, s]) => {
        setPatients(Array.isArray(p) ? p : p.data ?? []);
        setDoctors(d);
        setSettings(s);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [router]);
  return { patients, doctors, settings, loading, error };
}

function AdminShell({ title, subtitle, children, accessModule = 'panel' }: { title: string; subtitle?: string; children: ReactNode; accessModule?: string }) {
  return (
    <ProtectedModule module={accessModule}>
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
      <AppSidebar active={title.includes('Usuario') ? 'Usuarios y médicos' : title.includes('Configuración') ? 'Configuración clínica' : title.includes('Receta') ? 'Recetas y documentos' : 'Panel principal'} />
      <section className="min-w-0">
      <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Link href="/panel" className="text-clinic-teal">Inicio</Link><span>/</span><span>{title}</span>
            </div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <UserMenu />
            <Link href="/panel" className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Regresar</Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-6">{children}</section>
      </section>
      </div>
    </main>
    </ProtectedModule>
  );
}

export function UsersPage({ mode, userId }: { mode?: 'new' | 'edit'; userId?: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<Doctor[]>([]);
  const [form, setForm] = useState({ email: '', fullName: '', phone: '', password: '', role: 'DOCTOR', isActive: true, professionalName: '', specialty: '', minsaCode: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return router.replace('/login?next=/usuarios');
    api<Doctor[]>(`/api/users?status=${userId ? 'all' : statusFilter}`, { headers: authHeaders() }).then((list) => {
      setUsers(list);
      const current = userId ? list.find((item) => item.id === userId) : undefined;
      if (current) setForm({ email: current.email, fullName: current.fullName, phone: current.phone ?? '', password: '', role: current.role?.name ?? 'DOCTOR', isActive: (current as any).isActive ?? true, professionalName: current.doctorProfile?.fullName ?? current.fullName, specialty: current.doctorProfile?.specialty ?? '', minsaCode: current.doctorProfile?.minsaCode ?? '' });
    }).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar usuarios')).finally(() => setLoading(false));
  }, [router, userId, statusFilter]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (currentRole() !== 'SUPER_ADMIN') {
      setError('Solo SUPER_ADMIN puede crear usuarios o editar códigos MINSA.');
      return;
    }
    if (form.role === 'DOCTOR' && (!form.professionalName.trim() || !form.minsaCode.trim() || !form.specialty.trim())) {
      setError('Para rol MÉDICO complete nombre profesional, código MINSA y especialidad.');
      return;
    }
    setSaving(true);
    const payload = { ...form, password: form.password || undefined };
    const endpoint = userId ? `/api/users/${userId}` : '/api/users';
    const method = userId ? 'PATCH' : 'POST';
    try {
      await api(endpoint, { method, headers: authHeaders(true), body: JSON.stringify(payload) });
      setMessage('Usuario guardado correctamente.');
      if (!userId) router.push('/usuarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: Doctor, enable: boolean) {
    const confirmed = window.confirm(enable ? `¿Reactivar a ${user.fullName}?` : `¿Desactivar a ${user.fullName}? No podrá iniciar sesión.`);
    if (!confirmed) return;
    const reason = window.prompt(enable ? `Motivo para reactivar a ${user.fullName}` : `Motivo para desactivar a ${user.fullName}`);
    if (!reason?.trim()) {
      setError('Debe ingresar un motivo.');
      return;
    }
    try {
      const updated = await api<Doctor>(`/api/users/${user.id}/${enable ? 'enable' : 'disable'}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ reason }) });
      setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)));
      setMessage(enable ? 'Usuario reactivado correctamente.' : 'Usuario desactivado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    }
  }

  async function deleteUser(user: Doctor) {
    if (!window.confirm(`¿Eliminar definitivamente a ${user.fullName}? Si tiene historial clínico asociado, el sistema impedirá la eliminación.`)) return;
    const reason = window.prompt('Motivo de eliminación:');
    if (!reason?.trim()) {
      setError('Debe ingresar un motivo.');
      return;
    }
    try {
      await api(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: authHeaders(true),
        body: JSON.stringify({ reason }),
      });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setMessage('Usuario eliminado definitivamente. La acción quedó en auditoría.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario');
    }
  }

  return (
    <AdminShell title={mode === 'new' ? 'Nuevo usuario' : userId ? 'Editar usuario' : 'Usuarios y médicos'} subtitle="Gestión multiusuario, roles y accesos del ERP/EMR" accessModule="users">
      {loading ? <Loading /> : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={submit} className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-clinic-teal" />{userId ? 'Editar usuario' : 'Crear usuario'}</h2>
            {message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-clinic-teal">{message}</p>}
            {error && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="grid gap-3">
              <Input label="Nombre completo" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} required />
              <Input label="Correo" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
              <Input label="Teléfono" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <Input label="Contraseña" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={!userId} />
              <label className="grid gap-1 text-sm font-medium">Rol
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option><option value="DOCTOR">MÉDICO</option><option value="RECEPTION">RECEPCIÓN</option><option value="LABORATORY">LABORATORIO</option><option value="PHARMACY">FARMACIA</option><option value="ADMIN">ADMINISTRACIÓN</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Usuario activo</label>
              {form.role === 'DOCTOR' && (
                <div className="grid gap-3 rounded-md border border-teal-100 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950">
                  <Input label="Nombre profesional" value={form.professionalName} onChange={(value) => setForm({ ...form, professionalName: value })} required />
                  <Input label="Código MINSA" value={form.minsaCode} onChange={(value) => setForm({ ...form, minsaCode: value })} required />
                  <Input label="Especialidad" value={form.specialty} onChange={(value) => setForm({ ...form, specialty: value })} required />
                </div>
              )}
            </div>
            <button disabled={saving} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" />{saving ? 'Guardando...' : 'Guardar usuario'}</button>
          </form>
          <section className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><UsersRound className="h-4 w-4 text-clinic-teal" />Usuarios registrados</h2>
              <div className="flex gap-2">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-9 rounded-md border bg-white px-2 text-sm dark:bg-slate-950">
                  <option value="active">Activos</option>
                  <option value="inactive">Desactivados</option>
                  <option value="all">Todos</option>
                </select>
                <Link href="/usuarios/nuevo" className="rounded-md bg-clinic-teal px-3 py-2 text-sm font-semibold text-white">Nuevo</Link>
              </div>
            </div>
            <div className="grid gap-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm hover:border-clinic-teal dark:border-slate-700">
                  <Link href={`/usuarios/${user.id}`} className="min-w-0 flex-1">
                    <strong>{user.fullName}</strong>
                    <p className="text-slate-500">{user.email} · {user.role?.name} · {user.isActive ? 'Activo' : 'Inactivo'}</p>
                  </Link>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleUser(user, !user.isActive)}
                      className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold ${user.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-teal-200 text-clinic-teal hover:bg-teal-50'}`}
                    >
                      <Power className="h-3.5 w-3.5" />{user.isActive ? 'Desactivar' : 'Restaurar'}
                    </button>
                    <button type="button" onClick={() => void deleteUser(user)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

export function DoctorsSettingsPage() {
  const { doctors, loading, error } = useProtectedData();
  const [active, setActive] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ fullName: '', specialty: '', minsaCode: '', phone: '', signatureUrl: '', stampUrl: '', isActive: true });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const doctor = doctors[0];
    if (doctor) {
      setActive(doctor);
      setForm({ fullName: doctor.doctorProfile?.fullName ?? doctor.fullName, specialty: doctor.doctorProfile?.specialty ?? '', minsaCode: doctor.doctorProfile?.minsaCode ?? '', phone: doctor.doctorProfile?.phone ?? doctor.phone ?? '', signatureUrl: doctor.doctorProfile?.signatureUrl ?? '', stampUrl: doctor.doctorProfile?.stampUrl ?? '', isActive: doctor.doctorProfile?.isActive ?? true });
    }
  }, [doctors]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!active) return;
    await api(`/api/doctors/${active.id}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify(form) });
    setMessage('Perfil médico guardado correctamente.');
  }

  return (
    <AdminShell title="Configuración de médicos" subtitle="Código MINSA, especialidad, firma y sello por usuario médico" accessModule="panel">
      {loading ? <Loading /> : error ? <p>{error}</p> : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">{doctors.map((doctor) => <button key={doctor.id} onClick={() => setActive(doctor)} className={`mb-2 block w-full rounded-md border p-3 text-left text-sm ${active?.id === doctor.id ? 'border-clinic-teal bg-teal-50 text-clinic-teal' : 'border-slate-200'}`}>{doctor.fullName}<p className="text-xs text-slate-500">{doctor.doctorProfile?.minsaCode ?? 'Sin MINSA'}</p></button>)}</div>
          <form onSubmit={save} className="rounded-lg border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-semibold">Perfil profesional</h2>{message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-clinic-teal">{message}</p>}
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Nombre profesional" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
              <Input label="Código MINSA" value={form.minsaCode} onChange={(value) => setForm({ ...form, minsaCode: value })} />
              <Input label="Especialidad / perfil" value={form.specialty} onChange={(value) => setForm({ ...form, specialty: value })} />
              <Input label="Teléfono" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <Input label="URL firma" value={form.signatureUrl} onChange={(value) => setForm({ ...form, signatureUrl: value })} />
              <Input label="URL sello" value={form.stampUrl} onChange={(value) => setForm({ ...form, stampUrl: value })} />
            </div>
            <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" />Guardar perfil</button>
          </form>
        </div>
      )}
    </AdminShell>
  );
}

export function ClinicSettingsPage() {
  const { settings, loading } = useProtectedData();
  const [form, setForm] = useState<ClinicSettings | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (settings) setForm(settings); }, [settings]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const saved = await api<ClinicSettings>('/api/clinic-settings', { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify(form) });
    setForm(saved); setMessage('Configuración guardada correctamente.');
  }
  async function uploadLogo(file?: File) {
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    try {
      const saved = await api<ClinicSettings>('/api/clinic-settings/logo', { method: 'POST', headers: authHeaders(false), body: data });
      setForm(saved);
      setMessage('Logo actualizado correctamente.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo subir el logo');
    }
  }
  return (
    <AdminShell title="Configuración de Clínica" subtitle="Logo, colores, teléfonos y datos usados en PDFs e impresiones" accessModule="clinicSettings">
      {loading || !form ? <Loading /> : (
        <form onSubmit={save} className="rounded-lg border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center gap-3">{form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-16 w-16 rounded-md object-contain" />}<h2 className="font-semibold">Datos institucionales</h2><label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">Subir logo<input type="file" accept="image/*" className="hidden" onChange={(event) => void uploadLogo(event.target.files?.[0])} /></label></div>
          {message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-clinic-teal">{message}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nombre clínica" value={form.clinicName} onChange={(value) => setForm({ ...form, clinicName: value })} />
            <Input label="Logo principal" value={form.logoUrl ?? ''} onChange={(value) => setForm({ ...form, logoUrl: value })} />
            <Input label="Logo impresión" value={form.printLogoUrl ?? ''} onChange={(value) => setForm({ ...form, printLogoUrl: value })} />
            <Input label="Color primario" value={form.primaryColor} onChange={(value) => setForm({ ...form, primaryColor: value })} />
            <Input label="Color secundario" value={form.secondaryColor} onChange={(value) => setForm({ ...form, secondaryColor: value })} />
            <Input label="Color acento" value={form.accentColor ?? ''} onChange={(value) => setForm({ ...form, accentColor: value })} />
            <Input label="Teléfono" value={form.phoneMain} onChange={(value) => setForm({ ...form, phoneMain: value })} />
            <Input label="Centro estético" value={form.phoneAesthetic ?? ''} onChange={(value) => setForm({ ...form, phoneAesthetic: value })} />
            <Input label="WhatsApp" value={form.whatsapp ?? ''} onChange={(value) => setForm({ ...form, whatsapp: value })} />
            <Input label="Correo" value={form.email ?? ''} onChange={(value) => setForm({ ...form, email: value })} />
            <Input label="Sitio web" value={form.website ?? ''} onChange={(value) => setForm({ ...form, website: value })} />
            <Input label="Horario" value={form.schedule ?? ''} onChange={(value) => setForm({ ...form, schedule: value })} />
            <label className="grid gap-1 text-sm font-medium md:col-span-2">Dirección<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" /></label>
          </div>
          <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" />Guardar configuración</button>
        </form>
      )}
    </AdminShell>
  );
}

export function DocumentFormPage({ kind, initialPatientId }: { kind: 'prescription' | 'lab' | 'image' | 'certificate'; initialPatientId?: string }) {
  const { patients, doctors, settings, loading, error } = useProtectedData();
  const [patientId, setPatientId] = useState(initialPatientId ?? '');
  const [doctorId, setDoctorId] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<any>(null);
  const [form, setForm] = useState<any>({
    diagnosis: '', recommendationsGeneral: '', medicationName: 'Losartán', concentration: '50 mg', presentation: 'Tableta', dose: '1 tableta', route: 'Vía oral', frequency: 'Cada 12 horas', duration: '30 días', instructions: '',
    exams: ['Hematología', 'Bioquímica'], customExam: '', studyType: 'Ultrasonido', imagingType: 'Ultrasonido', anatomyRegion: '', clinicalReason: '', presumptiveDiagnosis: '', observations: '', documentType: 'CERTIFICATE', title: 'Certificado médico', content: '',
  });
  useEffect(() => {
    const preferredPatient = initialPatientId && patients.some((p) => p.id === initialPatientId) ? initialPatientId : patients[0]?.id;
    if (preferredPatient && !patientId) setPatientId(preferredPatient);
    const eligible = doctors.filter((doctor) => doctor.doctorProfile?.isActive !== false && doctor.doctorProfile?.minsaCode && ['SUPER_ADMIN', 'DOCTOR'].includes(doctor.role?.name ?? ''));
    const source = kind === 'prescription' ? eligible : doctors;
    if (source[0] && !doctorId) setDoctorId(source[0].id);
  }, [patients, doctors, patientId, doctorId, initialPatientId]);
  const selectedPatient = patients.find((p) => p.id === patientId);
  const eligibleDoctors = doctors.filter((doctor) => doctor.doctorProfile?.isActive !== false && doctor.doctorProfile?.minsaCode && ['SUPER_ADMIN', 'DOCTOR'].includes(doctor.role?.name ?? ''));
  const doctorOptions = (kind === 'prescription' ? eligibleDoctors : doctors);
  const selectedDoctor = doctorOptions.find((d) => d.id === doctorId) ?? doctors.find((d) => d.id === doctorId);
  const title = kind === 'prescription' ? 'Nueva receta médica' : kind === 'lab' ? 'Nueva orden de laboratorio' : kind === 'image' ? 'Nueva orden de imagen' : 'Nuevo certificado / informe';
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (kind === 'prescription' && !canAccess(currentRole(), 'prescriptions')) {
      setMessage('No tiene permiso para emitir recetas médicas.');
      return;
    }
    const common = { patientId, doctorId };
    const payload = kind === 'prescription'
      ? { ...common, diagnosis: form.diagnosis, recommendationsGeneral: form.recommendationsGeneral, items: [{ medicationName: form.medicationName, concentration: form.concentration, presentation: form.presentation, dose: form.dose, route: form.route, frequency: form.frequency, duration: form.duration, instructions: form.instructions }] }
      : kind === 'lab'
        ? { ...common, diagnosis: form.diagnosis, reason: form.clinicalReason, observations: form.observations, exams: [...form.exams, form.customExam].filter(Boolean) }
        : kind === 'image'
          ? { ...common, studyType: form.studyType, imagingType: form.imagingType, anatomyRegion: form.anatomyRegion, clinicalReason: form.clinicalReason, presumptiveDiagnosis: form.presumptiveDiagnosis, observations: form.observations }
          : { ...common, documentType: form.documentType, title: form.title, content: form.content, diagnosis: form.diagnosis };
    const endpoint = kind === 'prescription' ? '/api/prescriptions' : kind === 'lab' ? '/api/lab-orders-external' : kind === 'image' ? '/api/imaging-orders' : '/api/documents/certificates';
    try {
      const result = await api<any>(endpoint, { method: 'POST', headers: authHeaders(true), body: JSON.stringify(payload) });
      setSaved(result); setMessage('Documento guardado correctamente.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar el documento');
    }
  }
  const pdfPath = saved ? kind === 'prescription' ? `/api/prescriptions/${saved.id}/pdf` : kind === 'lab' ? `/api/lab-orders-external/${saved.id}/pdf` : kind === 'image' ? `/api/imaging-orders/${saved.id}/pdf` : `/api/documents/${saved.printableDocumentId}/pdf` : '';
  return (
    <AdminShell title={title} subtitle="Vista previa, impresión y PDF con logo, médico, firma/sello y código MINSA" accessModule={kind === 'prescription' ? 'prescriptions' : kind === 'lab' ? 'laboratory' : 'expediente'}>
      {loading ? <Loading /> : error ? <p>{error}</p> : (
        <div className="grid gap-5 xl:grid-cols-[1fr_460px]">
          <form onSubmit={submit} className="rounded-lg border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            {message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-clinic-teal">{message}</p>}
            <div className="grid gap-3 md:grid-cols-2">
              <Select label="Paciente" value={patientId} onChange={setPatientId} options={patients.map((p) => [p.id, `${p.fullName} · ${p.patientCode}`])} />
              <Select label="Médico" value={doctorId} onChange={setDoctorId} options={doctorOptions.map((d) => [d.id, `${d.doctorProfile?.fullName ?? d.fullName} · MINSA ${d.doctorProfile?.minsaCode ?? '-'}`])} />
              {kind === 'prescription' && <PrescriptionFields form={form} setForm={setForm} />}
              {kind === 'lab' && <LabFields form={form} setForm={setForm} />}
              {kind === 'image' && <ImageFields form={form} setForm={setForm} />}
              {kind === 'certificate' && <CertificateFields form={form} setForm={setForm} />}
            </div>
            <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" />Guardar documento</button>
          </form>
          <PrintPreview settings={settings} patient={selectedPatient} doctor={selectedDoctor} kind={kind} form={form} pdfPath={pdfPath} />
        </div>
      )}
    </AdminShell>
  );
}

function PrescriptionFields({ form, setForm }: any) { return <><Input label="Diagnóstico" value={form.diagnosis} onChange={(v) => setForm({ ...form, diagnosis: v })} /><Input label="Medicamento" value={form.medicationName} onChange={(v) => setForm({ ...form, medicationName: v })} /><Input label="Concentración" value={form.concentration} onChange={(v) => setForm({ ...form, concentration: v })} /><Input label="Presentación" value={form.presentation} onChange={(v) => setForm({ ...form, presentation: v })} /><Input label="Dosis" value={form.dose} onChange={(v) => setForm({ ...form, dose: v })} /><Input label="Vía" value={form.route} onChange={(v) => setForm({ ...form, route: v })} /><Input label="Frecuencia" value={form.frequency} onChange={(v) => setForm({ ...form, frequency: v })} /><Input label="Duración" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} /><TextArea label="Indicaciones" value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} /><TextArea label="Recomendaciones" value={form.recommendationsGeneral} onChange={(v) => setForm({ ...form, recommendationsGeneral: v })} /></>; }
function LabFields({ form, setForm }: any) { const exams = ['Hematología', 'Bioquímica', 'Uroanálisis', 'Coprología', 'Perfil lipídico', 'Perfil hepático', 'Perfil renal', 'TSH/T4 libre', 'Vitaminas']; return <><TextArea label="Motivo / diagnóstico" value={form.clinicalReason} onChange={(v) => setForm({ ...form, clinicalReason: v })} /><div className="grid gap-2 md:col-span-2">{exams.map((exam) => <label key={exam} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.exams.includes(exam)} onChange={(e) => setForm({ ...form, exams: e.target.checked ? [...form.exams, exam] : form.exams.filter((x: string) => x !== exam) })} />{exam}</label>)}</div><Input label="Otro examen" value={form.customExam} onChange={(v) => setForm({ ...form, customExam: v })} /><TextArea label="Observaciones" value={form.observations} onChange={(v) => setForm({ ...form, observations: v })} /></>; }
function ImageFields({ form, setForm }: any) { return <><Select label="Tipo" value={form.imagingType} onChange={(v) => setForm({ ...form, imagingType: v })} options={['Ultrasonido', 'Rayos X', 'TAC', 'Resonancia', 'Doppler', 'Otro'].map((x) => [x, x])} /><Input label="Estudio solicitado" value={form.studyType} onChange={(v) => setForm({ ...form, studyType: v })} /><Input label="Región anatómica" value={form.anatomyRegion} onChange={(v) => setForm({ ...form, anatomyRegion: v })} /><Input label="Diagnóstico presuntivo" value={form.presumptiveDiagnosis} onChange={(v) => setForm({ ...form, presumptiveDiagnosis: v })} /><TextArea label="Motivo clínico" value={form.clinicalReason} onChange={(v) => setForm({ ...form, clinicalReason: v })} /><TextArea label="Observaciones" value={form.observations} onChange={(v) => setForm({ ...form, observations: v })} /></>; }
function CertificateFields({ form, setForm }: any) { return <><Select label="Tipo documento" value={form.documentType} onChange={(v) => setForm({ ...form, documentType: v })} options={[['CERTIFICATE', 'Certificado médico'], ['CONSTANCIA', 'Constancia médica'], ['INCAPACIDAD', 'Incapacidad'], ['INFORME', 'Informe médico'], ['REFERENCIA', 'Referencia médica']]} /><Input label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} /><Input label="Diagnóstico" value={form.diagnosis} onChange={(v) => setForm({ ...form, diagnosis: v })} /><TextArea label="Texto editable" value={form.content} onChange={(v) => setForm({ ...form, content: v })} /></>; }

function PrintPreview({ settings, patient, doctor, kind, form, pdfPath }: any) {
  const profile = doctor?.doctorProfile;
  return <aside className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="printable rounded-md border bg-white p-5 text-slate-950"><div className="flex items-center gap-4 border-b pb-3">{settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 rounded object-contain" />}<div><h2 className="text-xl font-semibold" style={{ color: settings?.primaryColor }}>{settings?.clinicName ?? 'Clínica Keyser'}</h2><p className="text-xs">{settings?.address}</p><p className="text-xs">Tel. {settings?.phoneMain} · Estética {settings?.phoneAesthetic}</p></div></div><div className="mt-4 text-sm"><p><strong>Médico:</strong> {profile?.fullName ?? doctor?.fullName} · MINSA {profile?.minsaCode ?? '-'}</p><p><strong>Especialidad:</strong> {profile?.specialty ?? '-'}</p><p><strong>Paciente:</strong> {patient?.fullName ?? '-'} · {patient?.patientCode ?? '-'}</p></div><div className="mt-5"><h3 className="font-semibold">{kind === 'prescription' ? 'Receta médica' : kind === 'lab' ? 'Orden de laboratorio' : kind === 'image' ? 'Orden de imagen' : form.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm">{kind === 'prescription' ? `${form.medicationName} ${form.concentration}\n${form.dose} ${form.route} ${form.frequency} por ${form.duration}\n${form.instructions}` : kind === 'lab' ? `Exámenes: ${[...form.exams, form.customExam].filter(Boolean).join(', ')}\nMotivo: ${form.clinicalReason}` : kind === 'image' ? `${form.imagingType}: ${form.studyType}\nRegión: ${form.anatomyRegion}\nMotivo: ${form.clinicalReason}` : form.content}</p></div><div className="mt-10 text-center text-xs"><p>__________________________________</p><p>{profile?.fullName ?? doctor?.fullName ?? 'Médico tratante'}</p><p>Código MINSA: {profile?.minsaCode ?? '-'}</p><p className="mt-3 text-slate-500">Esta receta fue emitida electrónicamente por Clínica Keyser.</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm"><Printer className="h-4 w-4" />Imprimir</button>{pdfPath && <a href={`${apiBase}${pdfPath}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-3 text-sm font-semibold text-white"><Download className="h-4 w-4" />Exportar PDF</a>}</div></aside>;
}

export function PatientPrintPage({ patientId }: { patientId: string }) {
  const { patients, doctors, settings, loading } = useProtectedData();
  const patient = patients.find((p) => p.id === patientId);
  const doctor = doctors[0];
  return <AdminShell title="Historia clínica imprimible" subtitle="Vista previa imprimible del expediente">{loading ? <Loading /> : <PrintPreview settings={settings} patient={patient} doctor={doctor} kind="certificate" form={{ title: 'Historia clínica', content: 'Resumen clínico imprimible del paciente. Use Exportar PDF desde el expediente específico para generar el documento clínico completo.' }} />}</AdminShell>;
}

export function PrescriptionDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { settings, loading: loadingBase } = useProtectedData();
  const [prescription, setPrescription] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return;
    api<any>(`/api/prescriptions/${id}`, { headers: authHeaders() })
      .then(setPrescription)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la receta'));
  }, [id]);
  const item = prescription?.items?.[0] ?? prescription ?? {};
  const form = {
    diagnosis: prescription?.diagnosis ?? '',
    recommendationsGeneral: prescription?.recommendationsGeneral ?? '',
    medicationName: item.medicationName ?? '',
    concentration: item.concentration ?? '',
    presentation: item.presentation ?? '',
    dose: item.dose ?? '',
    route: item.route ?? '',
    frequency: item.frequency ?? '',
    duration: item.duration ?? '',
    instructions: item.instructions ?? '',
  };
  async function voidPrescription() {
    if (!window.confirm('¿Anular esta receta? Permanecerá en auditoría y no volverá a mostrarse en el flujo activo.')) return;
    const reason = window.prompt('Motivo de anulación:');
    if (!reason?.trim()) return;
    try {
      await api(`/api/prescriptions/${id}/void`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ reason }) });
      router.replace('/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anular la receta');
    }
  }
  return (
    <AdminShell title="Receta médica" subtitle="Vista previa e impresión de receta guardada">
      {loadingBase || (!prescription && !error) ? <Loading /> : error ? <p>{error}</p> : (
        <div className="space-y-3">
          <PrintPreview settings={settings} patient={prescription.patient} doctor={prescription.doctor} kind="prescription" form={form} pdfPath={`/api/prescriptions/${id}/pdf`} />
          {['SUPER_ADMIN', 'DOCTOR'].includes(currentRole()) && <button onClick={() => void voidPrescription()} className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Anular receta con motivo</button>}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() { return <div className="flex items-center gap-2 rounded-lg border bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div>; }
function Input({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label className="grid gap-1 text-sm font-medium">{label}<input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-sm font-medium md:col-span-2">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="grid gap-1 text-sm font-medium">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>; }
