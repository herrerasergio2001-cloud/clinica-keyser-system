'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookOpenText, Download, Edit3, Eye, Printer, Save, Search, ShieldAlert, Trash2, X, XCircle } from 'lucide-react';
import { apiJson, authenticatedFetch, jsonHeaders } from '../_components/api-client';
import { AppSidebar, ProtectedModule, UserMenu, useSession } from '../_components/session';

type ClinicSettings = {
  clinicName: string;
  logoUrl?: string | null;
  printLogoUrl?: string | null;
  address?: string | null;
  phoneMain?: string | null;
  primaryColor?: string | null;
};

type DigitalPrescription = {
  id: string;
  code: string;
  patientName: string;
  patientAge?: string | null;
  diagnosis?: string | null;
  indications?: string | null;
  medications: string[];
  studies: string[];
  doctorName: string;
  doctorCode: string;
  doctor?: { doctorProfile?: { signatureUrl?: string | null } | null } | null;
  status: string;
  version: number;
  voidReason?: string | null;
  createdAt: string;
  versions?: Array<{ id: string; version: number; changeReason: string; createdAt: string }>;
};

const emptyForm = {
  patientName: '',
  patientAge: '',
  diagnosis: '',
  indications: '',
  medications: '',
  studies: '',
};

export default function DigitalPrescriptionPage() {
  const session = useSession();
  const canCreate = session?.role === 'SUPER_ADMIN' || session?.role === 'DOCTOR';
  const canAdmin = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN';
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const [items, setItems] = useState<DigitalPrescription[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<DigitalPrescription | null>(null);
  const [preview, setPreview] = useState<DigitalPrescription | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'VOIDED' | 'ALL'>('ALL');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, [status]);

  useEffect(() => {
    void apiJson<ClinicSettings>('/api/clinic-settings').then(setSettings).catch(() => setSettings(null));
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status });
      if (search.trim()) params.set('search', search.trim());
      const result = await apiJson<{ data: DigitalPrescription[] }>(`/api/digital-prescriptions?${params}`);
      setItems(result.data);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar el recetario'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: DigitalPrescription) {
    setEditing(item);
    setForm({
      patientName: item.patientName,
      patientAge: item.patientAge ?? '',
      diagnosis: item.diagnosis ?? '',
      indications: item.indications ?? '',
      medications: (item.medications ?? []).join('\n'),
      studies: (item.studies ?? []).join('\n'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    const payload = {
      ...form,
      medications: form.medications.split('\n').map((item) => item.trim()).filter(Boolean),
      studies: form.studies.split('\n').map((item) => item.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        const changeReason = window.prompt('Motivo de la modificación. La versión anterior quedará guardada:');
        if (!changeReason?.trim()) return;
        await apiJson(`/api/digital-prescriptions/${editing.id}`, {
          method: 'PATCH',
          headers: jsonHeaders(),
          body: JSON.stringify({ ...payload, changeReason }),
        });
        setMessage('Receta actualizada. La versión anterior quedó registrada.');
      } else {
        await apiJson('/api/digital-prescriptions', {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify(payload),
        });
        setMessage('Receta guardada correctamente.');
      }
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la receta'));
    }
  }

  async function voidPrescription(item: DigitalPrescription) {
    if (!window.confirm(`¿Anular la receta ${item.code}? Permanecerá en el historial administrativo.`)) return;
    const reason = window.prompt('Motivo de anulación:');
    if (!reason?.trim()) return;
    try {
      await apiJson(`/api/digital-prescriptions/${item.id}/void`, {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({ reason }),
      });
      setMessage('Receta anulada y registrada en auditoría.');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo anular la receta'));
    }
  }

  async function deletePrescription(item: DigitalPrescription) {
    if (!window.confirm(`¿Eliminar definitivamente la receta ${item.code}? Esta acción no se puede deshacer.`)) return;
    const reason = window.prompt('Motivo de eliminación definitiva:');
    if (!reason?.trim()) return;
    try {
      await apiJson(`/api/digital-prescriptions/${item.id}`, {
        method: 'DELETE',
        headers: jsonHeaders(),
        body: JSON.stringify({ reason }),
      });
      setMessage('Receta eliminada definitivamente.');
      setPreview(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo eliminar la receta'));
    }
  }

  async function downloadPdf(item: DigitalPrescription) {
    try {
      const response = await authenticatedFetch(`/api/digital-prescriptions/${item.id}/pdf`);
      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: 'No se pudo generar el PDF' }));
        throw new Error(result.message);
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.code}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo generar el PDF'));
    }
  }

  async function printPrescription(item: DigitalPrescription) {
    try {
      const [logo, signature] = await Promise.all([
        loadAsset(settings?.printLogoUrl ?? settings?.logoUrl, '/clinica-keyser-logo.jpg'),
        loadAsset(item.doctor?.doctorProfile?.signatureUrl),
      ]);
      const documentUrl = URL.createObjectURL(
        new Blob([prescriptionDocument(item, settings, logo, signature)], { type: 'text/html;charset=utf-8' }),
      );
      const popup = window.open(documentUrl, '_blank', 'width=850,height=950');
      if (!popup) throw new Error('El navegador bloqueó la ventana de impresión');
      window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60_000);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo imprimir la receta'));
    }
  }

  return (
    <ProtectedModule module="digitalPrescriptions">
      <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
          <AppSidebar active="Recetario Digital" />
          <section className="min-w-0">
            <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Documento independiente</p>
                  <h1 className="text-2xl font-semibold">Recetario Digital</h1>
                  <p className="text-sm text-slate-500">Recetas rápidas sin crear un paciente ni expediente.</p>
                </div>
                <UserMenu />
              </div>
            </header>

            <div className="mx-auto grid max-w-7xl gap-5 p-5 xl:grid-cols-[420px_1fr]">
              {(canCreate || (canAdmin && editing)) && (
                <form onSubmit={save} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold"><BookOpenText className="h-5 w-5 text-clinic-teal" />{editing ? `Editar ${editing.code}` : 'Nueva receta'}</h2>
                  <div className="grid gap-3">
                    <Field label="Nombre del paciente" value={form.patientName} onChange={(value) => setForm({ ...form, patientName: value })} required />
                    <Field label="Edad" value={form.patientAge} onChange={(value) => setForm({ ...form, patientAge: value })} />
                    <Area label="Diagnóstico" value={form.diagnosis} onChange={(value) => setForm({ ...form, diagnosis: value })} />
                    <Area label="Medicamentos (uno por línea)" value={form.medications} onChange={(value) => setForm({ ...form, medications: value })} />
                    <Area label="Estudios (uno por línea)" value={form.studies} onChange={(value) => setForm({ ...form, studies: value })} />
                    <Area label="Indicaciones" value={form.indications} onChange={(value) => setForm({ ...form, indications: value })} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" />Guardar</button>
                    {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="h-10 rounded-md border px-4 text-sm">Cancelar</button>}
                  </div>
                </form>
              )}

              <section className="space-y-4">
                {(message || error) && <div className={`rounded-md border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-teal-200 bg-teal-50 text-teal-900'}`}>{error || message}</div>}
                <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-md border px-3"><Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="Paciente, código, médico o diagnóstico" className="w-full bg-transparent text-sm outline-none" /></label>
                  <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border bg-white px-3 text-sm dark:bg-slate-950">
                    <option value="ALL">Todas</option>
                    <option value="ACTIVE">Activas</option>
                    <option value="VOIDED">Anuladas</option>
                  </select>
                  <button onClick={() => void load()} className="h-10 rounded-md border px-4 text-sm font-semibold">Buscar</button>
                </div>

                {loading ? <p className="p-5 text-sm text-slate-500">Cargando historial...</p> : items.length === 0 ? <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No hay recetas para este filtro.</p> : (
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2"><strong>{item.code}</strong><span className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'ACTIVE' ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'}`}>{item.status === 'ACTIVE' ? 'Activa' : 'Anulada'}</span></div>
                            <h3 className="mt-1 text-lg font-semibold">{item.patientName}</h3>
                            <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString('es-NI')} · {item.doctorName} · {item.doctorCode}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => setPreview(item)} className="rounded-md border p-2" title="Vista previa"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => void downloadPdf(item)} className="rounded-md border p-2" title="Descargar PDF"><Download className="h-4 w-4" /></button>
                            <button onClick={() => void printPrescription(item)} className="rounded-md border p-2" title="Imprimir"><Printer className="h-4 w-4" /></button>
                            {canAdmin && item.status === 'ACTIVE' && <button onClick={() => startEdit(item)} className="rounded-md border p-2" title="Editar con historial"><Edit3 className="h-4 w-4" /></button>}
                            {canAdmin && item.status === 'ACTIVE' && <button onClick={() => void voidPrescription(item)} className="rounded-md border border-amber-200 p-2 text-amber-700" title="Anular"><XCircle className="h-4 w-4" /></button>}
                            {isSuperAdmin && <button onClick={() => void deletePrescription(item)} className="rounded-md border border-red-200 p-2 text-red-700" title="Eliminar definitivamente"><Trash2 className="h-4 w-4" /></button>}
                          </div>
                        </div>
                        {item.diagnosis && <p className="mt-3 text-sm"><strong>Diagnóstico:</strong> {item.diagnosis}</p>}
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <List title="Medicamentos" items={item.medications ?? []} />
                          <List title="Estudios" items={item.studies ?? []} />
                        </div>
                        {item.indications && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Indicaciones:</strong> {item.indications}</p>}
                        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><ShieldAlert className="h-3.5 w-3.5" />Versión {item.version}{item.versions?.length ? ` · ${item.versions.length} versión(es) anterior(es) conservada(s)` : ''}</p>
                        {item.voidReason && <p className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-800">Motivo de anulación: {item.voidReason}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
        {preview && (
          <PreviewModal
            item={preview}
            settings={settings}
            onClose={() => setPreview(null)}
            onDownload={() => void downloadPdf(preview)}
            onPrint={() => void printPrescription(preview)}
          />
        )}
      </main>
    </ProtectedModule>
  );
}

function PreviewModal({ item, settings, onClose, onDownload, onPrint }: { item: DigitalPrescription; settings: ClinicSettings | null; onClose: () => void; onDownload: () => void; onPrint: () => void }) {
  const [logo, setLogo] = useState('/clinica-keyser-logo.jpg');
  const [signature, setSignature] = useState<string | null>(null);
  useEffect(() => {
    void loadAsset(settings?.printLogoUrl ?? settings?.logoUrl, '/clinica-keyser-logo.jpg').then(setLogo);
    void loadAsset(item.doctor?.doctorProfile?.signatureUrl).then((value) => setSignature(value || null));
  }, [item.id, item.doctor?.doctorProfile?.signatureUrl, settings?.logoUrl, settings?.printLogoUrl]);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex justify-end"><button onClick={onClose} className="rounded-full bg-white p-2 text-slate-900"><X className="h-5 w-5" /></button></div>
        <PrescriptionPaper item={item} settings={settings} logo={logo} signature={signature} />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button onClick={onDownload} className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-900"><Download className="h-4 w-4" />Descargar PDF</button>
          <button onClick={onPrint} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Printer className="h-4 w-4" />Imprimir</button>
        </div>
      </div>
    </div>
  );
}

function PrescriptionPaper({ item, settings, logo, signature }: { item: DigitalPrescription; settings: ClinicSettings | null; logo: string; signature: string | null }) {
  return (
    <article id={`prescription-preview-${item.id}`} className="min-h-[900px] bg-white p-10 text-slate-950 shadow-2xl">
      <header className="flex items-center gap-5 border-b-2 border-red-500 pb-5">
        <img src={logo} alt="Logo Clínica Keyser" className="h-20 w-20 object-contain" />
        <div>
          <h2 className="text-2xl font-bold" style={{ color: settings?.primaryColor ?? '#1f2f66' }}>{settings?.clinicName ?? 'Clínica Keyser'}</h2>
          <p className="text-sm">{settings?.address}</p>
          <p className="text-sm">Teléfono: {settings?.phoneMain ?? '-'}</p>
        </div>
      </header>
      <div className="mt-6 flex items-start justify-between gap-4">
        <div><h3 className="text-xl font-semibold">Receta médica</h3><p className="text-sm text-slate-500">Código: {item.code}</p></div>
        <div className="text-right text-sm"><p>{new Date(item.createdAt).toLocaleDateString('es-NI')}</p><p>{new Date(item.createdAt).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}</p></div>
      </div>
      {item.status === 'VOIDED' && <p className="mt-4 rounded-md bg-red-50 p-3 font-semibold text-red-700">RECETA ANULADA · {item.voidReason}</p>}
      <section className="mt-6 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Paciente:</strong> {item.patientName}</p><p><strong>Edad:</strong> {item.patientAge || '-'}</p></section>
      {item.diagnosis && <PaperSection title="Diagnóstico"><p className="whitespace-pre-wrap">{item.diagnosis}</p></PaperSection>}
      <div className="grid gap-5 md:grid-cols-2"><PaperSection title="Medicamentos"><PaperList items={item.medications} /></PaperSection><PaperSection title="Estudios"><PaperList items={item.studies} /></PaperSection></div>
      {item.indications && <PaperSection title="Indicaciones"><p className="whitespace-pre-wrap">{item.indications}</p></PaperSection>}
      <footer className="mt-20 text-center text-sm">
        {signature && <img src={signature} alt="Firma digital" className="mx-auto mb-2 max-h-16 max-w-48 object-contain" />}
        <p>__________________________________</p>
        <p className="font-semibold">Dr(a). {item.doctorName}</p>
        <p>Código profesional: {item.doctorCode}</p>
        <p className="mt-3 text-xs text-slate-500">Documento emitido electrónicamente por Clínica Keyser.</p>
      </footer>
    </article>
  );
}

function PaperSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6"><h4 className="mb-2 border-b pb-1 font-semibold text-slate-800">{title}</h4>{children}</section>;
}

function PaperList({ items }: { items: string[] }) {
  return items.length ? <ol className="list-decimal space-y-1 pl-5">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol> : <p className="text-slate-500">Sin registros</p>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-white px-3 dark:bg-slate-950" /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border bg-white px-3 py-2 dark:bg-slate-950" /></label>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950"><strong>{title}</strong>{items.length ? <ol className="mt-1 list-decimal pl-5">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol> : <p className="mt-1 text-slate-500">Sin registros</p>}</div>;
}

async function loadAsset(url?: string | null, fallback = '') {
  if (!url) return fallback;
  if (!url.startsWith('/api/')) return url;
  try {
    const response = await authenticatedFetch(url);
    if (!response.ok) return fallback;
    return await blobToDataUrl(await response.blob());
  } catch {
    return fallback;
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function prescriptionDocument(item: DigitalPrescription, settings: ClinicSettings | null, logo: string, signature: string) {
  const list = (values: string[]) => values.length ? `<ol>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ol>` : '<p>Sin registros</p>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(item.code)}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:0}.paper{max-width:760px;margin:auto;padding:42px}.head{display:flex;gap:20px;align-items:center;border-bottom:2px solid #ef2f32;padding-bottom:18px}.head img{width:78px;height:78px;object-fit:contain}.meta{display:flex;justify-content:space-between;margin-top:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.section{margin-top:24px}.section h3{border-bottom:1px solid #cbd5e1;padding-bottom:5px}.signature{text-align:center;margin-top:70px}.signature img{max-width:180px;max-height:65px}ol{padding-left:22px}p{white-space:pre-wrap}@media print{.paper{padding:18px}}</style></head><body><main class="paper"><header class="head"><img src="${logo || '/clinica-keyser-logo.jpg'}"><div><h1>${escapeHtml(settings?.clinicName ?? 'Clínica Keyser')}</h1><p>${escapeHtml(settings?.address ?? '')}</p><p>Teléfono: ${escapeHtml(settings?.phoneMain ?? '-')}</p></div></header><div class="meta"><div><h2>Receta médica</h2><p>Código: ${escapeHtml(item.code)}</p></div><div><p>${new Date(item.createdAt).toLocaleDateString('es-NI')}</p><p>${new Date(item.createdAt).toLocaleTimeString('es-NI')}</p></div></div><p><strong>Paciente:</strong> ${escapeHtml(item.patientName)} &nbsp; <strong>Edad:</strong> ${escapeHtml(item.patientAge ?? '-')}</p>${item.diagnosis ? `<section class="section"><h3>Diagnóstico</h3><p>${escapeHtml(item.diagnosis)}</p></section>` : ''}<div class="grid"><section class="section"><h3>Medicamentos</h3>${list(item.medications)}</section><section class="section"><h3>Estudios</h3>${list(item.studies)}</section></div>${item.indications ? `<section class="section"><h3>Indicaciones</h3><p>${escapeHtml(item.indications)}</p></section>` : ''}<footer class="signature">${signature ? `<img src="${signature}">` : ''}<p>__________________________________</p><strong>Dr(a). ${escapeHtml(item.doctorName)}</strong><p>Código profesional: ${escapeHtml(item.doctorCode)}</p></footer></main><script>window.addEventListener('load',()=>window.setTimeout(()=>window.print(),350));</script></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] ?? char));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
