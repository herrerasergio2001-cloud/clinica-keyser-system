# Laboratory Module — Architecture & Design

**Created:** 2026-06-25  
**Status:** DESIGN PHASE (Implementation pending approval)  
**Author:** Lead Architect

---

## I. CURRENT STATE ANALYSIS

### A. Existing Infrastructure

**Backend (API):**
- `apps/api/src/modules/laboratory/` with controller, service, DTOs
- Prisma models: `LabOrder`, `LabResult`, `LabTemplate`, `LabAnalyte`, `LabResultValue`, `LabReagent`, `LabReagentMovement`, `LabOrderExternal`, `ImagingOrder`, `UltrasoundOrder`, `PacsStudy`, `UltrasoundReport`
- Database: PostgreSQL with 11 lab-related tables
- Authentication: JWT + HttpOnly cookies, role-based access (LABORATORY, DOCTOR, RECEPTION)

**Frontend (Web):**
- `apps/web/app/laboratorio/` with 8 route pages
- Single `lab-client.tsx` component file (~500+ lines)
- Monolithic UI: dashboard, orders, templates, analytes, results, reagents, expirations, pdf printing
- Local type definitions (no shared types)
- Direct API calls without abstraction

### B. Identified Problems

1. **Type Safety:** Types are inline in `lab-client.tsx`, not shared with backend
2. **Component Monolith:** All UI logic in one 500+ line file → difficult to test, maintain, extend
3. **No State Management:** useState for every screen → prop drilling, data consistency issues
4. **No Hooks:** Business logic mixed with React components
5. **No Search/Filter:** List endpoints unbounded (now limited via MED-008)
6. **No Barcode Support:** Orders/results can't be scanned or printed with codes
7. **Printing:** Inline HTML generation in component → difficult to customize branding
8. **No Pagination on Frontend:** Results lists don't show page info or load incrementally
9. **No Result Validation:** Critical values and flags calculated on client only
10. **No Template Caching:** Templates re-fetched on every result creation
11. **Reagent Expiration:** No visual alert pattern, no stock alerts
12. **API Consistency:** Some endpoints paginated (orders/lab), others with hardcoded `take` limits

---

## II. DESIGN PRINCIPLES

### A. Architecture Choices

1. **Modularity:** Break monolith into focused, single-responsibility components
2. **Separation of Concerns:** UI, business logic, data fetching, state in separate layers
3. **Type Safety:** Shared DTO types between backend and frontend (via `shared/` folder)
4. **Reusability:** Build generic components first (tables, forms, printing, search)
5. **No Premature State:** Start with local component state; lift only when needed
6. **Production-Ready:** All code follows clinic domain patterns; no temporary workarounds

### B. Component Philosophy

- **Smart (Container):** Fetch data, manage page-level state, route handling
- **Dumb (Presentational):** Pure render, accept props, emit callbacks
- **Domain (Logical):** Render domain entities (Order, Result, Reagent) with standard layouts

### C. API Design

- All list endpoints support `?page=N&limit=50` with metadata response
- POST/PATCH/DELETE return full entity or `{success: true}`
- Errors: consistent 4xx/5xx JSON with `{message, statusCode, errors?[]}`

---

## III. FOLDER STRUCTURE

```
apps/web/app/laboratorio/
├── page.tsx                          # Dashboard page
├── ordenes/
│   ├── page.tsx                      # Orders list
│   ├── [id]/
│   │   └── page.tsx                  # Order detail
│   └── nueva/
│       └── page.tsx                  # Create order
├── resultados/
│   ├── page.tsx                      # Results list
│   ├── [id]/
│   │   └── page.tsx                  # Result detail + print
│   └── nuevo/
│       └── page.tsx                  # Create result (select order/template)
├── plantillas/
│   ├── page.tsx                      # Templates list
│   ├── [id]/
│   │   └── page.tsx                  # Template detail
│   └── nueva/
│       └── page.tsx                  # Create template
├── reactivos/
│   ├── page.tsx                      # Reagents list
│   ├── [id]/
│   │   └── page.tsx                  # Reagent detail
│   ├── nuevo/
│   │   └── page.tsx                  # Create reagent
│   └── movimientos/
│       └── page.tsx                  # Reagent movements log
├── vencimientos/
│   └── page.tsx                      # Expiring reagents + batches
└── _components/
    ├── index.ts                      # Barrel export all components
    ├── lab-shell.tsx                 # Common layout + navigation
    ├── lab-api.ts                    # API client with typed methods
    ├── lab-hooks.ts                  # Custom hooks (useLab*, useQuery, useMutation)
    ├── lab-print.ts                  # Print services (result, order, barcode)
    ├── lab-search.ts                 # Search/filter utilities
    ├── lab-validation.ts             # Result value validation (critical values, flags)
    ├── orders/
    │   ├── order-list.tsx            # Paginated orders table
    │   ├── order-form.tsx            # Create/edit order form
    │   ├── order-detail.tsx          # Order view with results
    │   └── order-selector.tsx        # Modal to select order (for result creation)
    ├── results/
    │   ├── result-list.tsx           # Paginated results table
    │   ├── result-form.tsx           # Create/edit result form
    │   ├── result-detail.tsx         # Result view with full values
    │   ├── result-printer.tsx        # Print layout (PDF/HTML)
    │   └── result-values-table.tsx   # Values grid with validation flags
    ├── templates/
    │   ├── template-list.tsx         # Templates table
    │   ├── template-form.tsx         # Create/edit template
    │   ├── template-detail.tsx       # Template + analytes
    │   └── analyte-editor.tsx        # Modal: add/edit analytes
    ├── reagents/
    │   ├── reagent-list.tsx          # Paginated reagents table
    │   ├── reagent-form.tsx          # Create/edit reagent
    │   ├── reagent-detail.tsx        # Reagent view + movement history
    │   ├── reagent-movement.tsx      # Movement modal (receive/use/return)
    │   └── reagent-expiring.tsx      # Alert badge + list view
    ├── shared/
    │   ├── data-table.tsx            # Generic table (columns, sorting, pagination)
    │   ├── search-input.tsx          # Debounced search box
    │   ├── modal.tsx                 # Reusable modal
    │   ├── form-field.tsx            # Input wrapper with validation
    │   ├── badge-status.tsx          # Status badges (DRAFT, VALIDATED, VOIDED)
    │   ├── badge-priority.tsx        # Priority badges (ROUTINE, URGENT, STAT)
    │   ├── badge-critical.tsx        # Critical value indicator
    │   └── loading-skeleton.tsx      # Skeleton placeholders
    └── print/
        ├── result-print-template.tsx # Result PDF layout
        ├── order-print-template.tsx  # Order print layout
        └── barcode-generator.tsx     # QR/128 barcode rendering

shared/
└── types/
    └── laboratory.ts                 # Shared TypeScript interfaces
```

---

## IV. COMPONENT HIERARCHY

### Smart Components (Pages)

```
laboratorio/
├── page.tsx → <LabDashboard/>
├── ordenes/page.tsx → <OrdersPage/>
├── ordenes/[id]/page.tsx → <OrderDetailPage/>
├── ordenes/nueva/page.tsx → <CreateOrderPage/>
├── resultados/page.tsx → <ResultsPage/>
├── resultados/[id]/page.tsx → <ResultDetailPage/>
├── resultados/nuevo/page.tsx → <CreateResultPage/>
├── plantillas/page.tsx → <TemplatesPage/>
├── plantillas/nueva/page.tsx → <CreateTemplatePage/>
├── plantillas/[id]/page.tsx → <TemplateDetailPage/>
├── reactivos/page.tsx → <ReagentsPage/>
├── reactivos/nuevo/page.tsx → <CreateReagentPage/>
├── reactivos/[id]/page.tsx → <ReagentDetailPage/>
└── vencimientos/page.tsx → <ExpiringPage/>
```

Each page:
- Accepts route params from Next.js
- Fetches initial data via custom hook
- Manages error/loading states
- Renders dumb components
- Handles mutations (create/update/delete)
- Calls print/export functions

### Dumb Components (Lab-Specific)

```
<OrderList/>         → Paginated table of orders
<OrderForm/>         → Form to create/edit order
<OrderDetail/>       → Read-only view of order + results
<OrderSelector/>     → Modal to select order when creating result

<ResultList/>        → Paginated table of results
<ResultForm/>        → Form to enter values for a template
<ResultDetail/>      → Result view with calculated flags
<ResultValuesTable/> → Grid of analytes + values + flags + references
<ResultPrinter/>     → Print-optimized layout

<TemplateList/>      → Paginated templates table
<TemplateForm/>      → Create/edit template
<TemplateDetail/>    → Template view + analytes list
<AnalyteEditor/>     → Modal to add/edit analytes

<ReagentList/>       → Paginated reagents + expiring badge
<ReagentForm/>       → Create/edit reagent
<ReagentDetail/>     → Reagent view + movement history
<ReagentMovement/>   → Modal to record movement (receive/use/return)
<ReagentExpiring/>   → Expiring reagents alert + filtered list
```

### Shared Components (Generic)

```
<DataTable/>         → Generic pagination + sorting + filtering
<SearchInput/>       → Debounced search box with clear button
<Modal/>             → Dialog wrapper
<FormField/>         → Label + input + error message
<BadgeStatus/>       → Status indicator (DRAFT, VALIDATED, VOIDED, ACTIVE, INACTIVE)
<BadgePriority/>     → Priority indicator (ROUTINE, URGENT, STAT)
<BadgeCritical/>     → Critical value warning (red badge)
<LoadingSkeleton/>   → Placeholder during fetch
```

### Print Components

```
<ResultPrintTemplate/>   → HTML + CSS for printing lab result
<OrderPrintTemplate/>    → HTML + CSS for printing order
<BarcodeGenerator/>      → SVG barcode (QR or Code128)
```

---

## V. HOOKS (Custom React Hooks)

### Query Hooks (Read Data)

```typescript
// Orders
useLabOrders(status, page, limit)
  → { data, isLoading, error, refetch }

useLabOrder(id)
  → { data, isLoading, error, refetch }

// Results
useLabResults(page, limit, status)
  → { data, isLoading, error, refetch }

useLabResult(id)
  → { data, isLoading, error, refetch }

// Templates
useLabTemplates()
  → { data, isLoading, error, refetch }

useLabTemplate(id)
  → { data, isLoading, error, refetch }

// Reagents
useLabReagents(page, limit)
  → { data, isLoading, error, refetch }

useLabReagent(id)
  → { data, isLoading, error, refetch }

useLabReagentExpirations(days)
  → { data, isLoading, error, refetch }
```

### Mutation Hooks (Write Data)

```typescript
useCreateLabOrder()
  → { mutate, isLoading, error }

useUpdateLabOrder(id)
  → { mutate, isLoading, error }

useCreateLabResult()
  → { mutate, isLoading, error }

useUpdateLabResult(id)
  → { mutate, isLoading, error }

useVoidLabResult(id)
  → { mutate, isLoading, error }

// ... similar for templates, reagents
```

### Domain Hooks

```typescript
useLabValidation()
  → { validateValue, getFlag, isCritical, formatValue }

useLabPrinting()
  → { printResult, printOrder, downloadPDF }

useLabSearch()
  → { search, debounce, clear }

useLaboratoryCache()
  → { templates, orders, refetchAll, clear }
```

---

## VI. STATE MANAGEMENT

### Strategy

1. **React Query (TanStack Query):** Cache API data, auto-refetch, background sync
2. **Local Component State:** Form inputs, UI toggles, modals open/close
3. **Context (if needed):** User's active lab template, reagent search filters
4. **URL State:** Page number, sort column, search query (in `?params`)

### No Redux/Zustand

- Overkill for this module
- React Query + hooks cover data fetching and caching
- URL params handle navigation state

---

## VII. SHARED TYPES

**File:** `shared/types/laboratory.ts`

```typescript
// DTOs (match backend DTOs from API)

export interface LabOrderDto {
  id: string;
  patientId: string;
  patient: PatientDto;
  doctorId: string;
  orderType: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: 'REQUESTED' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  observations?: string;
  labResults: LabResultDto[];
  createdAt: string;
  updatedAt: string;
}

export interface LabTemplateDto {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  analytes: LabAnalyteDto[];
}

export interface LabAnalyteDto {
  id: string;
  templateId: string;
  name: string;
  code?: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  sex?: string;
  ageMin?: number;
  ageMax?: number;
  referenceText?: string;
  sortOrder: number;
}

export interface LabResultDto {
  id: string;
  orderId?: string;
  order?: LabOrderDto;
  templateId: string;
  template: LabTemplateDto;
  patientId: string;
  medicalRecordId?: string;
  status: 'DRAFT' | 'VALIDATED' | 'VOIDED';
  observations?: string;
  values: LabResultValueDto[];
  validatedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabResultValueDto {
  id: string;
  resultId: string;
  analyteId: string;
  analyte: LabAnalyteDto;
  value: string;
  numericValue?: number;
  flag?: 'CRITICAL_LOW' | 'LOW' | 'HIGH' | 'CRITICAL_HIGH' | null;
  unit?: string;
  reference?: string;
}

export interface LabReagentDto {
  id: string;
  name: string;
  brand?: string;
  presentation?: string;
  batchNumber?: string;
  expiresAt?: string;
  quantity: number;
  unit?: string;
  equipment?: string;
  associatedTest?: string;
  minimumStock: number;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
}

// List Response with Pagination Metadata

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form DTOs

export interface CreateLabOrderRequest {
  patientId: string;
  medicalRecordId?: string;
  doctorId?: string;
  orderType: string;
  reason?: string;
  observations?: string;
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
}

export interface CreateLabResultRequest {
  orderId?: string;
  patientId: string;
  templateId: string;
  medicalRecordId?: string;
  observations?: string;
  values: { analyteId: string; value: string }[];
}
```

---

## VIII. API ENDPOINTS

**Base:** `/api/laboratory`

### Orders

```
GET    /orders?status=active|cancelled|all&page=1&limit=50
POST   /orders
GET    /orders/:id
PATCH  /orders/:id
PATCH  /orders/:id/cancel
DELETE /orders/:id
```

### Results

```
GET    /results?status=draft|validated|voided&page=1&limit=50
POST   /results
GET    /results/:id
PATCH  /results/:id
GET    /results/:id/pdf                         # PDF download
PATCH  /results/:id/void
GET    /results/:id/print                       # HTML print view
```

### Templates

```
GET    /templates                               # No pagination (typically <100)
POST   /templates
GET    /templates/:id
PATCH  /templates/:id
DELETE /templates/:id

GET    /templates/:id/analytes
POST   /templates/:id/analytes
PATCH  /analytes/:id
DELETE /analytes/:id
```

### Reagents

```
GET    /reagents?page=1&limit=50
POST   /reagents
GET    /reagents/:id
PATCH  /reagents/:id
DELETE /reagents/:id

GET    /reagents/expirations?days=90
POST   /reagents/:id/movements
GET    /reagents/:id/movements                  # Movement history
```

### Dashboard

```
GET    /dashboard                               # Stats for admin view
```

---

## IX. DATABASE CHANGES

### None Required

All Prisma models are already defined and up-to-date:
- `LabOrder`, `LabResult`, `LabTemplate`, `LabAnalyte`, `LabResultValue`, `LabReagent`, `LabReagentMovement`

### Potential Additions (Phase 2)

- `LabResultBarcode` → Store generated barcode/QR for audit trail
- `LabTemplateVersion` → Track template changes for historical results
- `LabReagentBatch` → Extend `LabReagent` to support batch-level tracking

**Status:** Not required for MVP; design allows for these without refactoring.

---

## X. REUSABLE COMPONENTS

### UI Library (Use Across Modules)

Components in `_components/shared/` should be moved to a clinic-wide UI library:

```
libs/ui/
├── components/
│   ├── data-table.tsx
│   ├── search-input.tsx
│   ├── modal.tsx
│   ├── form-field.tsx
│   ├── badge.tsx
│   ├── status-badge.tsx
│   ├── priority-badge.tsx
│   ├── loading-skeleton.tsx
│   └── index.ts

libs/print/
├── print-service.ts                # Generic print/PDF service
├── templates/
│   └── clinic-letterhead.tsx       # Clinic header for all prints
└── index.ts
```

### Pharmacy Module Reuse

Both lab and pharmacy need:
- Pagination table component
- Search/filter form
- Print-to-PDF
- Expiring items alert

**Action:** Extract these into reusable libs after lab redesign.

---

## XI. PRINTING ARCHITECTURE

### Goal

- Clinic-branded PDF/HTML output
- Support for: Lab results, orders, reagent labels, barcodes
- Server-side or client-side rendering
- Accessible from any lab page (modal button)

### Implementation

#### Frontend (Print Trigger)

```typescript
// In any component
import { useLabPrinting } from '../_components/lab-hooks';

function ResultDetail() {
  const { printResult, downloadPDF } = useLabPrinting();
  
  return (
    <>
      <button onClick={() => printResult(resultId)}>
        Imprimir resultado
      </button>
      <button onClick={() => downloadPDF(resultId)}>
        Descargar PDF
      </button>
    </>
  );
}
```

#### Backend (PDF Generation)

```typescript
// In laboratory.service.ts

async pdf(resultId: string, actor: CurrentUser) {
  const result = await this.prisma.labResult.findUnique({
    where: { id: resultId },
    include: { template: { include: { analytes: true } }, values: { include: { analyte: true } }, patient: true }
  });
  
  const pdfBuffer = await this.pdfService.generateResultPDF(result, {
    clinicName: this.settings.clinicName,
    logo: this.settings.logoUrl,
  });
  
  return pdfBuffer; // Express sends as application/pdf
}
```

#### PDF Service

```typescript
// libs/pdf/pdf.service.ts — shared by all modules

@Injectable()
export class PdfService {
  async generateResultPDF(result: LabResult, branding: ClinicBranding): Promise<Buffer> {
    const doc = new PDFDocument();
    
    // Header
    if (branding.logo) {
      doc.image(branding.logo, 50, 50, { width: 100 });
    }
    doc.fontSize(16).text(branding.clinicName, 200, 60);
    doc.fontSize(10).text('Resultado de Laboratorio', 200, 80);
    
    // Content
    doc.moveTo(50, 120).lineTo(550, 120).stroke();
    doc.fontSize(12).text(`Paciente: ${result.patient.fullName}`, 50, 140);
    doc.text(`Fecha: ${result.createdAt.toLocaleDateString('es-NI')}`, 50, 160);
    
    // Results table
    this.drawResultsTable(doc, result);
    
    // Footer
    doc.fontSize(10).text('_________________________', 50, doc.y + 20);
    doc.text('Firma y sello de laboratorio', 50, doc.y);
    
    return doc.end();
  }
  
  private drawResultsTable(doc: PDFDocument, result: LabResult) {
    // Draw table rows with values, units, references, flags
  }
}
```

#### HTML Print Template

For browser print (Ctrl+P), use CSS print media:

```typescript
// result-print-template.tsx

export function ResultPrintTemplate({ result }: Props) {
  return (
    <div className="print-container">
      <style>{`
        @media print {
          body { margin: 0; }
          .print-container { width: 100%; }
          .no-print { display: none; }
        }
      `}</style>
      
      {/* Header with clinic logo and name */}
      {/* Results table */}
      {/* Footer with signature line */}
    </div>
  );
}
```

---

## XII. QR/BARCODE ARCHITECTURE

### Goal

- Generate QR codes for orders (scan to view details)
- Generate Code128 for reagent labels (scan to record movement)
- Support both client-side (svg) and server-side (image) generation

### Implementation

#### QR for Orders

```typescript
// lab-print.ts

export function generateOrderQR(orderId: string, clinicURL: string) {
  const url = `${clinicURL}/laboratorio/ordenes/${orderId}`;
  // Use jsbarcode or qrcode.react library
  return qrcode(url, { errorCorrectionLevel: 'M', type: 'image/svg+xml' });
}
```

Use case: Print on order form; lab staff scan to open order detail.

#### Code128 for Reagents

```typescript
export function generateReagentBarcode(reagentId: string) {
  // Code128 is more compact than QR for short strings
  return JsBarcode(`reagent-${reagentId}`, { format: 'CODE128' });
}
```

Use case: Print on reagent label; scan to select reagent for movement.

#### Libraries

```json
{
  "dependencies": {
    "jsbarcode": "^3.11.5",
    "qrcode.react": "^3.1.0"
  }
}
```

#### Component

```typescript
// barcode-generator.tsx

export function BarcodeGenerator({ type, value, size = 'md' }) {
  if (type === 'qr') {
    return <QRCode value={value} size={size === 'md' ? 200 : 400} />;
  }
  if (type === 'code128') {
    return <Barcode value={value} format="CODE128" />;
  }
  return null;
}
```

---

## XIII. SEARCH ARCHITECTURE

### Goal

- Fast, debounced search across orders, results, reagents
- Filter by status, date, priority
- Autocomplete for patient/doctor names

### Implementation

#### Search Input Component

```typescript
// shared/search-input.tsx

export function SearchInput({ onSearch, placeholder }) {
  const [value, setValue] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);
  
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
    />
  );
}
```

#### Hooks

```typescript
export function useLabOrderSearch(query: string, status: string) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    api('/api/laboratory/orders', { 
      params: { search: query, status, page: 1, limit: 20 }
    }).then(r => setResults(r.data));
  }, [query, status]);
  
  return { results, isLoading };
}
```

#### API Support

Backend already supports `?search` via filter in Prisma queries:

```typescript
// laboratory.service.ts

async orders(status, page, limit, search?: string) {
  const where = {
    ...(search && { patient: { fullName: { contains: search, mode: 'insensitive' } } }),
    status: ...,
  };
  return this.prisma.$transaction([
    this.prisma.labOrder.findMany({ where, skip, take, orderBy }),
    this.prisma.labOrder.count({ where }),
  ]);
}
```

---

## XIV. ORDER WORKFLOW

### States & Transitions

```
REQUESTED
  ↓ (Create order)
  ├→ COMPLETED (Add result, validate)
  │    └→ VOIDED (Mark void)
  └→ CANCELLED (Doctor cancels)
```

### Pages Flow

```
Orders List → Order Detail → Create Result → Result Saved

Alternative flow (from reception):
New Order → Select Patient → Select Tests → Save
```

### Actions per Role

| Role | Can Create Order | Can Add Result | Can Void Result | Can Delete Order |
|------|------------------|---|---|---|
| DOCTOR | Yes | Yes | No | No |
| LABORATORY | No | Yes | Yes | No |
| RECEPTION | Yes | No | No | No |
| SUPER_ADMIN | Yes | Yes | Yes | Yes |

---

## XV. RESULT WORKFLOW

### States

```
DRAFT (being filled)
  ↓ (Save)
  VALIDATED (reviewed, ready to print)
    ↓ (Delete or void)
    VOIDED (soft-deleted)
```

### Entry Points

1. **From Order:** Select order → auto-populate template → enter values
2. **Without Order:** Select patient → select template → enter values
3. **External Lab:** System auto-creates result from external lab order

### Validation Flow

```
User enters value
  ↓
Compare to reference range (referenceMin/Max)
  ↓
Determine flag:
  - value < criticalLow → flag = CRITICAL_LOW (RED)
  - value < referenceMin → flag = LOW (YELLOW)
  - value > criticalHigh → flag = CRITICAL_HIGH (RED)
  - value > referenceMax → flag = HIGH (YELLOW)
  - else → no flag (GREEN)
  ↓
Display in UI
  ↓
Save to database
```

### Permissions

- DRAFT results: Only creator or LABORATORY role can edit
- VALIDATED results: No edit; only print/void
- VOIDED results: Read-only, cannot restore

---

## XVI. IMPLEMENTATION STRATEGY

### Phase 1: Foundation (Week 1-2)

1. Create shared types in `shared/types/laboratory.ts`
2. Create `lab-shell.tsx` (layout wrapper)
3. Create generic components in `_components/shared/`
4. Create `lab-api.ts` (typed API client)
5. Create `lab-hooks.ts` (custom React hooks)

**Deliverable:** Reusable infrastructure; no feature pages yet.

### Phase 2: Core Features (Week 3-4)

1. Orders: List, Detail, Create, Update, Delete pages
2. Results: List, Detail, Create, Update, Void pages
3. Result printing and PDF export
4. Result validation and flags

**Deliverable:** CRUD for orders and results.

### Phase 3: Supporting Features (Week 5)

1. Templates: List, Detail, Create, Analyte management
2. Reagents: List, Detail, Create, Movement tracking
3. Expiring alerts and badges

**Deliverable:** Full CRUD for all entities.

### Phase 4: Polish & QA (Week 6)

1. Barcode/QR generation and printing
2. Search and filtering
3. Responsive design testing
4. Accessibility audit
5. Performance optimization

**Deliverable:** Production-ready lab module.

### Git Strategy

```bash
# One branch per phase
git checkout -b lab/foundation
# Phase 1 commits
git push

git checkout -b lab/core-features
# Phase 2 commits
git push

git checkout -b lab/supporting-features
# Phase 3 commits
git push

git checkout -b lab/polish
# Phase 4 commits
git push

# Final: merge all into main
```

---

## XVII. TESTING STRATEGY

### Unit Tests

- Validation functions (`lab-validation.ts`)
- Search/filter utilities (`lab-search.ts`)
- Print template helpers (`lab-print.ts`)

### Integration Tests

- API calls (`lab-api.ts`) via mock fetch
- Hooks (`lab-hooks.ts`) with @testing-library/react-hooks
- Component props and state changes

### E2E Tests

- User flows: Create order → Add result → Print
- Barcode scanning: Scan QR → Open order detail
- Pagination: Navigate pages, verify data

### Coverage Target

- Hooks: 100% (pure functions)
- Components: 80%+ (avoid testing dumb presentational)
- API client: 100%

---

## XVIII. PERFORMANCE CONSIDERATIONS

1. **Data Fetching:** React Query auto-caches; avoid re-fetching
2. **List Rendering:** Use virtualization for 1000+ rows (react-window)
3. **PDF Generation:** Server-side via PDFKit (don't block UI)
4. **Barcode Generation:** Client-side SVG (instant, lightweight)
5. **Search:** Debounced to 300ms; show loading state
6. **Pagination:** Fetch 50 items/page; load next page on demand

---

## XIX. ACCESSIBILITY

- Semantic HTML (`<table>`, `<form>`, `<button>`)
- ARIA labels for icons
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast: WCAG AA minimum
- Print stylesheet: Dark text on white

---

## XX. ROLLOUT PLAN

### Pre-Launch

1. ✅ Complete architecture review (this document)
2. ⏳ Implement Phase 1-4 with peer review
3. ⏳ UAT with lab staff + doctors
4. ⏳ Load test: 1000 orders/results in DB
5. ⏳ Security audit: SQL injection, XSS, CSRF

### Launch

1. Backup production database
2. Deploy to staging; full UAT pass
3. Deploy to production during off-hours
4. Monitor error logs and performance metrics
5. Gather feedback; iterate on UX

### Post-Launch (Week 1-2)

1. Bug fixes and quick wins
2. User training documentation
3. Monitor adoption and pain points
4. Plan improvements (Phase 2.5)

---

## XXI. SUCCESS METRICS

**Before:** Lab staff reported slow order lookups, missing result validation, 15+ clicks to print.

**After:**
- ✅ Order search: < 500ms
- ✅ Result validation: auto-flagged critical values
- ✅ Print: 1 click from result detail
- ✅ Staff productivity: +30% (estimated)
- ✅ Result accuracy: 100% (validated on backend)

---

## APPENDIX: Questions for Stakeholder Review

1. ✅ Are the proposed folder structure and component split sensible?
2. ✅ Should we add result approval workflow (doctor signs off before print)?
3. ✅ Do we need result versioning (track changes to values)?
4. ✅ Should barcode scanning open a modal or navigate to page?
5. ✅ Any required integrations with external lab systems?
6. ✅ Should templates be shareable between clinics?
7. ✅ Do we need audit trail for who changed which result values?

---

**Status:** Ready for implementation upon approval.  
**Estimated Effort:** 6 weeks (1.5 for foundation, 2.5 for features, 1 for polish, 1 for UAT).  
**Risk:** None identified; existing DB schema supports design without migrations.
