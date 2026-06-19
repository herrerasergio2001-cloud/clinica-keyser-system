'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Baby,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileText,
  FlaskConical,
  Grid2X2,
  HeartPulse,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UsersRound,
  X,
} from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu, decodeSession, signOut } from '../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Gender = 'FEMALE' | 'MALE' | 'OTHER' | 'UNKNOWN';

type PatientCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type VitalSigns = {
  bloodPressure?: string | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperature?: string | number | null;
  oxygenSaturation?: number | null;
  weight?: string | number | null;
  height?: string | number | null;
  bmi?: string | number | null;
};

type MedicalRecord = {
  id: string;
  consultationDate?: string;
  reasonForVisit?: string | null;
  diagnosisText?: string | null;
  nextAppointmentDate?: string | null;
  doctor?: { fullName?: string | null } | null;
  vitalSigns?: VitalSigns | null;
  diagnoses?: Array<{ mainDiagnosis?: string | null; icd10Code?: string | null }>;
  evolutionNotes?: Array<{ subjective?: string | null; assessment?: string | null; plan?: string | null; noteDate?: string | null }>;
};

type PatientAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  category?: string | null;
  storageKey?: string | null;
  createdAt: string;
};

type Patient = {
  id: string;
  patientCode: string;
  fullName: string;
  idNumber?: string | null;
  birthDate: string;
  gender: Gender;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  occupation?: string | null;
  civilStatus?: string | null;
  emergencyContact?: string | null;
  allergies?: string | null;
  bloodType?: string | null;
  chronicDiseases?: string | null;
  currentMedications?: string | null;
  photoUrl?: string | null;
  clinicalStatus?: string | null;
  status?: string | null;
  isDeleted?: boolean;
  category?: PatientCategory | null;
  assignedDoctor?: { id: string; fullName: string } | null;
  clinicalAlerts?: Array<{ id: string; title: string; severity: string; type: string }>;
  patientAttachments?: PatientAttachment[];
  appointments?: Array<{ id: string; startsAt: string; status: string; reason?: string | null }>;
  medicalRecords?: MedicalRecord[];
};

type PatientForm = {
  fullName: string;
  idNumber: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  city: string;
  occupation: string;
  civilStatus: string;
  emergencyContact: string;
  allergies: string;
  bloodType: string;
  chronicDiseases: string;
  currentMedications: string;
  photoUrl: string;
  clinicalStatus: string;
  categoryId: string;
};

const categoryStyles: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  'Medicina general': { color: '#0f766e', icon: Stethoscope },
  Pediatria: { color: '#2563eb', icon: Baby },
  Ginecologia: { color: '#db2777', icon: HeartPulse },
  Estetica: { color: '#7c3aed', icon: Sparkles },
  Ultrasonido: { color: '#0891b2', icon: ImageIcon },
  Psicologia: { color: '#16a34a', icon: Brain },
  Cardiologia: { color: '#dc2626', icon: HeartPulse },
  Laboratorio: { color: '#4f46e5', icon: FlaskConical },
};

const emptyForm: PatientForm = {
  fullName: '',
  idNumber: '',
  birthDate: '',
  gender: 'UNKNOWN',
  phone: '',
  email: '',
  address: '',
  city: '',
  occupation: '',
  civilStatus: '',
  emergencyContact: '',
  allergies: '',
  bloodType: '',
  chronicDiseases: '',
  currentMedications: '',
  photoUrl: '',
  clinicalStatus: 'ACTIVE',
  categoryId: '',
};

function authHeaders(json = true): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function ageFromBirthDate(value: string) {
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

function formatDate(value?: string | null) {
  if (!value) return 'No registrado';
  return new Intl.DateTimeFormat('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function genderLabel(gender: Gender) {
  return { FEMALE: 'Femenino', MALE: 'Masculino', OTHER: 'Otro', UNKNOWN: 'No indicado' }[gender];
}

function highlight(text: string | null | undefined, query: string): ReactNode {
  if (!text) return 'No registrado';
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-100 px-0.5 text-amber-950 dark:bg-amber-900 dark:text-amber-50">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

function patientToForm(patient?: Patient): PatientForm {
  if (!patient) return emptyForm;
  return {
    fullName: patient.fullName ?? '',
    idNumber: patient.idNumber ?? '',
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : '',
    gender: patient.gender ?? 'UNKNOWN',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    occupation: patient.occupation ?? '',
    civilStatus: patient.civilStatus ?? '',
    emergencyContact: patient.emergencyContact ?? '',
    allergies: patient.allergies ?? '',
    bloodType: patient.bloodType ?? '',
    chronicDiseases: patient.chronicDiseases ?? '',
    currentMedications: patient.currentMedications ?? '',
    photoUrl: patient.photoUrl ?? '',
    clinicalStatus: patient.clinicalStatus ?? 'ACTIVE',
    categoryId: patient.category?.id ?? '',
  };
}

function categoryIcon(category?: PatientCategory | null) {
  const match = category?.name ? categoryStyles[category.name] : undefined;
  return match?.icon ?? Stethoscope;
}

function uploadUrl(patientId: string, file?: PatientAttachment) {
  if (!file?.id) return '#';
  return `${apiBase}/api/patients/${patientId}/files/${file.id}/download`;
}

export default function PatientsPage() {
  const router = useRouter();
  const session = decodeSession();
  const isAdmin = session?.role === 'SUPER_ADMIN';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [categories, setCategories] = useState<PatientCategory[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [filters, setFilters] = useState({
    status: 'active',
    gender: '',
    city: '',
    categoryId: '',
    clinicalStatus: '',
    pediatric: false,
    hasAllergies: false,
    hasChronicDiseases: false,
    ageMin: '',
    ageMax: '',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login?next=/pacientes');
      return;
    }
    void loadPatients();
    void loadCategories();
  }, [debouncedQuery, filters, page, router]);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(''), 2600);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [toast]);

  async function loadCategories() {
    try {
      const response = await fetch(`${apiBase}/api/patients/categories`, { headers: authHeaders(false) });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as PatientCategory[];
      if (data.length) setCategories(data);
    } catch {
      setCategories([]);
    }
  }

  async function loadPatients() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('search', debouncedQuery);
    params.set('page', String(page));
    params.set('limit', '12');
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) params.set(key, 'true');
      } else if (value) {
        params.set(key, value);
      }
    });
    try {
      const response = await fetch(`${apiBase}/api/patients?${params.toString()}`, { headers: authHeaders(false) });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) throw new Error('No se pudieron cargar los pacientes');
      const result = (await response.json()) as { data?: Patient[]; meta?: { pages?: number } } | Patient[];
      const list = Array.isArray(result) ? result : result.data ?? [];
      setPatients(list);
      setPages(Array.isArray(result) ? 1 : result.meta?.pages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pacientes');
      setPatients([]);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }

  const visiblePatients = useMemo(() => {
    if (!error) return patients;
    return patients.filter((patient) => {
      const text = [patient.fullName, patient.patientCode, patient.phone, patient.idNumber, patient.city, patient.category?.name, patient.chronicDiseases, patient.allergies]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(debouncedQuery.toLowerCase());
    });
  }, [patients, debouncedQuery, error]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: keyof typeof filters; label: string }> = [];
    if (filters.status !== 'active') chips.push({ key: 'status', label: `Registro: ${filters.status === 'inactive' ? 'Desactivados' : filters.status === 'archived' ? 'Archivados' : 'Todos'}` });
    if (filters.gender) chips.push({ key: 'gender', label: `Sexo: ${genderLabel(filters.gender as Gender)}` });
    if (filters.city) chips.push({ key: 'city', label: `Ciudad: ${filters.city}` });
    if (filters.categoryId) chips.push({ key: 'categoryId', label: categories.find((item) => item.id === filters.categoryId)?.name ?? 'Categoria' });
    if (filters.clinicalStatus) chips.push({ key: 'clinicalStatus', label: `Estado: ${filters.clinicalStatus}` });
    if (filters.ageMin) chips.push({ key: 'ageMin', label: `Edad desde ${filters.ageMin}` });
    if (filters.ageMax) chips.push({ key: 'ageMax', label: `Edad hasta ${filters.ageMax}` });
    if (filters.pediatric) chips.push({ key: 'pediatric', label: 'Pediatricos' });
    if (filters.hasAllergies) chips.push({ key: 'hasAllergies', label: 'Con alergias' });
    if (filters.hasChronicDiseases) chips.push({ key: 'hasChronicDiseases', label: 'Cronicos' });
    return chips;
  }, [filters, categories]);

  function openCreate() {
    setForm(emptyForm);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(patient: Patient) {
    setForm(patientToForm(patient));
    setEditing(patient);
    setCreating(false);
  }

  function openPreview(patient: Patient) {
    setSelectedPatient(patient);
    setIsPreviewOpen(true);
  }

  function redirectToLogin() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.replace('/login?next=/pacientes');
  }

  function logout() {
    signOut(router);
  }

  function closePreview() {
    setIsPreviewOpen(false);
  }

  function updateForm(field: keyof PatientForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPatient(event: FormEvent) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.birthDate) {
      setError('Nombre completo y fecha de nacimiento son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value || undefined]));
    const optimistic: Patient = {
      id: editing?.id ?? `tmp-${Date.now()}`,
      patientCode: editing?.patientCode ?? 'Nuevo',
      fullName: form.fullName,
      birthDate: form.birthDate,
      gender: form.gender,
      clinicalStatus: form.clinicalStatus,
      status: 'ACTIVE',
      patientAttachments: [],
      medicalRecords: [],
      appointments: [],
      clinicalAlerts: [],
      ...payload,
      category: categories.find((category) => category.id === form.categoryId) ?? null,
    } as Patient;
    setPatients((current) => (editing ? current.map((patient) => (patient.id === editing.id ? optimistic : patient)) : [optimistic, ...current]));

    try {
      const response = await fetch(editing ? `${apiBase}/api/patients/${editing.id}` : `${apiBase}/api/patients`, {
        method: editing ? 'PATCH' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) throw new Error('No se pudo guardar el paciente');
      const saved = (await response.json()) as Patient;
      setPatients((current) => current.map((patient) => (patient.id === optimistic.id || patient.id === saved.id ? saved : patient)));
      setSelectedPatient((current) => (current?.id === saved.id ? saved : current));
      setEditing(null);
      setCreating(false);
      setToast('Paciente guardado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el paciente');
      await loadPatients();
    } finally {
      setSaving(false);
    }
  }

  async function deletePatient(patient: Patient) {
    const historyCount = (patient.medicalRecords?.length ?? 0) + (patient.patientAttachments?.length ?? 0);
    const confirmed = window.confirm(`¿Archivar a ${patient.fullName}?${historyCount ? ' Tiene historial clínico; no se borrará físicamente y quedará protegido en auditoría.' : ''}`);
    if (!confirmed) return;
    const reason = window.prompt(`Motivo para archivar a ${patient.fullName}`);
    if (!reason?.trim()) {
      setError('Debe ingresar un motivo para archivar el paciente.');
      return;
    }
    setPatients((current) => current.filter((item) => item.id !== patient.id));
    try {
      const response = await fetch(`${apiBase}/api/patients/${patient.id}/archive`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ reason }) });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) throw new Error('No se pudo eliminar el paciente');
      setToast('Paciente archivado correctamente');
      setSelectedPatient(null);
      setIsPreviewOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo archivar el paciente');
      await loadPatients();
    }
  }

  async function togglePatient(patient: Patient, activate: boolean) {
    const action = activate ? 'reactivar' : 'desactivar';
    if (!window.confirm(`¿Desea ${action} a ${patient.fullName}?`)) return;
    const reason = window.prompt(`Motivo para ${action} el paciente:`);
    if (!reason?.trim()) return;
    try {
      const response = await fetch(`${apiBase}/api/patients/${patient.id}/${activate ? 'activate' : 'deactivate'}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error(`No se pudo ${action} el paciente`);
      setToast(activate ? 'Paciente reactivado correctamente' : 'Paciente desactivado correctamente');
      setSelectedPatient(null);
      setIsPreviewOpen(false);
      await loadPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : `No se pudo ${action} el paciente`);
    }
  }

  async function restorePatient(patient: Patient) {
    if (!window.confirm(`¿Restaurar a ${patient.fullName} al listado activo?`)) return;
    const reason = window.prompt('Motivo de restauración:');
    if (!reason?.trim()) return;
    try {
      const response = await fetch(`${apiBase}/api/patients/${patient.id}/restore`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('No se pudo restaurar el paciente');
      setToast('Paciente restaurado correctamente');
      setSelectedPatient(null);
      setIsPreviewOpen(false);
      await loadPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restaurar el paciente');
    }
  }

  async function uploadFiles(fileList: FileList | File[], patient: Patient) {
    const files = Array.from(fileList).filter((file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type));
    if (!files.length) {
      setError('Solo se permiten archivos JPG, PNG y PDF.');
      return;
    }
    setSaving(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', file.type.includes('pdf') ? 'documento' : 'imagen');
        const response = await fetch(`${apiBase}/api/patients/${patient.id}/files`, {
          method: 'POST',
          headers: authHeaders(false),
          body: formData,
        });
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        if (!response.ok) throw new Error('No se pudo subir el archivo');
        const attachment = (await response.json()) as PatientAttachment;
        setPatients((current) =>
          current.map((item) =>
            item.id === patient.id ? { ...item, patientAttachments: [attachment, ...(item.patientAttachments ?? [])] } : item,
          ),
        );
        setSelectedPatient((current) => (current?.id === patient.id ? { ...current, patientAttachments: [attachment, ...(current.patientAttachments ?? [])] } : current));
      }
      setToast('Archivo clínico subido');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedModule module="patients">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <AppSidebar active="Pacientes" />

        <section className="min-w-0">
          <header className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Link href="/panel" className="text-clinic-teal">Inicio</Link>
                  <span>/</span>
                  <span>Pacientes</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Módulo clínico</p>
                <h2 className="mt-1 text-2xl font-semibold">Pacientes</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <UserMenu />
                <button type="button" onClick={() => window.history.back()} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                  Regresar
                </button>
                <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                  Cerrar sesión
                </button>
                <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white hover:bg-teal-700">
                  <Plus className="h-4 w-4" />
                  Nuevo paciente
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-5 p-6">
            {(toast || error) && (
              <div
                className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm ${
                  error ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100' : 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {error ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {error || toast}
                </span>
                <button onClick={() => (error ? setError('') : setToast(''))}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-11 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por nombre, expediente, teléfono, cédula, diagnóstico, categoría o ciudad"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </label>
                <div className="flex rounded-md border border-slate-200 p-1 dark:border-slate-700">
                  <button onClick={() => setView('grid')} className={`h-9 rounded px-3 ${view === 'grid' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : ''}`} title="Vista tarjetas">
                    <Grid2X2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setView('table')} className={`h-9 rounded px-3 ${view === 'table' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : ''}`} title="Vista tabla">
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={() => void loadPatients()} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                <Select label="Registro" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[['active', 'Activos'], ['inactive', 'Desactivados'], ['archived', 'Archivados'], ['all', 'Todos']]} />
                <Select label="Sexo" value={filters.gender} onChange={(value) => setFilters((current) => ({ ...current, gender: value }))} options={[['', 'Todos'], ['FEMALE', 'Femenino'], ['MALE', 'Masculino'], ['OTHER', 'Otro']]} />
                <TextFilter label="Ciudad" value={filters.city} onChange={(value) => setFilters((current) => ({ ...current, city: value }))} />
                <label className="grid gap-1 text-xs font-medium text-slate-500">
                  Categoría
                  <select value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))} className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <option value="">Todas</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextFilter label="Estado clínico" value={filters.clinicalStatus} onChange={(value) => setFilters((current) => ({ ...current, clinicalStatus: value }))} />
                <TextFilter label="Edad desde" type="number" value={filters.ageMin} onChange={(value) => setFilters((current) => ({ ...current, ageMin: value }))} />
                <TextFilter label="Edad hasta" type="number" value={filters.ageMax} onChange={(value) => setFilters((current) => ({ ...current, ageMax: value }))} />
              </div>

              <div className="flex flex-wrap gap-2">
                <CheckFilter label="Pediátricos" checked={filters.pediatric} onChange={(value) => setFilters((current) => ({ ...current, pediatric: value }))} />
                <CheckFilter label="Con alergias" checked={filters.hasAllergies} onChange={(value) => setFilters((current) => ({ ...current, hasAllergies: value }))} />
                <CheckFilter label="Enfermedades crónicas" checked={filters.hasChronicDiseases} onChange={(value) => setFilters((current) => ({ ...current, hasChronicDiseases: value }))} />
              </div>

              {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => setFilters((current) => ({ ...current, [chip.key]: typeof current[chip.key] === 'boolean' ? false : '' }))}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-100"
                    >
                      {chip.label}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {loading ? (
              <SkeletonGrid />
            ) : visiblePatients.length === 0 ? (
              <EmptyState onCreate={openCreate} />
            ) : view === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visiblePatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} query={debouncedQuery} onPreview={openPreview} onEdit={openEdit} />
                ))}
              </div>
            ) : (
              <PatientTable patients={visiblePatients} query={debouncedQuery} onPreview={openPreview} onEdit={openEdit} />
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Página {page} de {pages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 text-sm disabled:opacity-50 dark:border-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button disabled={page >= pages} onClick={() => setPage((current) => Math.min(pages, current + 1))} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 text-sm disabled:opacity-50 dark:border-slate-700">
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isPreviewOpen && selectedPatient && (
        <PreviewPanel
          patient={selectedPatient}
          onClose={closePreview}
          onEdit={openEdit}
          onDelete={deletePatient}
          onToggle={togglePatient}
          onRestore={restorePatient}
          isAdmin={isAdmin}
          onUpload={(files) => void uploadFiles(files, selectedPatient)}
          saving={saving}
        />
      )}

      {(editing || creating) && (
        <PatientFormModal
          title={editing ? 'Editar paciente' : 'Nuevo paciente'}
          form={form}
          categories={categories}
          saving={saving}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={submitPatient}
          onChange={updateForm}
        />
      )}
    </main>
    </ProtectedModule>
  );
}

function PatientCard({ patient, query, onPreview, onEdit }: { patient: Patient; query: string; onPreview: (patient: Patient) => void; onEdit: (patient: Patient) => void }) {
  const CategoryIcon = categoryIcon(patient.category);
  const latestRecord = patient.medicalRecords?.[0];
  const nextAppointment = patient.appointments?.find((appointment) => new Date(appointment.startsAt) >= new Date()) ?? patient.appointments?.[0];
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-clinic-teal dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/expediente/${patient.id}`} className="flex min-w-0 gap-3 text-left">
          <Avatar patient={patient} />
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold">{highlight(patient.fullName, query)}</span>
            <span className="mt-1 block text-xs text-slate-500">{highlight(patient.patientCode, query)} · {ageFromBirthDate(patient.birthDate)} años · {genderLabel(patient.gender)}</span>
          </span>
        </Link>
        <button onClick={() => onEdit(patient)} title="Editar paciente" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Edit3 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Teléfono" value={patient.phone} />
        <Info label="Ciudad" value={patient.city} />
        <Info label="Última consulta" value={formatDate(latestRecord?.consultationDate)} />
        <Info label="Próxima cita" value={formatDate(nextAppointment?.startsAt ?? latestRecord?.nextAppointmentDate)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(patient.isDeleted || patient.status === 'INACTIVE') && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{patient.isDeleted ? 'Archivado' : 'Desactivado'}</span>}
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: patient.category?.color ?? categoryStyles[patient.category?.name ?? '']?.color ?? '#0f766e' }}>
          <CategoryIcon className="h-3.5 w-3.5" />
          {patient.category?.name ?? 'Sin categoría'}
        </span>
        {patient.clinicalAlerts?.slice(0, 2).map((alert) => (
          <span key={alert.id} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-100">
            <AlertTriangle className="h-3.5 w-3.5" />
            {alert.title}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Link href={`/expediente/${patient.id}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
          <FileText className="h-4 w-4" />
          Abrir expediente
        </Link>
        <button onClick={() => onPreview(patient)} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
          <Eye className="h-4 w-4" />
          Vista rápida
        </button>
        <Link href={`/expediente/${patient.id}/nuevo`} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
          <Activity className="h-4 w-4" />
          Nueva evolución
        </Link>
      </div>
    </article>
  );
}

function PatientTable({ patients, query, onPreview, onEdit }: { patients: Patient[]; query: string; onPreview: (patient: Patient) => void; onEdit: (patient: Patient) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Expediente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Alertas</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                <td className="px-4 py-3">
                  <Link href={`/expediente/${patient.id}`} className="flex items-center gap-3 text-left">
                    <Avatar patient={patient} small />
                    <span>
                      <span className="block font-medium">{highlight(patient.fullName, query)}</span>
                      <span className="text-xs text-slate-500">{ageFromBirthDate(patient.birthDate)} años · {genderLabel(patient.gender)}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">{highlight(patient.patientCode, query)}</td>
                <td className="px-4 py-3">{highlight(patient.phone, query)}</td>
                <td className="px-4 py-3">{highlight(patient.city, query)}</td>
                <td className="px-4 py-3">{patient.category?.name ?? 'Sin categoría'}</td>
                <td className="px-4 py-3">{patient.clinicalAlerts?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/expediente/${patient.id}`} className="rounded-md border border-slate-200 p-2 dark:border-slate-700" title="Abrir expediente">
                      <FileText className="h-4 w-4" />
                    </Link>
                    <button onClick={() => onPreview(patient)} className="rounded-md border border-slate-200 p-2 dark:border-slate-700" title="Vista rápida">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => onEdit(patient)} className="rounded-md border border-slate-200 p-2 dark:border-slate-700" title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewPanel({
  patient,
  onClose,
  onEdit,
  onDelete,
  onToggle,
  onRestore,
  onUpload,
  saving,
  isAdmin,
}: {
  patient: Patient;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onToggle: (patient: Patient, activate: boolean) => void;
  onRestore: (patient: Patient) => void;
  onUpload: (files: FileList | File[]) => void;
  saving: boolean;
  isAdmin: boolean;
}) {
  const latestRecord = patient.medicalRecords?.[0];
  const latestEvolution = latestRecord?.evolutionNotes?.[0];
  const vitals = latestRecord?.vitalSigns;
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const selectFiles = (files: FileList | null) => {
    if (!files) return;
    setPendingFiles(Array.from(files).filter((file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)));
  };

  const savePendingFiles = () => {
    if (!pendingFiles.length) return;
    onUpload(pendingFiles);
    setPendingFiles([]);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <aside className="ml-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex gap-3">
            <Avatar patient={patient} />
            <div>
              <h3 className="text-xl font-semibold">{patient.fullName}</h3>
              <p className="mt-1 text-sm text-slate-500">{patient.patientCode} · {ageFromBirthDate(patient.birthDate)} años · {genderLabel(patient.gender)}</p>
            </div>
          </div>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
            Cerrar
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <QuickActions patient={patient} />
            <button onClick={() => {
              onEdit(patient);
              onClose();
            }} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
              <Edit3 className="h-4 w-4" />
              Editar
            </button>
            {isAdmin && !patient.isDeleted && (
              <button onClick={() => void onToggle(patient, patient.status === 'INACTIVE')} className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-200 px-3 text-sm text-amber-700">
                <RefreshCw className="h-4 w-4" />
                {patient.status === 'INACTIVE' ? 'Reactivar paciente' : 'Desactivar paciente'}
              </button>
            )}
            {isAdmin && patient.isDeleted && (
              <button onClick={() => void onRestore(patient)} className="inline-flex h-9 items-center gap-2 rounded-md border border-teal-200 px-3 text-sm text-clinic-teal">
                <RefreshCw className="h-4 w-4" />
                Restaurar paciente
              </button>
            )}
            {isAdmin && !patient.isDeleted && (
              <button onClick={() => void onDelete(patient)} className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm text-red-700 dark:border-red-900 dark:text-red-200">
                <X className="h-4 w-4" />
                Eliminar (archivar)
              </button>
            )}
          </div>

          <section className="grid gap-3 md:grid-cols-3">
            <Info label="Cédula" value={patient.idNumber} />
            <Info label="Teléfono" value={patient.phone} />
            <Info label="Ciudad" value={patient.city} />
            <Info label="Ocupación" value={patient.occupation} />
            <Info label="Tipo sanguíneo" value={patient.bloodType} />
            <Info label="Médico asignado" value={patient.assignedDoctor?.fullName} />
          </section>

          <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="font-semibold">Resumen clínico</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Info label="Últimos signos vitales" value={vitals ? `PA ${vitals.bloodPressure ?? '-'} · FC ${vitals.heartRate ?? '-'} · IMC ${vitals.bmi ?? '-'}` : undefined} />
              <Info label="Último diagnóstico" value={latestRecord?.diagnosisText ?? latestRecord?.diagnoses?.[0]?.mainDiagnosis} />
              <Info label="Última evolución" value={latestEvolution?.assessment ?? latestEvolution?.plan} />
              <Info label="Próxima cita" value={formatDate(patient.appointments?.[0]?.startsAt ?? latestRecord?.nextAppointmentDate)} />
              <Info label="Alergias" value={patient.allergies} />
              <Info label="Enfermedades crónicas" value={patient.chronicDiseases} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="font-semibold">Alertas clínicas</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {(patient.clinicalAlerts?.length ? patient.clinicalAlerts : [{ id: 'empty', title: 'Sin alertas activas', severity: 'INFO', type: 'INFO' }]).map((alert) => (
                <span key={alert.id} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  {alert.title}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Archivos clínicos</h4>
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
                <UploadCloud className="h-4 w-4" />
                Seleccionar
                <input type="file" multiple accept="image/png,image/jpeg,application/pdf" className="hidden" onChange={(event) => selectFiles(event.target.files)} />
              </label>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                selectFiles(event.dataTransfer.files);
              }}
              className={`mt-3 rounded-md border border-dashed p-5 text-center text-sm ${isDragging ? 'border-clinic-teal bg-teal-50 dark:bg-teal-950' : 'border-slate-300 dark:border-slate-700'}`}
            >
              <UploadCloud className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2">{pendingFiles.length ? `${pendingFiles.length} archivo(s) seleccionado(s)` : 'Arrastra JPG, PNG o PDF aqui'}</p>
              <button
                type="button"
                onClick={savePendingFiles}
                disabled={saving || pendingFiles.length === 0}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-clinic-teal px-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <UploadCloud className="h-4 w-4" />
                {saving ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
            {pendingFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingFiles.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
                    {file.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(patient.patientAttachments ?? []).map((file) => (
                <a key={file.id} href={uploadUrl(patient.id, file)} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
                  {file.mimeType.includes('image') ? <ImageIcon className="h-4 w-4 text-clinic-teal" /> : <FileText className="h-4 w-4 text-clinic-coral" />}
                  <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
                  <Download className="h-4 w-4" />
                </a>
              ))}
              {!patient.patientAttachments?.length && <p className="text-sm text-slate-500">Sin archivos recientes.</p>}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function PatientFormModal({
  title,
  form,
  categories,
  saving,
  onClose,
  onSubmit,
  onChange,
}: {
  title: string;
  form: PatientForm;
  categories: PatientCategory[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: (field: keyof PatientForm, value: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="mx-auto flex max-h-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
          <Input label="Nombre completo" value={form.fullName} required onChange={(value) => onChange('fullName', value)} />
          <Input label="Cédula" value={form.idNumber} onChange={(value) => onChange('idNumber', value)} />
          <Input label="Fecha de nacimiento" type="date" value={form.birthDate} required onChange={(value) => onChange('birthDate', value)} />
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Sexo
            <select value={form.gender} onChange={(event) => onChange('gender', event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value="UNKNOWN">No indicado</option>
              <option value="FEMALE">Femenino</option>
              <option value="MALE">Masculino</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>
          <Input label="Teléfono" value={form.phone} onChange={(value) => onChange('phone', value)} />
          <Input label="Correo" type="email" value={form.email} onChange={(value) => onChange('email', value)} />
          <Input label="Dirección" value={form.address} onChange={(value) => onChange('address', value)} />
          <Input label="Ciudad" value={form.city} onChange={(value) => onChange('city', value)} />
          <Input label="Ocupación" value={form.occupation} onChange={(value) => onChange('occupation', value)} />
          <Input label="Estado civil" value={form.civilStatus} onChange={(value) => onChange('civilStatus', value)} />
          <Input label="Contacto de emergencia" value={form.emergencyContact} onChange={(value) => onChange('emergencyContact', value)} />
          <Input label="Tipo sanguíneo" value={form.bloodType} onChange={(value) => onChange('bloodType', value)} />
          <Input label="Foto del paciente URL" value={form.photoUrl} onChange={(value) => onChange('photoUrl', value)} />
          <Input label="Estado clínico" value={form.clinicalStatus} onChange={(value) => onChange('clinicalStatus', value)} />
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Categoría clínica
            <select value={form.categoryId} onChange={(event) => onChange('categoryId', event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Alergias" value={form.allergies} onChange={(value) => onChange('allergies', value)} />
          <TextArea label="Enfermedades crónicas" value={form.chronicDiseases} onChange={(value) => onChange('chronicDiseases', value)} />
          <TextArea label="Medicamentos actuales" value={form.currentMedications} onChange={(value) => onChange('currentMedications', value)} />
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm dark:border-slate-700">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="h-10 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function QuickActions({ patient, compact = false }: { patient: Patient; compact?: boolean }) {
  const phone = patient.phone?.replace(/[^\d+]/g, '') ?? '';
  const actions = [
    { label: 'Abrir expediente', icon: FileText, href: `/expediente/${patient.id}` },
    { label: 'Nueva evolución', icon: Activity, href: `/expediente/${patient.id}/nuevo` },
    { label: 'Nueva cita', icon: CalendarDays, href: `/citas?nueva=1&patientId=${patient.id}` },
    { label: 'Llamar', icon: Phone, href: phone ? `tel:${phone}` : undefined },
    { label: 'WhatsApp', icon: Send, href: phone ? `https://wa.me/${phone.replace('+', '')}` : undefined },
  ];
  return (
    <>
      {actions.slice(0, compact ? 3 : actions.length).map((action) =>
        action.href ? (
          <Link key={action.label} href={action.href} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700" title={action.label}>
            <action.icon className="h-4 w-4" />
            {!compact && action.label}
          </Link>
        ) : null,
      )}
      <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700" title="Imprimir resumen clínico">
        <Printer className="h-4 w-4" />
        {!compact && 'Imprimir'}
      </button>
    </>
  );
}

function Avatar({ patient, small = false }: { patient: Patient; small?: boolean }) {
  const size = small ? 'h-9 w-9' : 'h-12 w-12';
  return patient.photoUrl ? (
    <img src={patient.photoUrl} alt="" className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-clinic-teal dark:bg-teal-950`}>
      {patient.fullName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
    </span>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm">{value || 'No registrado'}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextFilter({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-500">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
    </label>
  );
}

function CheckFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-clinic-teal" />
      {label}
    </label>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((__, row) => (
              <div key={row} className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <UsersRound className="mx-auto h-10 w-10 text-slate-400" />
      <h3 className="mt-3 text-lg font-semibold">No hay pacientes para mostrar</h3>
      <p className="mt-1 text-sm text-slate-500">Ajusta los filtros o registra un nuevo paciente clínico.</p>
      <button onClick={onCreate} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white">
        <Plus className="h-4 w-4" />
        Nuevo paciente
      </button>
    </section>
  );
}
