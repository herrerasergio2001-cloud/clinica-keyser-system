'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Beaker, ClipboardList, Download, FilePlus2, FlaskConical, Home, Printer, Save, TestTube2, XCircle } from 'lucide-react';
import { MasterActionMenu } from '../../_components/master-action-menu';
import { AppSidebar, ProtectedModule, UserMenu, decodeSession } from '../../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Patient = { id: string; fullName: string; patientCode: string; gender: string; birthDate: string };
type Order = { id: string; patient: Patient; orderType: string; priority: string; status: string; createdAt: string; observations?: string };
type Template = { id: string; name: string; category: string; analytes: Analyte[] };
type Analyte = { id: string; name: string; unit?: string; referenceText?: string; referenceMin?: string; referenceMax?: string };
type Reagent = { id: string; name: string; brand?: string; batchNumber?: string; expiresAt?: string; quantity: string; unit?: string; minimumStock: string };

function headers(json = true): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function printLabResult(order: Order | undefined, template: Template | undefined, values: Record<string, string>) {
  try {
    if (!order || !template) throw new Error('Guarde el resultado y seleccione una plantilla antes de imprimir.');
    const rows = template.analytes.map((analyte) => `<tr><td>${analyte.name}</td><td>${values[analyte.id] ?? ''}</td><td>${analyte.unit ?? '-'}</td><td>${referenceLabel(analyte)}</td><td>${flagLabel(values[analyte.id], analyte)}</td></tr>`).join('');
    const popup = window.open('', '_blank', 'width=760,height=900');
    if (!popup) throw new Error('El navegador bloqueó la ventana de impresión.');
    popup.document.write(`<!doctype html><html><head><title>Resultado laboratorio</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#0f172a}.head{display:flex;gap:16px;align-items:center;border-bottom:1px solid #cbd5e1;padding-bottom:14px}img{height:72px;object-fit:contain}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc}.meta{margin-top:18px;font-size:13px;line-height:1.6}.foot{margin-top:40px;text-align:center;font-size:12px}</style></head><body><div class="head"><img src="/clinica-keyser-logo.jpg" alt="Clínica Keyser"/><div><h2>Clínica Keyser</h2><p>Resultado de laboratorio</p></div></div><div class="meta"><strong>Paciente:</strong> ${order.patient?.fullName ?? '-'} · ${order.patient?.patientCode ?? '-'}<br/><strong>Fecha:</strong> ${new Date().toLocaleString('es-NI')}<br/><strong>Médico solicitante:</strong> Médico tratante<br/><strong>Examen:</strong> ${template.name}</div><table><thead><tr><th>Analito</th><th>Resultado</th><th>Unidad</th><th>Referencia</th><th>Indicador</th></tr></thead><tbody>${rows}</tbody></table><div class="foot"><p>__________________________________</p><p>Firma y sello de laboratorio</p></div><script>window.onload=()=>{window.print();}</script></body></html>`);
    popup.document.close();
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo imprimir el resultado.');
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, options);
  if (res.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login?next=/laboratorio';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useAuthRedirect() {
  const router = useRouter();
  useEffect(() => { if (!localStorage.getItem('accessToken')) router.replace('/login?next=/laboratorio'); }, [router]);
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const role = decodeSession()?.role;
  const labActions = role === 'RECEPTION' ? [
    { label: 'Nueva orden', icon: ClipboardList, onClick: () => router.push('/laboratorio/ordenes/nueva') },
  ] : [
    { label: 'Nueva orden', icon: ClipboardList, onClick: () => router.push('/laboratorio/ordenes/nueva') },
    { label: 'Nuevo resultado', icon: FilePlus2, onClick: () => router.push('/laboratorio/ordenes') },
    { label: 'Nuevo reactivo', icon: Beaker, onClick: () => router.push('/laboratorio/reactivos') },
    { label: 'Nueva plantilla', icon: FlaskConical, onClick: () => router.push('/laboratorio/plantillas') },
    { label: 'Movimiento de reactivo', icon: TestTube2, onClick: () => router.push('/laboratorio/reactivos') },
  ];
  return (
    <ProtectedModule module="laboratory">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
      <AppSidebar active="Laboratorio" />
      <section className="min-w-0">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Laboratorio</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link href="/panel" className="inline-flex items-center gap-1 text-clinic-teal"><Home className="h-3.5 w-3.5" />Inicio</Link>
              <span>/</span>
              <Link href="/laboratorio" className="hover:text-clinic-teal">Laboratorio</Link>
              <span>/</span>
              <span>{title}</span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <UserMenu />
            {(role === 'RECEPTION' ? [
              ['/laboratorio/ordenes/nueva', 'Nueva orden'],
            ] : [
              ['/laboratorio', 'Panel'],
              ['/laboratorio/ordenes', 'Órdenes'],
              ['/laboratorio/ordenes/nueva', 'Nueva orden'],
              ['/laboratorio/plantillas', 'Plantillas'],
              ['/laboratorio/reactivos', 'Reactivos'],
              ['/laboratorio/vencimientos', 'Vencimientos'],
            ]).map(([href, label]) => <Link key={href} href={href} className="rounded-md border border-slate-200 px-3 py-2 hover:border-clinic-teal hover:text-clinic-teal dark:border-slate-700">{label}</Link>)}
            <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 hover:border-clinic-teal hover:text-clinic-teal dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Regresar</button>
          </nav>
        </div>
      </header>
      <div className="p-6">{children}</div>
      </section>
      </div>
      <MasterActionMenu actions={labActions} />
    </main>
    </ProtectedModule>
  );
}

export function LabDashboard() {
  useAuthRedirect();
  const [data, setData] = useState<any>();
  useEffect(() => void api('/api/laboratory/dashboard', { headers: headers(false) }).then(setData).catch(() => undefined), []);
  return <Shell title="Panel"><div className="grid gap-4 md:grid-cols-4"><Metric icon={ClipboardList} label="Órdenes" value={data?.orders ?? '...'} /><Metric icon={TestTube2} label="Urgentes" value={data?.urgent ?? '...'} /><Metric icon={Beaker} label="Alertas reactivos" value={data?.reagents?.length ?? '...'} /><Link href="/laboratorio/ordenes/nueva" className="rounded-lg bg-clinic-teal p-4 text-white"><FilePlus2 className="mb-2 h-5 w-5" />Nueva orden</Link></div><OrderList orders={data?.recent ?? []} /></Shell>;
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><Icon className="mb-2 h-5 w-5 text-clinic-teal" /><p className="text-sm text-slate-500">{label}</p><strong className="text-2xl">{value}</strong></article>;
}

export function OrdersPage() {
  useAuthRedirect();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<'active' | 'cancelled' | 'all'>('active');
  const isAdmin = decodeSession()?.role === 'SUPER_ADMIN';
  const load = () => api<Order[]>(`/api/laboratory/orders?status=${status}`, { headers: headers(false) }).then(setOrders).catch(() => undefined);
  useEffect(() => void load(), [status]);
  async function cancel(order: Order) {
    if (!window.confirm(`¿Anular la orden de ${order.patient.fullName}?`)) return;
    const reason = window.prompt('Motivo de anulación:');
    if (!reason?.trim()) return;
    await api(`/api/laboratory/orders/${order.id}/cancel`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ reason }) });
    await load();
  }
  return <Shell title="Órdenes"><div className="flex justify-end"><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border bg-white px-3 text-sm dark:bg-slate-950"><option value="active">Activas</option><option value="cancelled">Anuladas</option><option value="all">Todas</option></select></div><OrderList orders={orders} onCancel={isAdmin ? cancel : undefined} /></Shell>;
}

function OrderList({ orders, onCancel }: { orders: Order[]; onCancel?: (order: Order) => void }) {
  return <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{orders.map((order) => <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap justify-between gap-2"><div><strong>{order.orderType}</strong><p className="text-sm text-slate-500">{order.patient?.fullName} · {order.patient?.patientCode}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800">{statusLabel(order.status)}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><span>Fecha: {new Date(order.createdAt).toLocaleDateString('es-NI')}</span><span>Prioridad: {priorityLabel(order.priority)}</span></div><div className="mt-4 flex flex-wrap gap-2"><Link href={`/laboratorio/resultados/${order.id}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">Abrir</Link>{order.status !== 'CANCELLED' && <Link href={`/laboratorio/resultados/${order.id}`} className="rounded-md bg-clinic-teal px-3 py-2 text-sm font-medium text-white">Resultado</Link>}{onCancel && order.status !== 'CANCELLED' && <button onClick={() => void onCancel(order)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"><XCircle className="h-4 w-4" />Anular</button>}</div></article>)}</div>;
}

export function NewOrderPage() {
  useAuthRedirect();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState({ patientId: '', orderType: 'Biometría hemática', priority: 'NORMAL', status: 'REQUESTED', observations: '' });
  const [message, setMessage] = useState('');
  useEffect(() => void api<{ data: Patient[] }>('/api/patients', { headers: headers(false) }).then((r) => setPatients(r.data ?? [])).catch(() => undefined), []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.patientId) {
      setMessage('Seleccione paciente');
      return;
    }
    setMessage('Guardando orden...');
    await api('/api/laboratory/orders', { method: 'POST', headers: headers(), body: JSON.stringify(form) });
    setMessage('Orden creada correctamente');
    window.setTimeout(() => router.push('/laboratorio/ordenes'), 500);
  }
  return <Shell title="Nueva orden"><form onSubmit={save} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">{message && <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100 md:col-span-2">{message}</p>}<label className="grid gap-1 text-sm">Paciente<select value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))} className="h-10 rounded-md border px-3 dark:bg-slate-950"><option value="">Seleccione paciente</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label><Input label="Tipo de examen" value={form.orderType} onChange={(v) => setForm((f) => ({ ...f, orderType: v }))} /><label className="grid gap-1 text-sm">Prioridad<select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="h-10 rounded-md border px-3 dark:bg-slate-950"><option value="NORMAL">Normal</option><option value="URGENT">Urgente</option></select></label><Input label="Observaciones" value={form.observations} onChange={(v) => setForm((f) => ({ ...f, observations: v }))} /><button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clinic-teal px-4 text-white md:col-span-2"><Save className="h-4 w-4" />Guardar orden</button></form></Shell>;
}

export function ResultPage({ orderId }: { orderId: string }) {
  useAuthRedirect();
  const [orders, setOrders] = useState<Order[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>();
  const [message, setMessage] = useState('');
  useEffect(() => { void api<Order[]>('/api/laboratory/orders', { headers: headers(false) }).then(setOrders); void api<Template[]>('/api/laboratory/templates', { headers: headers(false) }).then((t) => { setTemplates(t); setTemplateId(t[0]?.id ?? ''); }); }, []);
  const order = orders.find((o) => o.id === orderId);
  const template = templates.find((t) => t.id === templateId);
  async function save() {
    if (!order || !template) return;
    setMessage('Guardando resultado...');
    try {
      const saved = await api('/api/laboratory/results', { method: 'POST', headers: headers(), body: JSON.stringify({ orderId, patientId: order.patient.id, templateId, values: template.analytes.map((a) => ({ analyteId: a.id, value: values[a.id] ?? '' })) }) });
      setResult(saved);
      setMessage('Resultado guardado correctamente');
    } catch {
      setMessage('No se pudo guardar el resultado');
    }
  }
  return <Shell title="Ingresar resultado"><div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">{message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">{message}</p>}<p className="mb-3 text-sm text-slate-500">{order?.patient.fullName} · {order?.orderType}</p><label className="mb-4 grid max-w-md gap-1 text-sm font-medium">Plantilla<select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-10 rounded-md border px-3 dark:bg-slate-950">{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="grid gap-3 md:grid-cols-2">{template?.analytes.map((a) => <div key={a.id} className="grid gap-1"><Input label={`${a.name} ${a.unit ? `(${a.unit})` : ''}`} value={values[a.id] ?? ''} onChange={(v) => setValues((x) => ({ ...x, [a.id]: v }))} /><span className="text-xs text-slate-500">Referencia: {referenceLabel(a)} · {flagLabel(values[a.id], a)}</span></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={save} className="rounded-md bg-clinic-teal px-4 py-2 text-white">Guardar resultado</button>{result && <a href={`${apiBase}/api/laboratory/results/${result.id}/pdf`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-clinic-teal dark:border-slate-700"><Download className="h-4 w-4" />Exportar PDF</a>}{result && <button onClick={() => printLabResult(order, template, values)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 dark:border-slate-700"><Printer className="h-4 w-4" />Imprimir</button>}</div></div></Shell>;
}

export function TemplatesPage() {
  useAuthRedirect();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [message, setMessage] = useState('');
  const load = () => api<Template[]>('/api/laboratory/templates', { headers: headers(false) }).then(setTemplates).catch(() => undefined);
  useEffect(() => void load(), []);
  async function editAnalyte(analyte: Analyte) {
    const min = window.prompt(`Valor mínimo para ${analyte.name}`, analyte.referenceMin ?? '');
    if (min === null) return;
    const max = window.prompt(`Valor máximo para ${analyte.name}`, analyte.referenceMax ?? '');
    if (max === null) return;
    const unit = window.prompt(`Unidad para ${analyte.name}`, analyte.unit ?? '');
    if (unit === null) return;
    setMessage('Guardando valor de referencia...');
    try {
      await api(`/api/laboratory/analytes/${analyte.id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ referenceMin: min === '' ? null : Number(min), referenceMax: max === '' ? null : Number(max), unit }) });
      await load();
      setMessage('Valor de referencia guardado correctamente');
    } catch {
      setMessage('No se pudo guardar el valor de referencia');
    }
  }
  return <Shell title="Plantillas">{message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">{message}</p>}<div className="grid gap-3 xl:grid-cols-2">{templates.map((t) => <article key={t.id} className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><strong>{t.name}</strong><p className="text-sm text-slate-500">{t.category} · {t.analytes.length} analitos</p></div><Link href="/laboratorio/ordenes/nueva" className="rounded-md bg-clinic-teal px-3 py-2 text-sm font-medium text-white">Usar plantilla</Link></div><div className="mt-3 grid gap-2 text-sm">{t.analytes.slice(0, 8).map((a) => <div key={a.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950"><span>{a.name}</span><span className="text-slate-500">{a.unit ?? '-'} · {referenceLabel(a)}</span><button type="button" onClick={() => void editAnalyte(a)} className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">Editar</button></div>)}</div></article>)}</div></Shell>;
}

export function ReagentsPage({ expiring = false }: { expiring?: boolean }) {
  useAuthRedirect();
  const [items, setItems] = useState<Reagent[]>([]);
  const [form, setForm] = useState<any>({ name: '', brand: '', presentation: '', batchNumber: '', expiresAt: '', quantity: 0, unit: '', equipment: '', associatedTest: '', minimumStock: 0, observations: '' });
  const [message, setMessage] = useState('');
  const path = expiring ? '/api/laboratory/reagents/expirations?days=90' : '/api/laboratory/reagents';
  useEffect(() => void api<Reagent[]>(path, { headers: headers(false) }).then(setItems).catch(() => undefined), [path]);
  async function save(e: FormEvent) { e.preventDefault(); setMessage('Guardando reactivo...'); await api('/api/laboratory/reagents', { method: 'POST', headers: headers(), body: JSON.stringify(form) }); setMessage('Reactivo guardado correctamente'); window.setTimeout(() => window.location.reload(), 500); }
  async function move(reagent: Reagent, type: string) {
    const quantity = Number(window.prompt('Ingrese cantidad', '1') ?? 0);
    if (!quantity) return;
    setMessage('Registrando movimiento...');
    await api(`/api/laboratory/reagents/${reagent.id}/movements`, { method: 'POST', headers: headers(), body: JSON.stringify({ type, quantity, observation: movementLabel(type) }) });
    setMessage('Movimiento guardado correctamente');
    window.setTimeout(() => window.location.reload(), 500);
  }
  return <Shell title={expiring ? 'Reactivos por vencer' : 'Reactivos'}>{message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">{message}</p>}{!expiring && <form onSubmit={save} className="mb-5 grid gap-3 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">{Object.keys(form).map((k) => <Input key={k} type={k === 'expiresAt' ? 'date' : ['quantity','minimumStock'].includes(k) ? 'number' : 'text'} label={reagentLabels[k] ?? k} value={form[k]} onChange={(v) => setForm((f: any) => ({ ...f, [k]: v }))} />)}<button className="rounded-md bg-clinic-teal px-4 text-white">Guardar reactivo</button></form>}<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((r) => <article key={r.id} className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><strong>{r.name}</strong><p className="text-sm text-slate-500">{r.brand} · lote {r.batchNumber} · vence {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('es-NI') : '-'}</p><span className="text-sm">Stock: {r.quantity} {r.unit}</span>{!expiring && <div className="mt-3 flex flex-wrap gap-2">{['ENTRY','USE','ADJUSTMENT','DISCARD','EXPIRATION'].map((type) => <button key={type} onClick={() => void move(r, type)} className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">{movementLabel(type)}</button>)}</div>}</article>)}</div></Shell>;
}

function statusLabel(status: string) {
  return ({ REQUESTED: 'Solicitada', SAMPLE_TAKEN: 'Muestra tomada', PROCESSING: 'Procesando', COMPLETED: 'Completada', DELIVERED: 'Entregada', CANCELLED: 'Anulada' } as Record<string, string>)[status] ?? status;
}

function priorityLabel(priority: string) {
  return ({ NORMAL: 'Normal', ROUTINE: 'Rutina', PRIORITY: 'Prioritaria', URGENT: 'Urgente' } as Record<string, string>)[priority] ?? priority;
}

function referenceLabel(analyte: Analyte) {
  if (analyte.referenceText) return analyte.referenceText;
  return analyte.referenceMin && analyte.referenceMax ? `${analyte.referenceMin} - ${analyte.referenceMax}` : 'Sin referencia';
}

function flagLabel(value: string, analyte: Analyte) {
  const numeric = Number(value);
  if (!value || !Number.isFinite(numeric)) return 'Pendiente';
  if (analyte.referenceMin && numeric < Number(analyte.referenceMin)) return 'Bajo';
  if (analyte.referenceMax && numeric > Number(analyte.referenceMax)) return 'Alto';
  return 'Normal';
}

function movementLabel(type: string) {
  return ({ ENTRY: 'Entrada', USE: 'Uso', ADJUSTMENT: 'Ajuste', DISCARD: 'Descarte', EXPIRATION: 'Vencimiento' } as Record<string, string>)[type] ?? type;
}

const reagentLabels: Record<string, string> = {
  name: 'Nombre',
  brand: 'Marca',
  presentation: 'Presentación',
  batchNumber: 'Lote',
  expiresAt: 'Fecha de vencimiento',
  quantity: 'Cantidad',
  unit: 'Unidad',
  equipment: 'Equipo asociado',
  associatedTest: 'Prueba asociada',
  minimumStock: 'Stock mínimo',
  observations: 'Observaciones',
};

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" /></label>;
}
