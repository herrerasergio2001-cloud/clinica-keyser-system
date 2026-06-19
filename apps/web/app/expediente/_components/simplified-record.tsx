'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Download,
  Eye,
  FileDown,
  Files,
  FlaskConical,
  History,
  ImagePlus,
  Pencil,
  Printer,
  RotateCcw,
  Save,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { apiJson, authenticatedFetch, jsonHeaders } from '../../_components/api-client';
import { useSession } from '../../_components/session';
import { ClinicalShell } from './clinical-shell';

type Patient = {
  id: string;
  fullName: string;
  patientCode: string;
  birthDate: string;
  gender: string;
  phone?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
};

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
};

type Evolution = {
  id: string;
  noteDate: string;
  content: string;
  doctorName: string;
  status: string;
  isDeleted: boolean;
};

type Procedure = {
  id: string;
  name: string;
  performedAt: string;
  relatedDiagnosis?: string | null;
  description: string;
  observations?: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  archiveReason?: string | null;
  doctor: { id: string; fullName: string };
  attachments: Attachment[];
};

type Study = {
  id: string;
  category: 'LABORATORY' | 'IMAGING';
  studyType: string;
  studyDate: string;
  results?: string | null;
  observations?: string | null;
  createdByRole: string;
  status: 'ACTIVE' | 'ARCHIVED';
  archiveReason?: string | null;
  doctor: { id: string; fullName: string };
  attachments: Attachment[];
};

type MedicalAttachment = Attachment & {
  description?: string | null;
  createdAt: string;
  uploadedBy?: { id: string; fullName: string } | null;
};

type LabOrder = {
  id: string;
  orderNumber: string;
  diagnosis?: string | null;
  reason?: string | null;
  observations?: string | null;
  status: string;
  createdAt: string;
  doctor: { id: string; fullName: string };
  items: Array<{ id: string; examName: string }>;
};

type ImagingOrder = {
  id: string;
  orderNumber: string;
  studyType: string;
  imagingType?: string | null;
  clinicalReason?: string | null;
  presumptiveDiagnosis?: string | null;
  observations?: string | null;
  status: string;
  createdAt: string;
  doctor: { id: string; fullName: string };
};

type MedicalRecord = {
  id: string;
  recordNumber: string;
  consultationDate: string;
  reasonForVisit?: string | null;
  chiefComplaint: string;
  currentIllness?: string | null;
  personalPathologicalHistory?: string | null;
  surgicalHistory?: string | null;
  familyHistory?: string | null;
  allergicHistory?: string | null;
  currentMedications?: string | null;
  toxicHabits?: string | null;
  reviewOfSystems?: string | null;
  diagnosisText?: string | null;
  treatmentPlan?: string | null;
  physicalExam?: { otherFindings?: string | null } | null;
  doctor: { id: string; fullName: string };
  evolutionNotes: Evolution[];
  clinicalProcedures: Procedure[];
  diagnosticStudies: Study[];
  attachments: MedicalAttachment[];
};

type Tab = 'history' | 'evolutions' | 'procedures' | 'files' | 'orders' | 'studies';

const historyEmpty = {
  reasonForVisit: '',
  currentIllness: '',
  personalPathologicalHistory: '',
  surgicalHistory: '',
  familyHistory: '',
  allergicHistory: '',
  currentMedications: '',
  toxicHabits: '',
  reviewOfSystems: '',
  physicalExam: '',
  diagnosisText: '',
  treatmentPlan: '',
};

const procedureEmpty = {
  name: '',
  performedAt: localDateTime(),
  relatedDiagnosis: '',
  description: '',
  observations: '',
};

const studyEmpty = {
  category: 'LABORATORY' as 'LABORATORY' | 'IMAGING',
  studyType: 'Examen de laboratorio',
  studyDate: localDateTime(),
  results: '',
  observations: '',
};

const labOrderEmpty = {
  exams: '',
  diagnosis: '',
  reason: '',
  observations: '',
};

const imagingOrderEmpty = {
  imagingType: 'Ultrasonido',
  studyType: 'Ultrasonido',
  clinicalReason: '',
  presumptiveDiagnosis: '',
  observations: '',
};

const imagingTypes = [
  'Ultrasonido',
  'Radiografía',
  'Tomografía',
  'Resonancia',
  'Ecocardiograma',
  'Electrocardiograma',
  'Electroencefalograma',
  'Otro estudio diagnóstico',
];

export function SimplifiedClinicalRecord({
  patientId,
  recordId,
  startNew = false,
}: {
  patientId: string;
  recordId?: string;
  startNew?: boolean;
}) {
  const router = useRouter();
  const session = useSession();
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || session?.role === 'ADMIN';
  const isDoctor = session?.role === 'DOCTOR';
  const isLaboratory = session?.role === 'LABORATORY';
  const isReception = session?.role === 'RECEPTION';
  const canCreateClinical = Boolean(isAdmin || isDoctor);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedId, setSelectedId] = useState(recordId ?? '');
  const [tab, setTab] = useState<Tab>('history');
  const [historyForm, setHistoryForm] = useState(historyEmpty);
  const [evolutionText, setEvolutionText] = useState('');
  const [editingEvolution, setEditingEvolution] = useState<Evolution | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [procedureForm, setProcedureForm] = useState(procedureEmpty);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [procedureFiles, setProcedureFiles] = useState<File[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [studyForm, setStudyForm] = useState(studyEmpty);
  const [editingStudy, setEditingStudy] = useState<Study | null>(null);
  const [studyFiles, setStudyFiles] = useState<File[]>([]);
  const [medicalFiles, setMedicalFiles] = useState<MedicalAttachment[]>([]);
  const [pendingMedicalFiles, setPendingMedicalFiles] = useState<File[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [imagingOrders, setImagingOrders] = useState<ImagingOrder[]>([]);
  const [labOrderForm, setLabOrderForm] = useState(labOrderEmpty);
  const [imagingOrderForm, setImagingOrderForm] = useState(imagingOrderEmpty);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeRecord = useMemo(
    () => (startNew ? undefined : records.find((item) => item.id === selectedId) ?? records[0]),
    [records, selectedId, startNew],
  );

  useEffect(() => {
    void loadBase();
  }, [patientId]);

  useEffect(() => {
    if (!activeRecord) {
      setHistoryForm(historyEmpty);
      setProcedures([]);
      setStudies([]);
      setMedicalFiles([]);
      setLabOrders([]);
      setImagingOrders([]);
      return;
    }
    setSelectedId(activeRecord.id);
    setHistoryForm(historyFromRecord(activeRecord));
    void loadEntries(activeRecord.id);
  }, [activeRecord?.id, includeArchived]);

  async function loadBase(preferredRecordId?: string) {
    setLoading(true);
    setError('');
    try {
      const [patientData, recordData] = await Promise.all([
        apiJson<Patient>(`/api/patients/${patientId}`),
        apiJson<MedicalRecord[]>(`/api/medical-records/patient/${patientId}`),
      ]);
      setPatient(patientData);
      setRecords(recordData);
      if (preferredRecordId) setSelectedId(preferredRecordId);
      else if (!selectedId && recordData[0]) setSelectedId(recordData[0].id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo abrir el expediente'));
    } finally {
      setLoading(false);
    }
  }

  async function loadEntries(id: string) {
    const archived = isAdmin && includeArchived ? '?includeArchived=true' : '';
    try {
      const [evolutions, procedureData, studyData, attachments, labOrderData, imagingOrderData] = await Promise.all([
        apiJson<Evolution[]>(`/api/medical-records/${id}/evolution-notes${archived}`),
        apiJson<Procedure[]>(`/api/medical-records/${id}/procedures${archived}`),
        apiJson<Study[]>(`/api/medical-records/${id}/studies${archived}`),
        apiJson<MedicalAttachment[]>(`/api/medical-records/${id}/attachments`),
        apiJson<LabOrder[]>(`/api/lab-orders-external?medicalRecordId=${encodeURIComponent(id)}`),
        apiJson<ImagingOrder[]>(`/api/imaging-orders?medicalRecordId=${encodeURIComponent(id)}`),
      ]);
      setRecords((current) => current.map((record) => (record.id === id ? { ...record, evolutionNotes: evolutions } : record)));
      setProcedures(procedureData);
      setStudies(studyData);
      setMedicalFiles(attachments);
      setLabOrders(labOrderData);
      setImagingOrders(imagingOrderData);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar el historial clínico'));
    }
  }

  async function saveHistory(event: FormEvent) {
    event.preventDefault();
    if (!canCreateClinical && !isAdmin) return;
    setSaving(true);
    setError('');
    const payload = {
      patientId,
      consultationDate: new Date().toISOString(),
      reasonForVisit: historyForm.reasonForVisit,
      chiefComplaint: historyForm.reasonForVisit || 'Consulta externa',
      currentIllness: historyForm.currentIllness,
      personalPathologicalHistory: historyForm.personalPathologicalHistory,
      surgicalHistory: historyForm.surgicalHistory,
      familyHistory: historyForm.familyHistory,
      allergicHistory: historyForm.allergicHistory,
      currentMedications: historyForm.currentMedications,
      toxicHabits: historyForm.toxicHabits,
      reviewOfSystems: historyForm.reviewOfSystems,
      diagnosisText: historyForm.diagnosisText,
      treatmentPlan: historyForm.treatmentPlan,
      physicalExam: { otherFindings: historyForm.physicalExam },
    };
    try {
      const saved = activeRecord
        ? await apiJson<MedicalRecord>(`/api/medical-records/${activeRecord.id}`, {
            method: 'PATCH',
            headers: jsonHeaders(),
            body: JSON.stringify(payload),
          })
        : await apiJson<MedicalRecord>('/api/medical-records', {
            method: 'POST',
            headers: jsonHeaders(),
            body: JSON.stringify(payload),
          });
      setMessage(activeRecord ? 'Historia clínica actualizada.' : 'Historia clínica creada.');
      if (!activeRecord) {
        router.replace(`/expediente/${patientId}/${saved.id}`);
        return;
      }
      await loadBase(saved.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la historia clínica'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEvolution(event: FormEvent) {
    event.preventDefault();
    if (!activeRecord || !evolutionText.trim()) return;
    setSaving(true);
    try {
      await apiJson(
        editingEvolution
          ? `/api/medical-records/evolution-notes/${editingEvolution.id}`
          : `/api/medical-records/${activeRecord.id}/evolution-notes`,
        {
          method: editingEvolution ? 'PATCH' : 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ content: evolutionText.trim(), noteDate: editingEvolution?.noteDate ?? new Date().toISOString() }),
        },
      );
      setEvolutionText('');
      setEditingEvolution(null);
      setMessage(editingEvolution ? 'Evolución actualizada.' : 'Evolución agregada.');
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la evolución'));
    } finally {
      setSaving(false);
    }
  }

  async function archiveEvolution(item: Evolution) {
    const reason = window.prompt('Motivo para eliminar esta evolución:');
    if (!reason?.trim()) return;
    await action(`/api/medical-records/evolution-notes/${item.id}/archive`, reason, 'Evolución archivada.');
  }

  async function restoreEvolution(item: Evolution) {
    await action(`/api/medical-records/evolution-notes/${item.id}/restore`, 'Restauración administrativa', 'Evolución restaurada.');
  }

  async function saveProcedure(event: FormEvent) {
    event.preventDefault();
    if (!activeRecord) return;
    setSaving(true);
    try {
      const saved = await apiJson<Procedure>(
        editingProcedure
          ? `/api/medical-records/procedures/${editingProcedure.id}`
          : `/api/medical-records/${activeRecord.id}/procedures`,
        {
          method: editingProcedure ? 'PATCH' : 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ ...procedureForm, performedAt: new Date(procedureForm.performedAt).toISOString() }),
        },
      );
      await uploadFiles(`/api/medical-records/procedures/${saved.id}/attachments`, procedureFiles);
      setProcedureForm(procedureEmpty);
      setEditingProcedure(null);
      setProcedureFiles([]);
      setMessage(editingProcedure ? 'Procedimiento actualizado.' : 'Procedimiento guardado.');
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar el procedimiento'));
    } finally {
      setSaving(false);
    }
  }

  async function saveStudy(event: FormEvent) {
    event.preventDefault();
    if (!activeRecord) return;
    setSaving(true);
    try {
      const saved = await apiJson<Study>(
        editingStudy
          ? `/api/medical-records/studies/${editingStudy.id}`
          : `/api/medical-records/${activeRecord.id}/studies`,
        {
          method: editingStudy ? 'PATCH' : 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ ...studyForm, studyDate: new Date(studyForm.studyDate).toISOString() }),
        },
      );
      await uploadFiles(`/api/medical-records/studies/${saved.id}/attachments`, studyFiles);
      setStudyForm(studyEmpty);
      setEditingStudy(null);
      setStudyFiles([]);
      setMessage(editingStudy ? 'Estudio actualizado.' : 'Estudio guardado.');
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar el estudio'));
    } finally {
      setSaving(false);
    }
  }

  async function action(path: string, reason: string, success: string) {
    if (!activeRecord) return;
    try {
      await apiJson(path, { method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify({ reason }) });
      setMessage(success);
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo completar la acción'));
    }
  }

  async function uploadFiles(path: string, files: File[]) {
    for (const file of files) {
      const body = new FormData();
      body.append('file', file);
      const response = await authenticatedFetch(path, { method: 'POST', body });
      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: `No se pudo subir ${file.name}` }));
        throw new Error(result.message);
      }
    }
  }

  async function openAttachment(attachment: Attachment) {
    try {
      const response = await authenticatedFetch(`/api/medical-records/clinical-attachments/${attachment.id}/download`);
      if (!response.ok) throw new Error('No se pudo abrir el archivo');
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo abrir el archivo'));
    }
  }

  async function uploadMedicalFiles() {
    if (!activeRecord || !pendingMedicalFiles.length) return;
    setSaving(true);
    setError('');
    try {
      for (const file of pendingMedicalFiles) {
        const body = new FormData();
        body.append('file', file);
        body.append('description', 'Archivo clínico');
        const response = await authenticatedFetch(`/api/medical-records/${activeRecord.id}/attachments`, { method: 'POST', body });
        if (!response.ok) {
          const result = await response.json().catch(() => ({ message: `No se pudo subir ${file.name}` }));
          throw new Error(result.message);
        }
      }
      setPendingMedicalFiles([]);
      setMessage('Archivos clínicos cargados correctamente.');
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron subir los archivos'));
    } finally {
      setSaving(false);
    }
  }

  async function openMedicalAttachment(attachment: MedicalAttachment, download = false) {
    await openProtectedFile(
      `/api/medical-records/${activeRecord?.id}/attachments/${attachment.id}/download`,
      attachment.fileName,
      download,
    );
  }

  async function deleteMedicalAttachment(attachment: MedicalAttachment) {
    if (!activeRecord || !isAdmin) return;
    const reason = window.prompt(`Motivo para eliminar ${attachment.fileName}:`);
    if (!reason?.trim()) return;
    await action(`/api/medical-records/attachments/${attachment.id}/delete`, reason, 'Archivo eliminado.');
  }

  async function openProtectedFile(path: string, fileName: string, download = false, print = false) {
    try {
      const response = await authenticatedFetch(path);
      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: 'No se pudo generar el archivo' }));
        throw new Error(result.message ?? 'No se pudo generar el archivo');
      }
      const url = URL.createObjectURL(await response.blob());
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
      } else {
        const popup = window.open(url, '_blank', 'noopener,noreferrer');
        if (print && popup) window.setTimeout(() => popup.print(), 800);
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo abrir el archivo'));
    }
  }

  async function saveLabOrder(event: FormEvent) {
    event.preventDefault();
    if (!activeRecord || !patient) return;
    const exams = labOrderForm.exams.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!exams.length) {
      setError('Agregue al menos un examen de laboratorio.');
      return;
    }
    try {
      await apiJson('/api/lab-orders-external', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          patientId: patient.id,
          medicalRecordId: activeRecord.id,
          doctorId: activeRecord.doctor.id,
          diagnosis: labOrderForm.diagnosis,
          reason: labOrderForm.reason,
          observations: labOrderForm.observations,
          exams,
        }),
      });
      setLabOrderForm(labOrderEmpty);
      setMessage('Orden de laboratorio creada.');
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear la orden'));
    }
  }

  async function saveImagingOrder(event: FormEvent) {
    event.preventDefault();
    if (!activeRecord || !patient) return;
    try {
      await apiJson('/api/imaging-orders', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          patientId: patient.id,
          medicalRecordId: activeRecord.id,
          doctorId: activeRecord.doctor.id,
          ...imagingOrderForm,
        }),
      });
      setImagingOrderForm(imagingOrderEmpty);
      setMessage('Orden de imagen creada.');
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear la orden'));
    }
  }

  async function permanentlyDelete(path: string, label: string) {
    if (!activeRecord || !isSuperAdmin) return;
    if (!window.confirm(`¿Eliminar definitivamente ${label}? Esta acción no se puede deshacer.`)) return;
    const reason = window.prompt('Motivo de eliminación definitiva:');
    if (!reason?.trim()) return;
    try {
      await apiJson(path, { method: 'DELETE', headers: jsonHeaders(), body: JSON.stringify({ reason }) });
      setMessage(`${label} eliminado definitivamente.`);
      await loadEntries(activeRecord.id);
    } catch (err) {
      setError(errorMessage(err, `No se pudo eliminar ${label}`));
    }
  }

  const historyEditable = !activeRecord ? canCreateClinical : isAdmin;
  const evolutionItems = activeRecord?.evolutionNotes ?? [];
  const canCreateEvolution = Boolean(activeRecord && (isAdmin || isDoctor));
  const canCreateProcedure = Boolean(activeRecord && (isAdmin || isDoctor));
  const canCreateStudy = Boolean(activeRecord && (isAdmin || isDoctor || isLaboratory));
  const canCreateOrders = Boolean(activeRecord && (isAdmin || isDoctor || isReception));

  if (loading) {
    return <ClinicalShell title="Expediente Clínico" subtitle="Cargando"><p className="p-6 text-sm text-slate-500">Cargando expediente...</p></ClinicalShell>;
  }

  return (
    <ClinicalShell title={`Expediente de ${patient?.fullName ?? 'paciente'}`} subtitle={patient?.patientCode ?? 'Sin código'}>
      <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
        {patient && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Paciente</p>
                <h1 className="text-xl font-semibold">{patient.fullName}</h1>
                <p className="mt-1 text-sm text-slate-500">{patient.patientCode} · {age(patient.birthDate)} años · {genderLabel(patient.gender)}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <Info label="Teléfono" value={patient.phone} />
                <Info label="Tipo de sangre" value={patient.bloodType} />
                <Info label="Alergias registradas" value={patient.allergies} />
              </div>
            </div>
            {!startNew && records.length > 1 && (
              <label className="mt-4 grid max-w-md gap-1 text-sm font-medium">
                Consulta
                <select value={activeRecord?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)} className="h-10 rounded-md border bg-white px-3 dark:bg-slate-950">
                  {records.map((record) => <option key={record.id} value={record.id}>{record.recordNumber} · {new Date(record.consultationDate).toLocaleDateString('es-NI')}</option>)}
                </select>
              </label>
            )}
          </section>
        )}

        {(message || error) && <div className={`rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-teal-200 bg-teal-50 text-teal-900'}`}>{error || message}</div>}

        <nav className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3 xl:grid-cols-6">
          <TabButton active={tab === 'history'} icon={History} label="Historia clínica" onClick={() => setTab('history')} />
          <TabButton active={tab === 'evolutions'} icon={ClipboardList} label="Evoluciones" onClick={() => setTab('evolutions')} />
          <TabButton active={tab === 'procedures'} icon={Stethoscope} label="Procedimientos" onClick={() => setTab('procedures')} />
          <TabButton active={tab === 'files'} icon={Files} label="Archivos" onClick={() => setTab('files')} />
          <TabButton active={tab === 'orders'} icon={ImagePlus} label="Órdenes" onClick={() => setTab('orders')} />
          <TabButton active={tab === 'studies'} icon={FlaskConical} label="Estudios" onClick={() => setTab('studies')} />
        </nav>

        {tab === 'history' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading title="Historia clínica" subtitle="Información inicial de consulta externa." />
            {!activeRecord && !canCreateClinical ? (
              <Empty text="Este paciente aún no tiene historia clínica. Un médico debe crearla." />
            ) : (
              <form onSubmit={saveHistory} className="grid gap-4">
                <HistoryArea label="Motivo de consulta" field="reasonForVisit" value={historyForm.reasonForVisit} setForm={setHistoryForm} disabled={!historyEditable} required />
                <HistoryArea label="Enfermedad actual" field="currentIllness" value={historyForm.currentIllness} setForm={setHistoryForm} disabled={!historyEditable} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <HistoryArea label="Antecedentes personales patológicos" field="personalPathologicalHistory" value={historyForm.personalPathologicalHistory} setForm={setHistoryForm} disabled={!historyEditable} />
                  <HistoryArea label="Antecedentes quirúrgicos" field="surgicalHistory" value={historyForm.surgicalHistory} setForm={setHistoryForm} disabled={!historyEditable} />
                  <HistoryArea label="Antecedentes familiares" field="familyHistory" value={historyForm.familyHistory} setForm={setHistoryForm} disabled={!historyEditable} />
                  <HistoryArea label="Alergias" field="allergicHistory" value={historyForm.allergicHistory} setForm={setHistoryForm} disabled={!historyEditable} />
                  <HistoryArea label="Medicamentos actuales" field="currentMedications" value={historyForm.currentMedications} setForm={setHistoryForm} disabled={!historyEditable} />
                  <HistoryArea label="Hábitos" field="toxicHabits" value={historyForm.toxicHabits} setForm={setHistoryForm} disabled={!historyEditable} />
                </div>
                <HistoryArea label="Revisión por sistemas" field="reviewOfSystems" value={historyForm.reviewOfSystems} setForm={setHistoryForm} disabled={!historyEditable} />
                <HistoryArea label="Examen físico completo" field="physicalExam" value={historyForm.physicalExam} setForm={setHistoryForm} disabled={!historyEditable} rows={6} />
                <HistoryArea label="Diagnóstico inicial" field="diagnosisText" value={historyForm.diagnosisText} setForm={setHistoryForm} disabled={!historyEditable} />
                <HistoryArea label="Plan inicial" field="treatmentPlan" value={historyForm.treatmentPlan} setForm={setHistoryForm} disabled={!historyEditable} />
                {historyEditable && <button disabled={saving} className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-clinic-teal px-5 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Guardando...' : activeRecord ? 'Guardar cambios' : 'Crear historia clínica'}</button>}
                {activeRecord && !isAdmin && <p className="text-xs text-slate-500">La historia ya guardada es de solo lectura. Solo el administrador puede corregirla; los médicos pueden agregar nuevas evoluciones.</p>}
              </form>
            )}
          </section>
        )}

        {tab === 'evolutions' && (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            {canCreateEvolution && (
              <form onSubmit={saveEvolution} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SectionHeading title={editingEvolution ? 'Editar evolución' : 'Nueva evolución'} subtitle="Nota médica libre, sin subdivisiones." />
                <div className="mb-3 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
                  <Info label="Fecha y hora" value={editingEvolution ? dateTime(editingEvolution.noteDate) : dateTime(new Date().toISOString())} />
                  <Info label="Médico" value={session?.name} />
                </div>
                <Area label="Evolución" value={evolutionText} onChange={setEvolutionText} rows={12} required />
                <div className="mt-4 flex gap-2">
                  <PrimaryButton saving={saving} label={editingEvolution ? 'Guardar corrección' : 'Agregar evolución'} />
                  {editingEvolution && <button type="button" onClick={() => { setEditingEvolution(null); setEvolutionText(''); }} className="h-10 rounded-md border px-4 text-sm">Cancelar</button>}
                </div>
              </form>
            )}
            <Timeline
              title="Evoluciones"
              empty="No hay evoluciones registradas."
              action={isAdmin ? <ArchivedToggle checked={includeArchived} onChange={setIncludeArchived} /> : undefined}
            >
              {evolutionItems.map((item) => (
                <article key={item.id} className={`rounded-lg border p-4 ${item.isDeleted ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{new Date(item.noteDate).toLocaleDateString('es-NI')} · {new Date(item.noteDate).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm text-slate-500">{item.doctorName}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => void openProtectedFile(`/api/medical-records/evolution-notes/${item.id}/pdf`, `evolucion-${item.id}.pdf`)}
                        className="rounded-md border p-2"
                        title="PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      {isAdmin && <AdminActions archived={item.isDeleted} onEdit={() => { setEditingEvolution(item); setEvolutionText(item.content); }} onArchive={() => void archiveEvolution(item)} onRestore={() => void restoreEvolution(item)} />}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.content}</p>
                </article>
              ))}
            </Timeline>
          </div>
        )}

        {tab === 'procedures' && (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            {canCreateProcedure && (
              <form onSubmit={saveProcedure} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SectionHeading title={editingProcedure ? 'Editar procedimiento' : 'Nuevo procedimiento'} subtitle="Registro breve del procedimiento realizado." />
                <div className="grid gap-3">
                  <Info label="Médico responsable" value={session?.name} />
                  <Input label="Nombre del procedimiento" value={procedureForm.name} onChange={(value) => setProcedureForm({ ...procedureForm, name: value })} required />
                  <Input label="Fecha y hora" type="datetime-local" value={procedureForm.performedAt} onChange={(value) => setProcedureForm({ ...procedureForm, performedAt: value })} required />
                  <Area label="Diagnóstico relacionado" value={procedureForm.relatedDiagnosis} onChange={(value) => setProcedureForm({ ...procedureForm, relatedDiagnosis: value })} />
                  <Area label="Descripción" value={procedureForm.description} onChange={(value) => setProcedureForm({ ...procedureForm, description: value })} rows={6} required />
                  <Area label="Observaciones" value={procedureForm.observations} onChange={(value) => setProcedureForm({ ...procedureForm, observations: value })} />
                  <FilePicker onChange={setProcedureFiles} />
                </div>
                <div className="mt-4 flex gap-2">
                  <PrimaryButton saving={saving} label={editingProcedure ? 'Guardar cambios' : 'Guardar procedimiento'} />
                  {editingProcedure && <button type="button" onClick={() => { setEditingProcedure(null); setProcedureForm(procedureEmpty); }} className="h-10 rounded-md border px-4 text-sm">Cancelar</button>}
                </div>
              </form>
            )}
            <Timeline
              title="Procedimientos"
              empty="No hay procedimientos registrados."
              action={isAdmin ? <ArchivedToggle checked={includeArchived} onChange={setIncludeArchived} /> : undefined}
            >
              {procedures.map((item) => (
                <article key={item.id} className={`rounded-lg border p-4 ${item.status === 'ARCHIVED' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{item.name}</h3><p className="text-sm text-slate-500">{dateTime(item.performedAt)} · {item.doctor.fullName}</p></div>
                    <div className="flex gap-1">
                      <button onClick={() => void openProtectedFile(`/api/medical-records/procedures/${item.id}/pdf`, `procedimiento-${item.id}.pdf`)} className="rounded-md border p-2" title="PDF"><FileDown className="h-4 w-4" /></button>
                      {isAdmin && <AdminActions archived={item.status === 'ARCHIVED'} onEdit={() => { setEditingProcedure(item); setProcedureForm({ name: item.name, performedAt: localDateTime(item.performedAt), relatedDiagnosis: item.relatedDiagnosis ?? '', description: item.description, observations: item.observations ?? '' }); }} onArchive={() => promptAction(`/api/medical-records/procedures/${item.id}/archive`, 'Motivo para archivar el procedimiento:', 'Procedimiento archivado.') } onRestore={() => void action(`/api/medical-records/procedures/${item.id}/restore`, 'Restauración administrativa', 'Procedimiento restaurado.')} />}
                    </div>
                  </div>
                  {item.relatedDiagnosis && <p className="mt-3 text-sm"><strong>Diagnóstico relacionado:</strong> {item.relatedDiagnosis}</p>}
                  <p className="mt-3 whitespace-pre-wrap text-sm">{item.description}</p>
                  {item.observations && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600"><strong>Observaciones:</strong> {item.observations}</p>}
                  <AttachmentList items={item.attachments} onOpen={openAttachment} />
                </article>
              ))}
            </Timeline>
          </div>
        )}

        {tab === 'files' && (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            {(isAdmin || isDoctor) && (
              <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SectionHeading title="Subir archivos" subtitle="Documentos e imágenes vinculados al expediente." />
                <label className="grid gap-2 text-sm font-medium">
                  Archivos
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.dcm,application/pdf,image/jpeg,image/png,application/dicom"
                    onChange={(event) => setPendingMedicalFiles(Array.from(event.target.files ?? []))}
                    className="rounded-md border bg-white p-2 dark:bg-slate-950"
                  />
                  <span className="text-xs font-normal text-slate-500">PDF, JPG, PNG y DICOM. Máximo 30 MB por archivo.</span>
                </label>
                <button
                  onClick={() => void uploadMedicalFiles()}
                  disabled={!pendingMedicalFiles.length || saving}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />Subir archivos
                </button>
              </section>
            )}
            <Timeline title="Imágenes y documentos" empty="No hay archivos clínicos cargados.">
              {medicalFiles.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{item.fileName}</h3>
                      <p className="text-xs text-slate-500">{item.mimeType} · {formatBytes(item.size)} · {dateTime(item.createdAt)}</p>
                      {item.description && <p className="mt-2 text-sm">{item.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => void openMedicalAttachment(item)} className="rounded-md border p-2" title="Ver"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => void openMedicalAttachment(item, true)} className="rounded-md border p-2" title="Descargar"><Download className="h-4 w-4" /></button>
                      {isAdmin && <button onClick={() => void deleteMedicalAttachment(item)} className="rounded-md border border-red-200 p-2 text-red-700" title="Eliminar"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </div>
                </article>
              ))}
            </Timeline>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-5">
            {canCreateOrders && (
              <div className="grid gap-5 xl:grid-cols-2">
                <form onSubmit={saveLabOrder} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <SectionHeading title="Nueva orden de laboratorio" subtitle="Quedará registrada dentro del expediente." />
                  <div className="grid gap-3">
                    <Area label="Exámenes (uno por línea)" value={labOrderForm.exams} onChange={(value) => setLabOrderForm({ ...labOrderForm, exams: value })} rows={6} required />
                    <Area label="Diagnóstico" value={labOrderForm.diagnosis} onChange={(value) => setLabOrderForm({ ...labOrderForm, diagnosis: value })} />
                    <Area label="Motivo" value={labOrderForm.reason} onChange={(value) => setLabOrderForm({ ...labOrderForm, reason: value })} />
                    <Area label="Observaciones" value={labOrderForm.observations} onChange={(value) => setLabOrderForm({ ...labOrderForm, observations: value })} />
                  </div>
                  <PrimaryButton saving={saving} label="Crear orden de laboratorio" />
                </form>
                <form onSubmit={saveImagingOrder} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <SectionHeading title="Nueva orden de imagen" subtitle="Solicitud médica imprimible y vinculada al expediente." />
                  <div className="grid gap-3">
                    <label className="grid gap-1 text-sm font-medium">Tipo<select value={imagingOrderForm.imagingType} onChange={(event) => setImagingOrderForm({ ...imagingOrderForm, imagingType: event.target.value, studyType: event.target.value })} className="h-10 rounded-md border bg-white px-3 dark:bg-slate-950">{imagingTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                    <Input label="Estudio solicitado" value={imagingOrderForm.studyType} onChange={(value) => setImagingOrderForm({ ...imagingOrderForm, studyType: value })} required />
                    <Area label="Diagnóstico presuntivo" value={imagingOrderForm.presumptiveDiagnosis} onChange={(value) => setImagingOrderForm({ ...imagingOrderForm, presumptiveDiagnosis: value })} />
                    <Area label="Motivo clínico" value={imagingOrderForm.clinicalReason} onChange={(value) => setImagingOrderForm({ ...imagingOrderForm, clinicalReason: value })} />
                    <Area label="Observaciones" value={imagingOrderForm.observations} onChange={(value) => setImagingOrderForm({ ...imagingOrderForm, observations: value })} />
                  </div>
                  <PrimaryButton saving={saving} label="Crear orden de imagen" />
                </form>
              </div>
            )}
            <div className="grid gap-5 xl:grid-cols-2">
              <OrderTimeline title="Órdenes de laboratorio" empty="No hay órdenes de laboratorio.">
                {labOrders.map((item) => (
                  <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-semibold">{item.orderNumber}</h3><p className="text-sm text-slate-500">{dateTime(item.createdAt)} · {item.doctor.fullName}</p></div>
                      <OrderPdfActions
                        disabled={item.status === 'VOIDED'}
                        onPreview={() => void openProtectedFile(`/api/lab-orders-external/${item.id}/pdf`, `${item.orderNumber}.pdf`)}
                        onDownload={() => void openProtectedFile(`/api/lab-orders-external/${item.id}/pdf`, `${item.orderNumber}.pdf`, true)}
                        onPrint={() => void openProtectedFile(`/api/lab-orders-external/${item.id}/pdf`, `${item.orderNumber}.pdf`, false, true)}
                        onDelete={isSuperAdmin ? () => void permanentlyDelete(`/api/lab-orders-external/${item.id}`, `la orden ${item.orderNumber}`) : undefined}
                      />
                    </div>
                    <p className="mt-3 text-sm"><strong>Exámenes:</strong> {item.items.map((entry) => entry.examName).join(', ')}</p>
                    {item.diagnosis && <p className="mt-2 text-sm"><strong>Diagnóstico:</strong> {item.diagnosis}</p>}
                    <p className="mt-2 text-xs font-semibold text-slate-500">Estado: {item.status}</p>
                  </article>
                ))}
              </OrderTimeline>
              <OrderTimeline title="Órdenes de imagen" empty="No hay órdenes de imagen.">
                {imagingOrders.map((item) => (
                  <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-semibold">{item.orderNumber} · {item.studyType}</h3><p className="text-sm text-slate-500">{dateTime(item.createdAt)} · {item.doctor.fullName}</p></div>
                      <OrderPdfActions
                        disabled={item.status === 'VOIDED'}
                        onPreview={() => void openProtectedFile(`/api/imaging-orders/${item.id}/pdf`, `${item.orderNumber}.pdf`)}
                        onDownload={() => void openProtectedFile(`/api/imaging-orders/${item.id}/pdf`, `${item.orderNumber}.pdf`, true)}
                        onPrint={() => void openProtectedFile(`/api/imaging-orders/${item.id}/pdf`, `${item.orderNumber}.pdf`, false, true)}
                        onDelete={isSuperAdmin ? () => void permanentlyDelete(`/api/imaging-orders/${item.id}`, `la orden ${item.orderNumber}`) : undefined}
                      />
                    </div>
                    {item.presumptiveDiagnosis && <p className="mt-3 text-sm"><strong>Diagnóstico:</strong> {item.presumptiveDiagnosis}</p>}
                    {item.clinicalReason && <p className="mt-2 text-sm"><strong>Motivo:</strong> {item.clinicalReason}</p>}
                    <p className="mt-2 text-xs font-semibold text-slate-500">Estado: {item.status}</p>
                  </article>
                ))}
              </OrderTimeline>
            </div>
          </div>
        )}

        {tab === 'studies' && (
          <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
            {canCreateStudy && (
              <form onSubmit={saveStudy} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SectionHeading title={editingStudy ? 'Editar estudio' : 'Nuevo estudio'} subtitle="Laboratorio e imagenología en una sola vista cronológica." />
                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm font-medium">Categoría<select value={studyForm.category} onChange={(event) => { const category = event.target.value as 'LABORATORY' | 'IMAGING'; setStudyForm({ ...studyForm, category, studyType: category === 'LABORATORY' ? 'Examen de laboratorio' : 'Ultrasonido' }); }} disabled={isLaboratory} className="h-10 rounded-md border bg-white px-3 disabled:bg-slate-100 dark:bg-slate-950"><option value="LABORATORY">Laboratorio</option><option value="IMAGING">Imagenología</option></select></label>
                  {studyForm.category === 'IMAGING' ? (
                    <label className="grid gap-1 text-sm font-medium">Tipo de estudio<select value={studyForm.studyType} onChange={(event) => setStudyForm({ ...studyForm, studyType: event.target.value })} className="h-10 rounded-md border bg-white px-3 dark:bg-slate-950">{imagingTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                  ) : <Input label="Examen de laboratorio" value={studyForm.studyType} onChange={(value) => setStudyForm({ ...studyForm, studyType: value })} required />}
                  <Input label="Fecha y hora" type="datetime-local" value={studyForm.studyDate} onChange={(value) => setStudyForm({ ...studyForm, studyDate: value })} required />
                  <Area label="Resultados" value={studyForm.results} onChange={(value) => setStudyForm({ ...studyForm, results: value })} rows={7} />
                  <Area label="Observaciones" value={studyForm.observations} onChange={(value) => setStudyForm({ ...studyForm, observations: value })} />
                  <FilePicker onChange={setStudyFiles} />
                </div>
                <div className="mt-4 flex gap-2">
                  <PrimaryButton saving={saving} label={editingStudy ? 'Guardar cambios' : 'Guardar estudio'} />
                  {editingStudy && <button type="button" onClick={() => { setEditingStudy(null); setStudyForm(studyEmpty); }} className="h-10 rounded-md border px-4 text-sm">Cancelar</button>}
                </div>
              </form>
            )}
            <Timeline
              title="Estudios"
              empty="No hay estudios registrados."
              action={isAdmin ? <ArchivedToggle checked={includeArchived} onChange={setIncludeArchived} /> : undefined}
            >
              {studies.map((item) => {
                const labCanEdit = isLaboratory && item.createdByRole === 'LABORATORY';
                return (
                  <article key={item.id} className={`rounded-lg border p-4 ${item.status === 'ARCHIVED' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">{item.category === 'LABORATORY' ? 'Laboratorio' : 'Imagenología'}</span>
                        <h3 className="mt-2 font-semibold">{item.studyType}</h3>
                        <p className="text-sm text-slate-500">{dateTime(item.studyDate)} · {item.doctor.fullName}</p>
                      </div>
                      {(isAdmin || labCanEdit) && (
                        <AdminActions
                          archived={item.status === 'ARCHIVED'}
                          canArchive={isAdmin}
                          onEdit={() => { setEditingStudy(item); setStudyForm({ category: item.category, studyType: item.studyType, studyDate: localDateTime(item.studyDate), results: item.results ?? '', observations: item.observations ?? '' }); }}
                          onArchive={() => promptAction(`/api/medical-records/studies/${item.id}/archive`, 'Motivo para archivar el estudio:', 'Estudio archivado.')}
                          onRestore={() => void action(`/api/medical-records/studies/${item.id}/restore`, 'Restauración administrativa', 'Estudio restaurado.')}
                        />
                      )}
                    </div>
                    {item.results && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Resultados:</strong><br />{item.results}</p>}
                    {item.observations && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600"><strong>Observaciones:</strong> {item.observations}</p>}
                    <AttachmentList items={item.attachments} onOpen={openAttachment} />
                  </article>
                );
              })}
            </Timeline>
          </div>
        )}
      </div>
    </ClinicalShell>
  );

  function promptAction(path: string, prompt: string, success: string) {
    const reason = window.prompt(prompt);
    if (reason?.trim()) void action(path, reason, success);
  }
}

function HistoryArea({
  label,
  field,
  value,
  setForm,
  disabled,
  required,
  rows = 4,
}: {
  label: string;
  field: keyof typeof historyEmpty;
  value: string;
  setForm: React.Dispatch<React.SetStateAction<typeof historyEmpty>>;
  disabled: boolean;
  required?: boolean;
  rows?: number;
}) {
  return <Area label={label} value={value} onChange={(next) => setForm((current) => ({ ...current, [field]: next }))} disabled={disabled} required={required} rows={rows} />;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>;
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${active ? 'bg-clinic-teal text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{label}</button>;
}

function Timeline({ title, empty, children, action }: { title: string; empty: string; children: React.ReactNode; action?: React.ReactNode }) {
  const count = Array.isArray(children) ? children.length : 0;
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{action}</div>
      <div className="grid gap-3">{count ? children : <Empty text={empty} />}</div>
    </section>
  );
}

function OrderTimeline({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const count = Array.isArray(children) ? children.length : 0;
  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"><h2 className="mb-4 font-semibold">{title}</h2><div className="grid gap-3">{count ? children : <Empty text={empty} />}</div></section>;
}

function OrderPdfActions({
  disabled,
  onPreview,
  onDownload,
  onPrint,
  onDelete,
}: {
  disabled?: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button disabled={disabled} onClick={onPreview} className="rounded-md border p-2 disabled:opacity-40" title="Ver orden"><Eye className="h-4 w-4" /></button>
      <button disabled={disabled} onClick={onDownload} className="rounded-md border p-2 disabled:opacity-40" title="Descargar PDF"><Download className="h-4 w-4" /></button>
      <button disabled={disabled} onClick={onPrint} className="rounded-md border p-2 disabled:opacity-40" title="Imprimir"><Printer className="h-4 w-4" /></button>
      {onDelete && <button onClick={onDelete} className="rounded-md border border-red-200 p-2 text-red-700" title="Eliminar definitivamente"><Trash2 className="h-4 w-4" /></button>}
    </div>
  );
}

function AdminActions({ archived, onEdit, onArchive, onRestore, canArchive = true }: { archived: boolean; onEdit: () => void; onArchive: () => void; onRestore: () => void; canArchive?: boolean }) {
  if (archived) return <button onClick={onRestore} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold"><RotateCcw className="h-3.5 w-3.5" />Restaurar</button>;
  return (
    <div className="flex gap-1">
      <button onClick={onEdit} className="rounded-md border p-2" title="Editar"><Pencil className="h-4 w-4" /></button>
      {canArchive && <button onClick={onArchive} className="rounded-md border border-red-200 p-2 text-red-700" title="Eliminar de la vista activa"><Trash2 className="h-4 w-4" /></button>}
    </div>
  );
}

function ArchivedToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />Mostrar archivados</label>;
}

function AttachmentList({ items, onOpen }: { items: Attachment[]; onOpen: (item: Attachment) => void }) {
  if (!items.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <button key={item.id} onClick={() => void onOpen(item)} className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs"><FileDown className="h-3.5 w-3.5" />{item.fileName}</button>)}</div>;
}

function FilePicker({ onChange }: { onChange: (files: File[]) => void }) {
  return <label className="grid gap-1 text-sm font-medium">Adjuntos opcionales<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Array.from(event.target.files ?? []))} className="rounded-md border bg-white p-2 text-sm dark:bg-slate-950" /><span className="text-xs font-normal text-slate-500">PDF, JPG o PNG. Máximo 30 MB por archivo.</span></label>;
}

function Input({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-white px-3 outline-none focus:border-clinic-teal dark:bg-slate-950" /></label>;
}

function Area({ label, value, onChange, rows = 4, disabled, required }: { label: string; value: string; onChange: (value: string) => void; rows?: number; disabled?: boolean; required?: boolean }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<textarea value={value} required={required} disabled={disabled} rows={rows} onChange={(event) => onChange(event.target.value)} className="rounded-md border bg-white px-3 py-2 leading-6 outline-none focus:border-clinic-teal disabled:bg-slate-50 disabled:text-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900" /></label>;
}

function PrimaryButton({ saving, label }: { saving: boolean; label: string }) {
  return <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Guardando...' : label}</button>;
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div><span className="text-xs text-slate-500">{label}</span><p>{value || 'No registrado'}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">{text}</div>;
}

function historyFromRecord(record: MedicalRecord) {
  return {
    reasonForVisit: record.reasonForVisit ?? record.chiefComplaint ?? '',
    currentIllness: record.currentIllness ?? '',
    personalPathologicalHistory: record.personalPathologicalHistory ?? '',
    surgicalHistory: record.surgicalHistory ?? '',
    familyHistory: record.familyHistory ?? '',
    allergicHistory: record.allergicHistory ?? '',
    currentMedications: record.currentMedications ?? '',
    toxicHabits: record.toxicHabits ?? '',
    reviewOfSystems: record.reviewOfSystems ?? '',
    physicalExam: record.physicalExam?.otherFindings ?? '',
    diagnosisText: record.diagnosisText ?? '',
    treatmentPlan: record.treatmentPlan ?? '',
  };
}

function localDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dateTime(value: string) {
  return new Date(value).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
}

function age(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) years -= 1;
  return Math.max(0, years);
}

function genderLabel(value: string) {
  return { FEMALE: 'Femenino', MALE: 'Masculino', OTHER: 'Otro', UNKNOWN: 'No registrado' }[value] ?? value;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
