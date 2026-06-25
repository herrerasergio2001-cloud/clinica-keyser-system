'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Save,
  Settings,
  Stethoscope,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu } from '../../_components/session';
import { apiBase, authenticatedFetch, jsonHeaders } from '../../_components/api-client';

type Tab = 'clinica' | 'services' | 'gallery' | 'team';
type Collection = 'services' | 'gallery' | 'team';

type SettingsForm = {
  clinicName: string;
  slogan: string;
  logoUrl: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  institutionalText: string;
  institutionalImageUrl: string;
  primaryPhone: string;
  aestheticPhone: string;
  whatsapp: string;
  address: string;
  schedule: string;
  mapEmbedUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  aestheticFacebookUrl: string;
  aestheticInstagramUrl: string;
  aestheticTiktokUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type ServiceItem = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  icon: string;
  imageUrl: string;
  category: string;
  whatsappText: string;
  isActive: boolean;
  sortOrder: number;
};

type GalleryItem = {
  id?: string;
  title: string;
  altText: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
};

type TeamItem = {
  id?: string;
  name: string;
  specialty: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

type AdminPayload = {
  settings: SettingsForm;
  services: ServiceItem[];
  gallery: GalleryItem[];
  team: TeamItem[];
};

const emptySettings: SettingsForm = {
  clinicName: 'Clínica Keyser',
  slogan: 'Atención médica integral en Chinandega.',
  logoUrl: '/clinic-media/logo.png',
  heroImageUrl: '/clinic-media/fachada.jpg',
  heroVideoUrl: '',
  institutionalText: 'Cuidamos de cada paciente con atención cercana, criterio médico y el respaldo de un equipo comprometido con su bienestar.',
  institutionalImageUrl: '/clinic-media/consulta-medica.jpg',
  primaryPhone: '8495-2200',
  aestheticPhone: '7650-7993',
  whatsapp: '50584952200',
  address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.',
  schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
  mapEmbedUrl: '',
  facebookUrl: '',
  instagramUrl: 'https://www.instagram.com/clinicakeyser',
  tiktokUrl: '',
  aestheticFacebookUrl: '',
  aestheticInstagramUrl: '',
  aestheticTiktokUrl: 'https://www.tiktok.com/@centro_estetico_keyser',
  primaryColor: '#1f2f66',
  secondaryColor: '#ef2f32',
  accentColor: '#087f8c',
};

const emptyService: ServiceItem = {
  title: '',
  slug: '',
  description: '',
  content: '',
  icon: 'stethoscope',
  imageUrl: '',
  category: 'Especialidad médica',
  whatsappText: '',
  isActive: true,
  sortOrder: 0,
};

const emptyGallery: GalleryItem = {
  title: '',
  altText: '',
  imageUrl: '',
  category: 'Instalaciones',
  isActive: true,
  sortOrder: 0,
};

const emptyTeam: TeamItem = {
  name: '',
  specialty: '',
  description: '',
  imageUrl: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminPublicPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('clinica');
  const [data, setData] = useState<AdminPayload>({ settings: emptySettings, services: [], gallery: [], team: [] });
  const [serviceForm, setServiceForm] = useState<ServiceItem>(emptyService);
  const [galleryForm, setGalleryForm] = useState<GalleryItem>(emptyGallery);
  const [teamForm, setTeamForm] = useState<TeamItem>(emptyTeam);
  const [editing, setEditing] = useState<Record<Collection, string | null>>({ services: null, gallery: null, team: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, [router]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/api/admin/public');
      if (response.status === 401 || response.status === 403) {
        router.replace('/login?next=/admin/pagina-publica');
        return;
      }
      if (!response.ok) throw new Error('No se pudo cargar el contenido público.');
      const payload = await response.json() as Partial<AdminPayload>;
      setData({
        settings: normalizeSettings(payload.settings ?? {}),
        services: payload.services ?? [],
        gallery: payload.gallery ?? [],
        team: payload.team ?? [],
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
    try {
      const response = await authenticatedFetch('/api/admin/public/settings', {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify(data.settings),
      });
      if (!response.ok) throw new Error('No se pudo guardar la información de la clínica.');
      const savedSettings = normalizeSettings(await response.json());
      setData((current) => ({ ...current, settings: savedSettings }));
      setMessage('Información pública actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCollection(kind: Collection, form: ServiceItem | GalleryItem | TeamItem, event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const id = editing[kind];
      const response = await authenticatedFetch(`/api/admin/public/${kind}${id ? `/${id}` : ''}`, {
        method: id ? 'PATCH' : 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(cleanPayload(form)),
      });
      if (!response.ok) throw new Error('No se pudo guardar el contenido.');
      resetForm(kind);
      setMessage('Contenido guardado correctamente.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(kind: Collection, id?: string) {
    if (!id || !window.confirm('¿Desea eliminar este elemento de la página pública?')) return;
    setSaving(true);
    setError('');
    try {
      const response = await authenticatedFetch(`/api/admin/public/${kind}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar el elemento.');
      setMessage('Elemento eliminado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File | undefined, assign: (url: string) => void) {
    if (!file) return;
    setSaving(true);
    setError('');
    setMessage('Subiendo archivo...');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await authenticatedFetch('/api/admin/public/upload', { method: 'POST', body });
      if (!response.ok) throw new Error('No se pudo subir el archivo.');
      const uploaded = await response.json() as { mediaUrl?: string; imageUrl?: string };
      assign(uploaded.mediaUrl ?? uploaded.imageUrl ?? '');
      setMessage('Archivo cargado. Guarde los cambios para publicarlo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo.');
    } finally {
      setSaving(false);
    }
  }

  function edit(kind: Collection, item: ServiceItem | GalleryItem | TeamItem) {
    setEditing((current) => ({ ...current, [kind]: item.id ?? null }));
    if (kind === 'services') setServiceForm({ ...emptyService, ...item } as ServiceItem);
    if (kind === 'gallery') setGalleryForm({ ...emptyGallery, ...item } as GalleryItem);
    if (kind === 'team') setTeamForm({ ...emptyTeam, ...item } as TeamItem);
    setMessage('Editando el elemento seleccionado.');
  }

  function resetForm(kind: Collection) {
    setEditing((current) => ({ ...current, [kind]: null }));
    if (kind === 'services') setServiceForm(emptyService);
    if (kind === 'gallery') setGalleryForm(emptyGallery);
    if (kind === 'team') setTeamForm(emptyTeam);
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
                  <p className="text-xs text-slate-500">Administración / Página pública</p>
                  <h1 className="mt-1 text-2xl font-semibold">Sitio web de Clínica Keyser</h1>
                  <p className="mt-1 text-sm text-slate-500">Gestione textos, multimedia, servicios, instalaciones, equipo y redes sociales.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <UserMenu />
                  <Link href="/panel" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Regresar</Link>
                  <Link href="/" target="_blank" className="rounded-md bg-clinic-teal px-3 py-2 text-sm font-semibold text-white">Ver sitio público</Link>
                </div>
              </div>
            </header>

            <section className="mx-auto max-w-7xl px-5 py-6">
              {loading ? (
                <div className="flex items-center gap-2 rounded-lg border bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><Loader2 className="h-4 w-4 animate-spin" />Cargando contenido...</div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                  <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <TabButton active={tab === 'clinica'} onClick={() => setTab('clinica')} icon={<Settings />} label="Clínica y contacto" />
                    <TabButton active={tab === 'services'} onClick={() => setTab('services')} icon={<Stethoscope />} label="Servicios" />
                    <TabButton active={tab === 'gallery'} onClick={() => setTab('gallery')} icon={<ImageIcon />} label="Instalaciones" />
                    <TabButton active={tab === 'team'} onClick={() => setTab('team')} icon={<Users />} label="Equipo médico" />
                  </aside>

                  <div className="grid gap-4">
                    {message && <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-100">{message}</p>}
                    {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-100">{error}</p>}

                    {tab === 'clinica' && (
                      <SettingsEditor
                        settings={data.settings}
                        setSettings={(settings) => setData((current) => ({ ...current, settings }))}
                        saving={saving}
                        onSave={saveSettings}
                        onUpload={(field, file) => void upload(file, (url) => setData((current) => ({ ...current, settings: { ...current.settings, [field]: url } })))}
                      />
                    )}
                    {tab === 'services' && (
                      <ServiceEditor
                        form={serviceForm}
                        setForm={setServiceForm}
                        items={data.services}
                        editing={Boolean(editing.services)}
                        saving={saving}
                        onSave={(event) => void saveCollection('services', serviceForm, event)}
                        onCancel={() => resetForm('services')}
                        onEdit={(item) => edit('services', item)}
                        onDelete={(id) => void remove('services', id)}
                        onUpload={(file) => void upload(file, (url) => setServiceForm((current) => ({ ...current, imageUrl: url })))}
                      />
                    )}
                    {tab === 'gallery' && (
                      <GalleryEditor
                        form={galleryForm}
                        setForm={setGalleryForm}
                        items={data.gallery}
                        editing={Boolean(editing.gallery)}
                        saving={saving}
                        onSave={(event) => void saveCollection('gallery', galleryForm, event)}
                        onCancel={() => resetForm('gallery')}
                        onEdit={(item) => edit('gallery', item)}
                        onDelete={(id) => void remove('gallery', id)}
                        onUpload={(file) => void upload(file, (url) => setGalleryForm((current) => ({ ...current, imageUrl: url })))}
                      />
                    )}
                    {tab === 'team' && (
                      <TeamEditor
                        form={teamForm}
                        setForm={setTeamForm}
                        items={data.team}
                        editing={Boolean(editing.team)}
                        saving={saving}
                        onSave={(event) => void saveCollection('team', teamForm, event)}
                        onCancel={() => resetForm('team')}
                        onEdit={(item) => edit('team', item)}
                        onDelete={(id) => void remove('team', id)}
                        onUpload={(file) => void upload(file, (url) => setTeamForm((current) => ({ ...current, imageUrl: url })))}
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

function SettingsEditor({ settings, setSettings, saving, onSave, onUpload }: {
  settings: SettingsForm;
  setSettings: (settings: SettingsForm) => void;
  saving: boolean;
  onSave: (event: FormEvent) => void;
  onUpload: (field: keyof SettingsForm, file?: File) => void;
}) {
  return (
    <form onSubmit={onSave} className="grid gap-5">
      <Panel title="Portada e identidad" description="La portada admite una imagen o un video MP4/WEBM. Si existe video, tendrá prioridad.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nombre de la clínica" value={settings.clinicName} onChange={(clinicName) => setSettings({ ...settings, clinicName })} />
          <TextField label="Texto principal" value={settings.slogan} onChange={(slogan) => setSettings({ ...settings, slogan })} />
          <MediaField label="Logotipo" value={settings.logoUrl} accept="image/*" onChange={(logoUrl) => setSettings({ ...settings, logoUrl })} onUpload={(file) => onUpload('logoUrl', file)} />
          <MediaField label="Imagen de portada" value={settings.heroImageUrl} accept="image/*" onChange={(heroImageUrl) => setSettings({ ...settings, heroImageUrl })} onUpload={(file) => onUpload('heroImageUrl', file)} />
          <MediaField label="Video de portada (opcional)" value={settings.heroVideoUrl} accept="video/mp4,video/webm" onChange={(heroVideoUrl) => setSettings({ ...settings, heroVideoUrl })} onUpload={(file) => onUpload('heroVideoUrl', file)} />
          <MediaField label="Fotografía institucional" value={settings.institutionalImageUrl} accept="image/*" onChange={(institutionalImageUrl) => setSettings({ ...settings, institutionalImageUrl })} onUpload={(file) => onUpload('institutionalImageUrl', file)} />
          <TextArea label="Presentación institucional" value={settings.institutionalText} onChange={(institutionalText) => setSettings({ ...settings, institutionalText })} />
        </div>
      </Panel>

      <Panel title="Contacto y horario" description="Estos datos aparecen en la sección de contacto y en los botones de agenda.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Teléfono principal" value={settings.primaryPhone} onChange={(primaryPhone) => setSettings({ ...settings, primaryPhone })} />
          <TextField label="Teléfono centro estético" value={settings.aestheticPhone} onChange={(aestheticPhone) => setSettings({ ...settings, aestheticPhone })} />
          <TextField label="WhatsApp con código de país" value={settings.whatsapp} onChange={(whatsapp) => setSettings({ ...settings, whatsapp })} />
          <TextField label="Horario" value={settings.schedule} onChange={(schedule) => setSettings({ ...settings, schedule })} />
          <TextArea label="Dirección" value={settings.address} onChange={(address) => setSettings({ ...settings, address })} />
          <TextArea label="URL de Google Maps embebido (opcional)" value={settings.mapEmbedUrl} onChange={(mapEmbedUrl) => setSettings({ ...settings, mapEmbedUrl })} />
        </div>
      </Panel>

      <Panel title="Redes sociales" description="Las direcciones completas solo se usan internamente; el sitio muestra únicamente iconos.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Facebook · Clínica Keyser" value={settings.facebookUrl} onChange={(facebookUrl) => setSettings({ ...settings, facebookUrl })} />
          <TextField label="Instagram · Clínica Keyser" value={settings.instagramUrl} onChange={(instagramUrl) => setSettings({ ...settings, instagramUrl })} />
          <TextField label="TikTok · Clínica Keyser" value={settings.tiktokUrl} onChange={(tiktokUrl) => setSettings({ ...settings, tiktokUrl })} />
          <TextField label="Facebook · Centro Estético Keyser" value={settings.aestheticFacebookUrl} onChange={(aestheticFacebookUrl) => setSettings({ ...settings, aestheticFacebookUrl })} />
          <TextField label="Instagram · Centro Estético Keyser" value={settings.aestheticInstagramUrl} onChange={(aestheticInstagramUrl) => setSettings({ ...settings, aestheticInstagramUrl })} />
          <TextField label="TikTok · Centro Estético Keyser" value={settings.aestheticTiktokUrl} onChange={(aestheticTiktokUrl) => setSettings({ ...settings, aestheticTiktokUrl })} />
        </div>
      </Panel>

      <SubmitButton saving={saving} label="Guardar sitio público" />
    </form>
  );
}

function ServiceEditor(props: EditorProps<ServiceItem>) {
  return (
    <>
      <Panel title={`${props.editing ? 'Editar' : 'Agregar'} servicio`} action={props.editing ? <CancelButton onClick={props.onCancel} /> : undefined}>
        <form onSubmit={props.onSave} className="grid gap-4 md:grid-cols-2">
          <TextField label="Nombre" value={props.form.title} onChange={(title) => props.setForm({ ...props.form, title })} required />
          <TextField label="Identificador (slug)" value={props.form.slug} onChange={(slug) => props.setForm({ ...props.form, slug })} />
          <TextField label="Categoría" value={props.form.category} onChange={(category) => props.setForm({ ...props.form, category })} />
          <TextField label="Orden" type="number" value={String(props.form.sortOrder)} onChange={(sortOrder) => props.setForm({ ...props.form, sortOrder: Number(sortOrder) })} />
          <TextArea label="Descripción breve" value={props.form.description} onChange={(description) => props.setForm({ ...props.form, description })} required />
          <MediaField label="Imagen opcional" value={props.form.imageUrl} accept="image/*" onChange={(imageUrl) => props.setForm({ ...props.form, imageUrl })} onUpload={props.onUpload} />
          <ActiveField checked={props.form.isActive} onChange={(isActive) => props.setForm({ ...props.form, isActive })} />
          <SubmitButton saving={props.saving} label={props.editing ? 'Guardar cambios' : 'Agregar servicio'} />
        </form>
      </Panel>
      <ItemList items={props.items} getTitle={(item) => item.title} getSubtitle={(item) => item.category} onEdit={props.onEdit} onDelete={props.onDelete} />
    </>
  );
}

function GalleryEditor(props: EditorProps<GalleryItem>) {
  return (
    <>
      <Panel title={`${props.editing ? 'Editar' : 'Agregar'} fotografía`} action={props.editing ? <CancelButton onClick={props.onCancel} /> : undefined}>
        <form onSubmit={props.onSave} className="grid gap-4 md:grid-cols-2">
          <TextField label="Título" value={props.form.title} onChange={(title) => props.setForm({ ...props.form, title })} required />
          <TextField label="Categoría" value={props.form.category} onChange={(category) => props.setForm({ ...props.form, category })} />
          <TextField label="Texto alternativo accesible" value={props.form.altText} onChange={(altText) => props.setForm({ ...props.form, altText })} required />
          <TextField label="Orden" type="number" value={String(props.form.sortOrder)} onChange={(sortOrder) => props.setForm({ ...props.form, sortOrder: Number(sortOrder) })} />
          <MediaField label="Fotografía" value={props.form.imageUrl} accept="image/*" onChange={(imageUrl) => props.setForm({ ...props.form, imageUrl })} onUpload={props.onUpload} required />
          <ActiveField checked={props.form.isActive} onChange={(isActive) => props.setForm({ ...props.form, isActive })} />
          <SubmitButton saving={props.saving} label={props.editing ? 'Guardar cambios' : 'Agregar fotografía'} />
        </form>
      </Panel>
      <ItemList items={props.items} getTitle={(item) => item.title} getSubtitle={(item) => item.category} getImage={(item) => item.imageUrl} onEdit={props.onEdit} onDelete={props.onDelete} />
    </>
  );
}

function TeamEditor(props: EditorProps<TeamItem>) {
  return (
    <>
      <Panel title={`${props.editing ? 'Editar' : 'Agregar'} integrante`} action={props.editing ? <CancelButton onClick={props.onCancel} /> : undefined}>
        <form onSubmit={props.onSave} className="grid gap-4 md:grid-cols-2">
          <TextField label="Nombre" value={props.form.name} onChange={(name) => props.setForm({ ...props.form, name })} required />
          <TextField label="Especialidad" value={props.form.specialty} onChange={(specialty) => props.setForm({ ...props.form, specialty })} required />
          <TextArea label="Descripción breve" value={props.form.description} onChange={(description) => props.setForm({ ...props.form, description })} required />
          <TextField label="Orden" type="number" value={String(props.form.sortOrder)} onChange={(sortOrder) => props.setForm({ ...props.form, sortOrder: Number(sortOrder) })} />
          <MediaField label="Fotografía profesional" value={props.form.imageUrl} accept="image/*" onChange={(imageUrl) => props.setForm({ ...props.form, imageUrl })} onUpload={props.onUpload} />
          <ActiveField checked={props.form.isActive} onChange={(isActive) => props.setForm({ ...props.form, isActive })} />
          <SubmitButton saving={props.saving} label={props.editing ? 'Guardar cambios' : 'Agregar integrante'} />
        </form>
      </Panel>
      <ItemList items={props.items} getTitle={(item) => item.name} getSubtitle={(item) => item.specialty} getImage={(item) => item.imageUrl} onEdit={props.onEdit} onDelete={props.onDelete} />
    </>
  );
}

type EditorProps<T extends { id?: string }> = {
  form: T;
  setForm: (form: T) => void;
  items: T[];
  editing: boolean;
  saving: boolean;
  onSave: (event: FormEvent) => void;
  onCancel: () => void;
  onEdit: (item: T) => void;
  onDelete: (id?: string) => void;
  onUpload: (file?: File) => void;
};

function ItemList<T extends { id?: string; isActive: boolean; sortOrder: number }>({ items, getTitle, getSubtitle, getImage, onEdit, onDelete }: {
  items: T[];
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  getImage?: (item: T) => string;
  onEdit: (item: T) => void;
  onDelete: (id?: string) => void;
}) {
  return (
    <Panel title="Contenido publicado">
      <div className="grid gap-3">
        {!items.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">No hay registros todavía.</p>}
        {items.map((item) => (
          <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-4">
              {getImage?.(item) && <img src={resolveMedia(getImage(item))} alt="" className="h-16 w-20 rounded object-cover" />}
              <div>
                <p className="font-semibold">{getTitle(item)}</p>
                <p className="mt-1 text-sm text-slate-500">{getSubtitle(item)}</p>
                <p className="mt-1 text-xs text-slate-400">{item.isActive ? 'Visible' : 'Oculto'} · Orden {item.sortOrder}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => onEdit(item)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><Edit3 className="h-4 w-4" />Editar</button>
              <button type="button" onClick={() => onDelete(item.id)} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 dark:border-red-900"><Trash2 className="h-4 w-4" />Eliminar</button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${active ? 'bg-blue-50 text-clinic-teal dark:bg-blue-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'} [&_svg]:h-4 [&_svg]:w-4`}>
      {icon}{label}
    </button>
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

function TextArea({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium md:col-span-2">
      {label}
      <textarea value={value} required={required} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function MediaField({ label, value, accept, onChange, onUpload, required }: { label: string; value: string; accept: string; onChange: (value: string) => void; onUpload: (file?: File) => void; required?: boolean }) {
  return (
    <div className="grid gap-2">
      <TextField label={label} value={value} onChange={onChange} required={required} />
      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-3 text-xs font-medium text-slate-500 dark:border-slate-700">
        <Upload className="h-4 w-4" /> Subir archivo
        <input type="file" accept={accept} onChange={(event: ChangeEvent<HTMLInputElement>) => onUpload(event.target.files?.[0])} className="hidden" />
      </label>
    </div>
  );
}

function ActiveField({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      Visible en la página pública
    </label>
  );
}

function SubmitButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clinic-teal px-5 text-sm font-semibold text-white disabled:opacity-70">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? 'Guardando...' : label}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"><X className="h-4 w-4" />Cancelar</button>;
}

function cleanPayload(form: object) {
  return Object.fromEntries(Object.entries(form).filter(([key, value]) => key !== 'id' && value !== ''));
}

function normalizeSettings(settings: Partial<SettingsForm>): SettingsForm {
  return { ...emptySettings, ...Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, value ?? ''])) };
}

function resolveMedia(value: string) {
  return value.startsWith('/api/') ? `${apiBase}${value}` : value;
}
