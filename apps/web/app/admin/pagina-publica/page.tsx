'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Edit3, FileText, HelpCircle, ImageUp, Loader2, Megaphone, Plus, Save, Settings, Stethoscope, Trash2, X } from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu } from '../../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Tab = 'servicios' | 'promociones' | 'noticias' | 'preguntas' | 'clinica';
type ContentKind = 'services' | 'promotions' | 'news' | 'faqs';

type SettingsForm = {
  clinicName: string;
  slogan: string;
  logoUrl: string;
  primaryPhone: string;
  aestheticPhone: string;
  whatsapp: string;
  address: string;
  schedule: string;
  mapEmbedUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type ContentItem = {
  id: string;
  title?: string;
  slug?: string;
  description?: string;
  content?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  whatsappText?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  startDate?: string | null;
  endDate?: string | null;
  publishedAt?: string | null;
  question?: string;
  answer?: string;
};

type AdminPayload = {
  settings: SettingsForm;
  services: ContentItem[];
  promotions: ContentItem[];
  news: ContentItem[];
  faqs: ContentItem[];
};

const emptySettings: SettingsForm = {
  clinicName: 'Clínica Keyser',
  slogan: 'Atención médica integral, cercana y confiable en Chinandega.',
  logoUrl: '/clinica-keyser-logo.svg',
  primaryPhone: '8495-2200',
  aestheticPhone: '7650-7993',
  whatsapp: '50584952200',
  address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.',
  schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
  mapEmbedUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  primaryColor: '#087f8c',
  secondaryColor: '#8fd5c8',
  accentColor: '#ef6f6c',
};

const emptyContent = {
  title: '',
  slug: '',
  description: '',
  content: '',
  icon: 'stethoscope',
  imageUrl: '',
  category: '',
  whatsappText: '',
  isActive: true,
  sortOrder: 0,
  startDate: '',
  endDate: '',
  publishedAt: '',
};

const emptyFaq = { question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 };

export default function AdminPublicPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('servicios');
  const [data, setData] = useState<AdminPayload>({ settings: emptySettings, services: [], promotions: [], news: [], faqs: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [forms, setForms] = useState<Record<ContentKind, any>>({
    services: emptyContent,
    promotions: emptyContent,
    news: emptyContent,
    faqs: emptyFaq,
  });
  const [editing, setEditing] = useState<Record<ContentKind, string | null>>({ services: null, promotions: null, news: null, faqs: null });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login?next=/admin/pagina-publica');
      return;
    }
    void load();
  }, [router]);

  const activeList = useMemo(() => {
    if (tab === 'servicios') return data.services;
    if (tab === 'promociones') return data.promotions;
    if (tab === 'noticias') return data.news;
    if (tab === 'preguntas') return data.faqs;
    return [];
  }, [data, tab]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/admin/public`, { headers: authHeaders() });
      if (response.status === 401 || response.status === 403) {
        router.replace('/login?next=/admin/pagina-publica');
        return;
      }
      if (!response.ok) throw new Error('No se pudo cargar el contenido público.');
      const payload = (await response.json()) as AdminPayload;
      setData({
        ...payload,
        settings: normalizeSettings(payload.settings),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la página pública.');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('Guardando información de clínica...');
    try {
      const response = await fetch(`${apiBase}/api/admin/public/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data.settings),
      });
      if (!response.ok) throw new Error('No se pudo guardar la información de clínica.');
      const settings = normalizeSettings(await response.json());
      setData((current) => ({ ...current, settings }));
      setMessage('Información de clínica guardada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function saveContent(kind: ContentKind, event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('Guardando...');
    try {
      const id = editing[kind];
      const endpoint = `${apiBase}/api/admin/public/${kind}${id ? `/${id}` : ''}`;
      const response = await fetch(endpoint, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(preparePayload(kind, forms[kind])),
      });
      if (!response.ok) throw new Error('No se pudo guardar el contenido.');
      setMessage('Guardado correctamente.');
      setEditing((current) => ({ ...current, [kind]: null }));
      setForms((current) => ({ ...current, [kind]: kind === 'faqs' ? emptyFaq : emptyContent }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent(kind: ContentKind, id: string) {
    if (!confirm('¿Desea eliminar este registro público?')) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/admin/public/${kind}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('No se pudo eliminar el registro.');
      setMessage('Registro eliminado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(kind: ContentKind | 'settings', file?: File) {
    if (!file) return;
    setSaving(true);
    setMessage('Subiendo imagen...');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`${apiBase}/api/admin/public/upload`, { method: 'POST', headers: authHeaders(), body });
      if (!response.ok) throw new Error('No se pudo subir la imagen.');
      const uploaded = (await response.json()) as { imageUrl: string };
      const imageUrl = uploaded.imageUrl.startsWith('/api') ? `${apiBase}${uploaded.imageUrl}` : uploaded.imageUrl;
      if (kind === 'settings') {
        setData((current) => ({ ...current, settings: { ...current.settings, logoUrl: imageUrl } }));
      } else {
        setForms((current) => ({ ...current, [kind]: { ...current[kind], imageUrl } }));
      }
      setMessage('Imagen subida correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen.');
    } finally {
      setSaving(false);
    }
  }

  function edit(kind: ContentKind, item: ContentItem) {
    setEditing((current) => ({ ...current, [kind]: item.id }));
    setForms((current) => ({
      ...current,
      [kind]: kind === 'faqs'
        ? { question: item.question ?? '', answer: item.answer ?? '', category: item.category ?? 'General', isActive: item.isActive ?? true, sortOrder: item.sortOrder ?? 0 }
        : {
            ...emptyContent,
            ...item,
            startDate: dateInput(item.startDate),
            endDate: dateInput(item.endDate),
            publishedAt: dateInput(item.publishedAt),
          },
    }));
    setMessage('Editando registro seleccionado.');
  }

  function cancel(kind: ContentKind) {
    setEditing((current) => ({ ...current, [kind]: null }));
    setForms((current) => ({ ...current, [kind]: kind === 'faqs' ? emptyFaq : emptyContent }));
  }

  return (
    <ProtectedModule module="publicAdmin">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
      <AppSidebar active="Página pública" />
      <section className="min-w-0">
      <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Link href="/panel" className="text-clinic-teal">Inicio</Link>
              <span>/</span>
              <span>Administración</span>
              <span>/</span>
              <span>Página pública</span>
            </div>
            <h1 className="text-2xl font-semibold">Página pública</h1>
            <p className="mt-1 text-sm text-slate-500">Administre servicios, promociones, noticias, preguntas y datos de contacto.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <UserMenu />
            <Link href="/panel" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Regresar</Link>
            <Link href="/" target="_blank" className="rounded-md bg-clinic-teal px-3 py-2 text-sm font-semibold text-white">Ver página pública</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6">
        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              {[
                ['servicios', 'Servicios', Stethoscope],
                ['promociones', 'Promociones', Megaphone],
                ['noticias', 'Noticias', FileText],
                ['preguntas', 'Preguntas frecuentes', HelpCircle],
                ['clinica', 'Información de clínica', Settings],
              ].map(([value, label, Icon]) => (
                <button key={String(value)} onClick={() => setTab(value as Tab)} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${tab === value ? 'bg-teal-50 text-clinic-teal dark:bg-teal-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Icon className="h-4 w-4" />
                  {String(label)}
                </button>
              ))}
            </aside>

            <div className="grid gap-4">
              {message && <p className="rounded-md bg-teal-50 p-3 text-sm text-clinic-teal dark:bg-teal-950">{message}</p>}
              {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-100">{error}</p>}
              {tab === 'clinica' ? (
                <SettingsEditor settings={data.settings} setSettings={(settings) => setData((current) => ({ ...current, settings }))} saving={saving} onSave={saveSettings} onUpload={(file) => uploadImage('settings', file)} />
              ) : (
                <ContentEditor
                  tab={tab}
                  list={activeList}
                  form={forms[kindFromTab(tab)]}
                  editingId={editing[kindFromTab(tab)]}
                  saving={saving}
                  setForm={(form) => setForms((current) => ({ ...current, [kindFromTab(tab)]: form }))}
                  onSave={(event) => saveContent(kindFromTab(tab), event)}
                  onEdit={(item) => edit(kindFromTab(tab), item)}
                  onDelete={(id) => deleteContent(kindFromTab(tab), id)}
                  onCancel={() => cancel(kindFromTab(tab))}
                  onUpload={(file) => uploadImage(kindFromTab(tab), file)}
                />
              )}
            </div>
          </div>
        )}
      </section>
      </section>
      </div>
    </main>
    </ProtectedModule>
  );
}

function SettingsEditor({ settings, setSettings, saving, onSave, onUpload }: { settings: SettingsForm; setSettings: (settings: SettingsForm) => void; saving: boolean; onSave: (event: FormEvent) => void; onUpload: (file?: File) => void }) {
  return (
    <form onSubmit={onSave} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Información de clínica</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextField label="Nombre" value={settings.clinicName} onChange={(value) => setSettings({ ...settings, clinicName: value })} />
        <TextField label="Frase principal" value={settings.slogan} onChange={(value) => setSettings({ ...settings, slogan: value })} />
        <TextField label="Teléfono principal" value={settings.primaryPhone} onChange={(value) => setSettings({ ...settings, primaryPhone: value })} />
        <TextField label="Centro estético" value={settings.aestheticPhone} onChange={(value) => setSettings({ ...settings, aestheticPhone: value })} />
        <TextField label="WhatsApp" value={settings.whatsapp} onChange={(value) => setSettings({ ...settings, whatsapp: value })} />
        <TextField label="Horario" value={settings.schedule} onChange={(value) => setSettings({ ...settings, schedule: value })} />
        <TextArea label="Dirección" value={settings.address} onChange={(value) => setSettings({ ...settings, address: value })} />
        <TextArea label="Mapa embebido o enlace" value={settings.mapEmbedUrl} onChange={(value) => setSettings({ ...settings, mapEmbedUrl: value })} />
        <TextField label="Logo" value={settings.logoUrl} onChange={(value) => setSettings({ ...settings, logoUrl: value })} />
        <UploadField onUpload={onUpload} />
        <TextField label="Color principal" value={settings.primaryColor} onChange={(value) => setSettings({ ...settings, primaryColor: value })} />
        <TextField label="Color secundario" value={settings.secondaryColor} onChange={(value) => setSettings({ ...settings, secondaryColor: value })} />
      </div>
      <SubmitButton saving={saving} label="Guardar información" />
    </form>
  );
}

function ContentEditor(props: {
  tab: Tab;
  list: ContentItem[];
  form: any;
  editingId: string | null;
  saving: boolean;
  setForm: (form: any) => void;
  onSave: (event: FormEvent) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  onUpload: (file?: File) => void;
}) {
  const isFaq = props.tab === 'preguntas';
  const title = props.tab === 'servicios' ? 'Servicios' : props.tab === 'promociones' ? 'Promociones' : props.tab === 'noticias' ? 'Noticias / campañas' : 'Preguntas frecuentes';
  return (
    <div className="grid gap-4">
      <form onSubmit={props.onSave} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{props.editingId ? 'Editar' : 'Crear'} {title.toLowerCase()}</h2>
          {props.editingId && <button type="button" onClick={props.onCancel} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"><X className="h-4 w-4" />Cancelar</button>}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {isFaq ? (
            <>
              <TextField label="Pregunta" value={props.form.question ?? ''} onChange={(value) => props.setForm({ ...props.form, question: value })} required />
              <TextField label="Categoría" value={props.form.category ?? ''} onChange={(value) => props.setForm({ ...props.form, category: value })} />
              <TextArea label="Respuesta" value={props.form.answer ?? ''} onChange={(value) => props.setForm({ ...props.form, answer: value })} required />
            </>
          ) : (
            <>
              <TextField label="Título" value={props.form.title ?? ''} onChange={(value) => props.setForm({ ...props.form, title: value })} required />
              <TextField label="Slug" value={props.form.slug ?? ''} onChange={(value) => props.setForm({ ...props.form, slug: value })} />
              <TextField label="Categoría" value={props.form.category ?? ''} onChange={(value) => props.setForm({ ...props.form, category: value })} />
              {props.tab === 'servicios' && <TextField label="Ícono" value={props.form.icon ?? ''} onChange={(value) => props.setForm({ ...props.form, icon: value })} />}
              <TextArea label="Descripción" value={props.form.description ?? ''} onChange={(value) => props.setForm({ ...props.form, description: value })} required />
              <TextArea label="Contenido" value={props.form.content ?? ''} onChange={(value) => props.setForm({ ...props.form, content: value })} />
              <TextField label="Imagen" value={props.form.imageUrl ?? ''} onChange={(value) => props.setForm({ ...props.form, imageUrl: value })} />
              <UploadField onUpload={props.onUpload} />
              {props.tab === 'promociones' && (
                <>
                  <DateField label="Fecha inicio" value={props.form.startDate ?? ''} onChange={(value) => props.setForm({ ...props.form, startDate: value })} />
                  <DateField label="Fecha fin" value={props.form.endDate ?? ''} onChange={(value) => props.setForm({ ...props.form, endDate: value })} />
                </>
              )}
              {props.tab === 'noticias' && <DateField label="Fecha publicación" value={props.form.publishedAt ?? ''} onChange={(value) => props.setForm({ ...props.form, publishedAt: value })} />}
            </>
          )}
          <TextField label="Orden" type="number" value={String(props.form.sortOrder ?? 0)} onChange={(value) => props.setForm({ ...props.form, sortOrder: Number(value) })} />
          <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            <input type="checkbox" checked={props.form.isActive ?? true} onChange={(event) => props.setForm({ ...props.form, isActive: event.target.checked })} />
            Activo / visible
          </label>
        </div>
        <SubmitButton saving={props.saving} label={props.editingId ? 'Guardar cambios' : 'Crear registro'} />
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Registros</h2>
        <div className="mt-4 grid gap-3">
          {props.list.length === 0 && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">No hay registros todavía.</p>}
          {props.list.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div>
                <p className="font-semibold">{item.title ?? item.question}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description ?? item.answer}</p>
                <p className="mt-2 text-xs text-slate-400">{item.isActive ? 'Activo' : 'Inactivo'} · Orden {item.sortOrder ?? 0}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => props.onEdit(item)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><Edit3 className="h-4 w-4" />Editar</button>
                <button onClick={() => props.onDelete(item.id)} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 dark:border-red-900"><Trash2 className="h-4 w-4" />Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SubmitButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-md bg-clinic-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? 'Guardando...' : label}
    </button>
  );
}

function UploadField({ onUpload }: { onUpload: (file?: File) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      Subir imagen
      <span className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 text-slate-500 dark:border-slate-700">
        <ImageUp className="h-4 w-4" />
        Seleccionar imagen
      </span>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event: ChangeEvent<HTMLInputElement>) => onUpload(event.target.files?.[0])} className="hidden" />
    </label>
  );
}

function TextField({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <TextField label={label} type="date" value={value} onChange={onChange} />;
}

function TextArea({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium md:col-span-2">
      {label}
      <textarea value={value} required={required} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function kindFromTab(tab: Tab): ContentKind {
  if (tab === 'servicios') return 'services';
  if (tab === 'promociones') return 'promotions';
  if (tab === 'noticias') return 'news';
  return 'faqs';
}

function preparePayload(kind: ContentKind, form: any) {
  if (kind === 'faqs') return form;
  const payload = { ...form };
  if (!payload.slug) delete payload.slug;
  if (!payload.startDate) delete payload.startDate;
  if (!payload.endDate) delete payload.endDate;
  if (!payload.publishedAt) delete payload.publishedAt;
  return payload;
}

function dateInput(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeSettings(settings: Partial<SettingsForm>): SettingsForm {
  return { ...emptySettings, ...Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, value ?? ''])) };
}
