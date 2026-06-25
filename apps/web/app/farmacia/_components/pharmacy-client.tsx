'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Barcode, CalendarClock, Home, PackagePlus, Pill, ReceiptText, Save, Search, ShoppingCart, SlidersHorizontal, Trash2, Truck } from 'lucide-react';
import { MasterActionMenu } from '../../_components/master-action-menu';
import { AppSidebar, ProtectedModule, UserMenu } from '../../_components/session';

import { authenticatedFetch, jsonHeaders } from '../../_components/api-client';

type Product = {
  id: string;
  productCode: string;
  barcode?: string;
  name: string;
  activeIngredient?: string;
  presentation?: string;
  concentration?: string;
  pharmaceuticalForm?: string;
  category: string;
  manufacturer?: string;
  supplier?: string;
  unit?: string;
  quantity: number;
  minimumStock: number;
  salePrice: string | number;
  costPrice: string | number;
  wholesaleMinQuantity?: number | null;
  wholesalePrice?: string | number | null;
  status: string;
  batches?: Batch[];
};

type Batch = {
  id: string;
  batchNumber: string;
  expiresAt: string;
  initialQuantity: number;
  availableQuantity: number;
  costPrice: string | number;
  salePrice: string | number;
  supplier?: string;
  product?: Product;
};

type Movement = { id: string; type: string; quantity: number; stockBefore?: number; stockAfter?: number; createdAt: string; product?: Product; batch?: Batch };

function money(value: string | number | undefined) {
  return `C$ ${Number(value ?? 0).toFixed(2)}`;
}

function printReceipt(receipt: any, lines: Array<{ product: Product; quantity: number; discountPercent: number }>, total: number) {
  try {
    const popup = window.open('', '_blank', 'width=420,height=720');
    if (!popup) throw new Error('El navegador bloqueó la ventana de impresión.');
    const rows = lines.map((line) => {
      const unit = Number(line.product.salePrice ?? 0);
      const subtotal = unit * line.quantity;
      const discount = subtotal * (line.discountPercent / 100);
      return `<tr><td>${line.product.name}</td><td>${line.quantity}</td><td>${money(unit)}</td><td>${money(discount)}</td><td>${money(subtotal - discount)}</td></tr>`;
    }).join('');
    popup.document.write(`<!doctype html><html><head><title>Recibo ${receipt?.saleNumber ?? ''}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#0f172a}.head{text-align:center;border-bottom:1px solid #cbd5e1;padding-bottom:12px}img{height:64px;object-fit:contain}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}td,th{border-bottom:1px solid #e2e8f0;padding:7px;text-align:left}.total{text-align:right;font-size:18px;font-weight:700;margin-top:16px}.meta{font-size:12px;color:#475569}</style></head><body><div class="head"><img src="/clinica-keyser-logo.jpg" alt="Clínica Keyser"/><h2>Clínica Keyser</h2><p class="meta">Recibo ${receipt?.saleNumber ?? ''}</p><p class="meta">${new Date().toLocaleString('es-NI')}</p></div><table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: ${money(total)}</p><script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 500)}</script></body></html>`);
    popup.document.close();
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo imprimir el recibo.');
  }
}


function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const pharmacyActions = [
    { label: 'Nuevo producto', icon: PackagePlus, onClick: () => router.push('/farmacia/productos/nuevo') },
    { label: 'Nuevo lote', icon: CalendarClock, onClick: () => router.push('/farmacia/productos') },
    { label: 'Nueva venta', icon: ShoppingCart, onClick: () => router.push('/farmacia/venta') },
    { label: 'Nuevo proveedor', icon: Truck, onClick: () => window.alert('Ingrese el proveedor al crear o editar un producto.') },
    { label: 'Ajuste de inventario', icon: SlidersHorizontal, onClick: () => router.push('/farmacia/kardex') },
  ];
  return (
    <ProtectedModule module="pharmacy">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
      <AppSidebar active="Farmacia" />
      <section className="min-w-0">
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Farmacia e inventario</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link href="/panel" className="inline-flex items-center gap-1 text-clinic-teal"><Home className="h-3.5 w-3.5" />Inicio</Link>
              <span>/</span>
              <Link href="/farmacia" className="hover:text-clinic-teal">Farmacia</Link>
              <span>/</span>
              <span>{title}</span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <UserMenu />
            {[
              ['/farmacia', 'Panel'],
              ['/farmacia/productos', 'Productos'],
              ['/farmacia/inventario', 'Inventario'],
              ['/farmacia/vencimientos', 'Vencimientos'],
              ['/farmacia/kardex', 'Kardex'],
              ['/farmacia/venta', 'Venta'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md border border-slate-200 px-3 py-2 hover:border-clinic-teal hover:text-clinic-teal dark:border-slate-700">
                {label}
              </Link>
            ))}
            <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 hover:border-clinic-teal hover:text-clinic-teal dark:border-slate-700">
              <ArrowLeft className="h-4 w-4" />
              Regresar
            </button>
          </nav>
        </div>
      </div>
      <div className="p-6">{children}</div>
      </section>
      </div>
      <MasterActionMenu actions={pharmacyActions} />
    </main>
    </ProtectedModule>
  );
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(path, options);
  if (response.status === 401) {
    window.location.href = '/login?next=/farmacia';
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export function PharmacyDashboard() {

  const [data, setData] = useState<any>();
  useEffect(() => void api('/api/pharmacy/dashboard', {}).then(setData).catch(() => undefined), []);
  return (
    <Shell title="Panel">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Pill} label="Productos" value={data?.products ?? '...'} />
        <Metric icon={AlertTriangle} label="Stock bajo" value={data?.lowStock ?? '...'} />
        <Metric icon={CalendarClock} label="Por vencer" value={data?.expiring?.length ?? '...'} />
        <Link href="/farmacia/venta" className="rounded-lg border border-slate-200 bg-clinic-teal p-4 text-white dark:border-slate-800">
          <ShoppingCart className="mb-2 h-5 w-5" />
          <strong>Venta rápida</strong>
          <p className="text-sm opacity-90">Buscar, vender y descontar inventario</p>
        </Link>
      </div>
      <AlertList batches={data?.expiring ?? []} />
    </Shell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Icon className="mb-3 h-5 w-5 text-clinic-teal" />
      <p className="text-sm text-slate-500">{label}</p>
      <strong className="text-2xl">{value}</strong>
    </article>
  );
}

export function ProductsPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => void api<Product[]>(`/api/pharmacy/products?search=${encodeURIComponent(search)}`, {}).then(setProducts).catch(() => undefined), [search]);
  return (
    <Shell title="Productos">
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex h-11 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre, barra, código o principio activo" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>
      <ProductTable products={products} />
    </Shell>
  );
}

function ProductTable({ products }: { products: Product[] }) {
  async function disableProduct(product: Product) {
    const confirmed = window.confirm('¿Está seguro que desea eliminar este registro? Esta acción lo ocultará del sistema, pero quedará registrado en auditoría.');
    if (!confirmed) return;
    const reason = window.prompt(`Motivo para desactivar ${product.name}`);
    if (!reason?.trim()) return alert('Debe ingresar un motivo.');
    const response = await authenticatedFetch(`/api/pharmacy/products/${product.id}/disable`, { method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify({ reason }) });
    if (!response.ok) return alert('No se pudo desactivar el producto.');
    window.location.reload();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950"><tr><th className="p-3">Producto</th><th>Stock</th><th>Precio</th><th>Categoría</th><th>Alertas</th><th></th></tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="p-3"><strong>{product.name}</strong><p className="text-xs text-slate-500">{product.productCode} · {product.barcode ?? 'Sin barra'}</p></td>
              <td>{product.quantity} {product.unit ?? 'u'}</td>
              <td>{money(product.salePrice)}</td>
              <td>{product.category}</td>
              <td><AlertChips product={product} /></td>
              <td className="space-x-3">
                <Link className="text-clinic-teal" href={`/farmacia/productos/${product.id}`}>Editar</Link>
                <button onClick={() => void disableProduct(product)} className="text-red-700">Desactivar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertChips({ product }: { product: Product }) {
  const chips = [];
  if (product.quantity <= product.minimumStock) chips.push('Stock bajo');
  if (product.batches?.some((batch) => new Date(batch.expiresAt).getTime() < Date.now())) chips.push('Vencido');
  if (product.batches?.some((batch) => batch.availableQuantity <= 0)) chips.push('Lote agotado');
  return <div className="flex flex-wrap gap-1">{(chips.length ? chips : ['Correcto']).map((chip) => <span key={chip} className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-100">{chip}</span>)}</div>;
}

export function ProductFormPage({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({ productCode: '', barcode: '', name: '', activeIngredient: '', presentation: '', concentration: '', pharmaceuticalForm: '', category: 'Medicamentos', manufacturer: '', supplier: '', unit: 'unidad', quantity: 0, minimumStock: 5, costPrice: 0, salePrice: 0, status: 'ACTIVE' });
  const [batch, setBatch] = useState<any>({ batchNumber: '', expiresAt: '', initialQuantity: 0, availableQuantity: 0, costPrice: 0, salePrice: 0, supplier: '', observations: '' });
  useEffect(() => { if (id) void api<Product>(`/api/pharmacy/products/${id}`, {}).then((data) => setForm(data)); }, [id]);
  const margin = useMemo(() => Number(form.salePrice || 0) - Number(form.costPrice || 0), [form.costPrice, form.salePrice]);
  async function save(event: FormEvent) {
    event.preventDefault();
    const saved = await api<Product>(id ? `/api/pharmacy/products/${id}` : '/api/pharmacy/products', { method: id ? 'PATCH' : 'POST', headers: jsonHeaders(), body: JSON.stringify(form) });
    router.replace(`/farmacia/productos/${saved.id}`);
  }
  async function addBatch() {
    await api(`/api/pharmacy/products/${id}/batches`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ ...batch, initialQuantity: Number(batch.initialQuantity), availableQuantity: Number(batch.availableQuantity), costPrice: Number(batch.costPrice), salePrice: Number(batch.salePrice) }) });
    window.location.reload();
  }
  return (
    <Shell title={id ? 'Editar producto' : 'Nuevo producto'}>
      <form onSubmit={save} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3">
        {['productCode','barcode','name','activeIngredient','presentation','concentration','pharmaceuticalForm','category','manufacturer','supplier','unit'].map((key) => <Input key={key} label={labels[key] ?? key} value={form[key] ?? ''} onChange={(value) => setForm((f: any) => ({ ...f, [key]: value }))} />)}
        {['quantity','minimumStock','costPrice','salePrice','wholesaleMinQuantity','wholesalePrice','discountPercent','discountAmount'].map((key) => <Input key={key} type="number" label={labels[key] ?? key} value={form[key] ?? ''} onChange={(value) => setForm((f: any) => ({ ...f, [key]: value === '' ? undefined : Number(value) }))} />)}
        <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">Margen automático: <strong>{money(margin)}</strong></div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white md:col-span-3"><Save className="h-4 w-4" />Guardar</button>
      </form>
      {id && <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-3 font-semibold">Agregar lote</h2><div className="grid gap-3 md:grid-cols-4">{['batchNumber','expiresAt','initialQuantity','availableQuantity','costPrice','salePrice','supplier','observations'].map((key) => <Input key={key} type={key === 'expiresAt' ? 'date' : key.includes('Quantity') || key.includes('Price') ? 'number' : 'text'} label={labels[key] ?? key} value={batch[key] ?? ''} onChange={(value) => setBatch((f: any) => ({ ...f, [key]: value }))} />)}<button onClick={addBatch} className="rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white">Agregar lote</button></div></section>}
    </Shell>
  );
}

const labels: Record<string, string> = { productCode: 'Código interno', barcode: 'Código de barra', name: 'Nombre comercial', activeIngredient: 'Principio activo', presentation: 'Presentación', concentration: 'Concentración', pharmaceuticalForm: 'Forma farmacéutica', manufacturer: 'Laboratorio/fabricante', supplier: 'Proveedor', unit: 'Unidad', quantity: 'Stock actual', minimumStock: 'Stock mínimo', costPrice: 'Costo', salePrice: 'Precio venta', wholesaleMinQuantity: 'Cant. mayorista', wholesalePrice: 'Precio mayorista', discountPercent: 'Descuento %', discountAmount: 'Descuento fijo', batchNumber: 'Número lote', expiresAt: 'Vencimiento', initialQuantity: 'Cantidad inicial', availableQuantity: 'Disponible', observations: 'Observaciones' };

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" /></label>;
}

export function InventoryPage({ mode }: { mode: 'batches' | 'expirations' | 'kardex' }) {

  const [data, setData] = useState<any[]>([]);
  const path = mode === 'batches' ? '/api/inventory/batches' : mode === 'expirations' ? '/api/inventory/expirations?days=90' : '/api/inventory/movements';
  useEffect(() => void api<any[]>(path, {}).then(setData).catch(() => undefined), [path]);
  return (
    <Shell title={mode === 'kardex' ? 'Kardex' : mode === 'expirations' ? 'Vencimientos' : 'Inventario por lotes'}>
      {mode === 'kardex' ? <MovementTable movements={data as Movement[]} /> : <BatchTable batches={data as Batch[]} />}
    </Shell>
  );
}

function BatchTable({ batches }: { batches: Batch[] }) {
  return <div className="grid gap-3">{batches.map((batch) => <article key={batch.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex justify-between gap-3"><div><strong>{batch.product?.name}</strong><p className="text-sm text-slate-500">Lote {batch.batchNumber} · vence {new Date(batch.expiresAt).toLocaleDateString('es-NI')}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800">{batch.availableQuantity} disponibles</span></div></article>)}</div>;
}

function MovementTable({ movements }: { movements: Movement[] }) {
  return <div className="grid gap-2">{movements.map((movement) => <div key={movement.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"><strong>{movement.type}</strong> · {movement.product?.name} · {movement.quantity} <span className="text-slate-500">({movement.stockBefore ?? '-'} → {movement.stockAfter ?? '-'})</span></div>)}</div>;
}

export function PosPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number; discountPercent: number }>>([]);
  const [receipt, setReceipt] = useState<any>();
  const [message, setMessage] = useState('');
  useEffect(() => void api<Product[]>(`/api/pharmacy/products?search=${encodeURIComponent(search)}`, {}).then(setProducts).catch(() => undefined), [search]);
  const linePrice = (line: { product: Product; quantity: number; discountPercent: number }) => {
    const wholesaleApplies = line.product.wholesaleMinQuantity && line.quantity >= line.product.wholesaleMinQuantity && line.product.wholesalePrice;
    const unit = Number(wholesaleApplies ? line.product.wholesalePrice : line.product.salePrice);
    const subtotal = unit * line.quantity;
    return { unit, subtotal, discount: subtotal * (line.discountPercent / 100), total: subtotal - subtotal * (line.discountPercent / 100), wholesaleApplies };
  };
  const total = cart.reduce((sum, line) => sum + linePrice(line).total, 0);
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setMessage('Producto sin stock disponible');
      return;
    }
    if (product.batches?.some((batch) => new Date(batch.expiresAt).getTime() < Date.now())) setMessage('Revise vencimiento: este producto tiene un lote vencido');
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found ? current.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)) : [...current, { product, quantity: 1, discountPercent: 0 }];
    });
  };
  async function confirmSale() {
    setMessage('Guardando venta...');
    try {
      const soldLines = cart;
      const soldTotal = total;
      const sale = await api<any>('/api/pharmacy/sales', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, discount: linePrice(line).discount })) }) });
      setReceipt({ ...sale, lines: soldLines, total: soldTotal });
      setCart([]);
      setMessage('Venta guardada correctamente');
    } catch {
      setMessage('No se pudo guardar la venta');
    }
  }
  return (
    <Shell title="Punto de venta">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0">
          <label className="mb-4 flex h-14 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Barcode className="h-5 w-5 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto o escanear código de barra" className="w-full bg-transparent text-base outline-none" />
          </label>
          {message && <p className="mb-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">{message}</p>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 12).map((product) => (
              <article key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <strong>{product.name}</strong>
                <p className="mt-1 text-xs text-slate-500">{product.productCode} · {product.barcode ?? 'Sin barra'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Lote: {product.batches?.[0]?.batchNumber ?? 'Sin lote'} · vence {product.batches?.[0]?.expiresAt ? new Date(product.batches[0].expiresAt).toLocaleDateString('es-NI') : '-'}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>Stock: {product.quantity}</span>
                  <span className="font-semibold">{money(product.salePrice)}</span>
                </div>
                <AlertChips product={product} />
                <button type="button" onClick={() => addToCart(product)} className="mt-3 w-full rounded-md bg-clinic-teal px-3 py-2 text-sm font-semibold text-white">Agregar al carrito</button>
              </article>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShoppingCart className="h-4 w-4" />Carrito</h2>
          <div className="space-y-3">
            {cart.length === 0 && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950">Seleccione un producto para iniciar la venta.</p>}
            {cart.map((line) => {
              const prices = linePrice(line);
              return (
                <div key={line.product.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{line.product.name}</span>
                    <button type="button" onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs">Cantidad<input type="number" min="1" value={line.quantity} onChange={(event) => setCart((current) => current.map((item) => item.product.id === line.product.id ? { ...item, quantity: Number(event.target.value) || 1 } : item))} className="h-9 rounded-md border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-950" /></label>
                    <label className="grid gap-1 text-xs">Descuento %<input type="number" min="0" max="100" value={line.discountPercent} onChange={(event) => setCart((current) => current.map((item) => item.product.id === line.product.id ? { ...item, discountPercent: Number(event.target.value) || 0 } : item))} className="h-9 rounded-md border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-950" /></label>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{prices.wholesaleApplies ? 'Precio mayorista aplicado automáticamente.' : `Unidad ${money(prices.unit)}`}</p>
                  <p className="mt-1 font-semibold">{money(prices.total)}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between text-lg font-semibold"><span>Total</span><span>{money(total)}</span></div>
            <button disabled={!cart.length} onClick={confirmSale} className="mt-3 w-full rounded-md bg-clinic-teal px-4 py-2 text-white disabled:opacity-60">Cobrar</button>
            <button disabled={!cart.length} onClick={() => setCart([])} className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancelar venta</button>
            {receipt && <button onClick={() => printReceipt(receipt, receipt.lines ?? [], receipt.total ?? 0)} className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 dark:border-slate-700"><ReceiptText className="mr-2 inline h-4 w-4" />Reimprimir recibo {receipt.saleNumber}</button>}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function AlertList({ batches }: { batches: Batch[] }) {
  return <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-3 font-semibold">Alertas de vencimiento</h2><BatchTable batches={batches} /></section>;
}
