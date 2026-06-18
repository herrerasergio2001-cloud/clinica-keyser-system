"use client";

import Link from 'next/link';
import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import {
  AlertTriangle,
  Baby,
  Brain,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  HeartPulse,
  ImageIcon,
  Loader2,
  Mail,
  MapPinned,
  MessageCircle,
  Paperclip,
  Pill,
  Plus,
  Printer,
  Save,
  Search,
  ShieldPlus,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  Upload,
  X,
} from 'lucide-react';
import { ClinicalShell, Field, SectionTitle } from './clinical-shell';
import { samplePatient, sampleRecord } from './sample-data';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const tabs = [
  'Evoluciones',
  'Información',
  'Signos vitales',
  'Procedimientos',
  'Expedientes',
  'Imágenes',
  'Recetas',
  'Laboratorio',
] as const;

type Tab = string;
type SaveStatus = 'idle' | 'loading' | 'success' | 'error';

type RecordForm = {
  patientId: string;
  recordId: string;
  consultationDate: string;
  reasonForVisit: string;
  chiefComplaint: string;
  currentIllness: string;
  personalPathologicalHistory: string;
  personalNonPathologicalHistory: string;
  surgicalHistory: string;
  traumaticHistory: string;
  allergicHistory: string;
  currentMedications: string;
  familyHistory: string;
  gynecologicalObstetricHistory: string;
  toxicHabits: string;
  reviewOfSystems: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  generalAppearance: string;
  heent: string;
  cardiovascular: string;
  respiratory: string;
  abdomen: string;
  extremities: string;
  neurological: string;
  mainDiagnosis: string;
  secondaryDiagnoses: string;
  icd10Code: string;
  medicationName: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
  requestedLabTests: string;
  requestedImagingStudies: string;
  recommendations: string;
  followUp: string;
  noteDate: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  status: 'DRAFT' | 'COMPLETED' | 'ARCHIVED';
  urgentFollowUp: boolean;
  vaccineName: string;
  vaccineDate: string;
  vaccineNextDose: string;
  vaccineLot: string;
  vaccineObservations: string;
  lastPeriodDate: string;
  dueDate: string;
  gestationalAge: string;
  gestations: string;
  births: string;
  abortions: string;
  cesareans: string;
  fetalMovements: string;
  maternalWeight: string;
  uterineHeight: string;
  fetalHeartRate: string;
  pregnancyObservations: string;
  pregnancyAlerts: string;
  bodyView: 'anterior' | 'posterior';
  bodyLayer: string;
  bodyRegion: string;
  bodyDescription: string;
  bodyRelatedDiagnosis: string;
  bodyPain: boolean;
  bodyInflammation: boolean;
  bodyLesion: boolean;
  bodyMass: boolean;
  bodyFunctionalLimitation: boolean;
  bodyImageUrl: string;
  toothNumber: string;
  toothStatus: string;
  dentalDescription: string;
  dentalProcedure: string;
  dentalObservations: string;
  labOrderType: string;
  labPriority: string;
  labReason: string;
  imagingStudyType: string;
  imagingPriority: string;
  imagingReason: string;
  documentType: string;
  documentTitle: string;
  documentContent: string;
  aiPrompt: string;
  aiDraft: string;
};

type UploadItem = {
  id?: string;
  name: string;
  type: string;
  status?: 'pending' | 'saved';
  previewUrl?: string;
};

type PatientSummary = {
  id: string;
  patientCode?: string;
  fullName?: string;
  birthDate?: string;
  gender?: string;
  idNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  photoUrl?: string;
  assignedDoctor?: { fullName?: string };
  appointments?: ApiRecord[];
  occupation?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
};

type ApiRecord = Record<string, any>;
type DocumentKind = 'prescription' | 'lab' | 'image' | 'certificate' | 'incapacity' | 'consent' | 'history';

const initialForm = (patientId: string, recordId?: string): RecordForm => ({
  patientId,
  recordId: recordId ?? '',
  consultationDate: sampleRecord.consultationDate,
  reasonForVisit: sampleRecord.reasonForVisit,
  chiefComplaint: sampleRecord.chiefComplaint,
  currentIllness: sampleRecord.currentIllness,
  personalPathologicalHistory: 'Hipertensión arterial diagnosticada hace 3 años.',
  personalNonPathologicalHistory: 'Niega tabaco. Cafe ocasional.',
  surgicalHistory: 'Cesarea en 2015.',
  traumaticHistory: '',
  allergicHistory: samplePatient.allergies,
  currentMedications: 'Losartan 50 mg diario.',
  familyHistory: 'Madre con diabetes mellitus tipo 2.',
  gynecologicalObstetricHistory: 'G2P2A0.',
  toxicHabits: 'Cafe ocasional. Niega alcohol y tabaco.',
  reviewOfSystems: 'Niega dolor toracico, disnea o sintomas neurologicos focales.',
  bloodPressure: '145/90',
  heartRate: '82',
  respiratoryRate: '18',
  temperature: '36.7',
  oxygenSaturation: '98',
  weight: '72.5',
  height: '1.62',
  generalAppearance: 'Paciente alerta, orientada e hidratada.',
  heent: 'Pupilas isocoricas, mucosas hidratadas.',
  cardiovascular: 'Ruidos cardiacos ritmicos, sin soplos.',
  respiratory: 'Murmullo vesicular conservado.',
  abdomen: 'Blando, depresible, no doloroso.',
  extremities: 'Sin edema.',
  neurological: 'Sin deficit neurologico focal.',
  mainDiagnosis: sampleRecord.diagnosis,
  secondaryDiagnoses: 'Cefalea tensional',
  icd10Code: sampleRecord.icd10,
  medicationName: 'Losartan',
  dose: '50 mg',
  route: 'VO',
  frequency: 'Cada 12 horas',
  duration: '30 dias',
  instructions: 'Tomar con agua y registrar presion arterial.',
  requestedLabTests: 'Creatinina, potasio, perfil lipidico.',
  requestedImagingStudies: '',
  recommendations: 'Dieta baja en sal y actividad fisica moderada.',
  followUp: 'Control en 4 semanas.',
  noteDate: sampleRecord.consultationDate,
  subjective: 'Refiere cefalea leve intermitente.',
  objective: 'PA 145/90, sin signos de alarma.',
  assessment: 'Hipertension en seguimiento.',
  plan: 'Ajuste terapeutico y control.',
  status: 'DRAFT',
  urgentFollowUp: false,
  vaccineName: 'Influenza',
  vaccineDate: sampleRecord.consultationDate,
  vaccineNextDose: '',
  vaccineLot: '',
  vaccineObservations: '',
  lastPeriodDate: '',
  dueDate: '',
  gestationalAge: '',
  gestations: '',
  births: '',
  abortions: '',
  cesareans: '',
  fetalMovements: '',
  maternalWeight: '',
  uterineHeight: '',
  fetalHeartRate: '',
  pregnancyObservations: '',
  pregnancyAlerts: '',
  bodyView: 'anterior',
  bodyLayer: 'Superficie corporal',
  bodyRegion: 'Tórax',
  bodyDescription: '',
  bodyRelatedDiagnosis: '',
  bodyPain: false,
  bodyInflammation: false,
  bodyLesion: false,
  bodyMass: false,
  bodyFunctionalLimitation: false,
  bodyImageUrl: '',
  toothNumber: '11',
  toothStatus: 'Caries',
  dentalDescription: '',
  dentalProcedure: '',
  dentalObservations: '',
  labOrderType: 'Biometría hemática completa',
  labPriority: 'ROUTINE',
  labReason: '',
  imagingStudyType: 'Ultrasonido',
  imagingPriority: 'ROUTINE',
  imagingReason: '',
  documentType: 'Constancia',
  documentTitle: 'Constancia médica',
  documentContent: '',
  aiPrompt: '',
  aiDraft: '',
});

export function ExpedienteEditor({ patientId, recordId, mode }: { patientId: string; recordId?: string; mode: 'dashboard' | 'new' | 'edit' }) {
  const [activeTab, setActiveTab] = useState<Tab>('Evoluciones');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personales: true,
    familiares: true,
    gineco: false,
    habitos: false,
    sistemas: false,
  });
  const [form, setForm] = useState<RecordForm>(() => initialForm(patientId, recordId));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading'>('idle');
  const [message, setMessage] = useState('');
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [patient, setPatient] = useState<PatientSummary>(() => ({ ...samplePatient, id: patientId }));
  const [recordHistory, setRecordHistory] = useState<ApiRecord[]>([]);
  const [clinicalEvents, setClinicalEvents] = useState<ApiRecord[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [documentKind, setDocumentKind] = useState<DocumentKind | null>(null);
  const [signedPreview, setSignedPreview] = useState(false);

  const bmi = useMemo(() => {
    const weight = Number(form.weight);
    const height = Number(form.height);
    if (!weight || !height) return '';
    return (weight / (height * height)).toFixed(2);
  }, [form.weight, form.height]);

  const clinicalCalculations = useMemo(() => {
    const weight = Number(form.weight);
    const height = Number(form.height);
    const systolic = Number(form.bloodPressure.split('/')[0]);
    const diastolic = Number(form.bloodPressure.split('/')[1]);
    const bsa = weight && height ? Math.sqrt((height * 100 * weight) / 3600).toFixed(2) : '';
    const pressureLevel =
      systolic >= 180 || diastolic >= 120
        ? 'Crisis hipertensiva'
        : systolic >= 140 || diastolic >= 90
          ? 'Hipertensión etapa 2'
          : systolic >= 130 || diastolic >= 80
            ? 'Hipertensión etapa 1'
            : systolic >= 120
              ? 'Elevada'
              : systolic
                ? 'Normal'
                : 'Pendiente';
    const saturation = Number(form.oxygenSaturation);
    const saturationLabel = saturation >= 95 ? 'Normal' : saturation >= 90 ? 'Vigilar' : saturation ? 'Baja' : 'Pendiente';
    const pediatricHint = ageNumber(patient.birthDate) < 18 ? 'Pediátrico: revisar percentiles según edad y talla.' : 'Adulto';
    return { bsa, pressureLevel, saturationLabel, pediatricHint };
  }, [form.bloodPressure, form.height, form.oxygenSaturation, form.weight, patient.birthDate]);

  useEffect(() => {
    if (!form.lastPeriodDate) return;
    const fur = new Date(form.lastPeriodDate);
    if (Number.isNaN(fur.getTime())) return;
    const dueDate = new Date(fur);
    dueDate.setDate(dueDate.getDate() + 280);
    const days = Math.max(0, Math.floor((Date.now() - fur.getTime()) / 86400000));
    const gestationalAge = `${Math.floor(days / 7)} sem ${days % 7} días`;
    setForm((current) => ({ ...current, dueDate: dueDate.toISOString().slice(0, 10), gestationalAge }));
  }, [form.lastPeriodDate]);

  const showToast = useCallback((tone: 'success' | 'error' | 'info', text: string) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const updateField = (field: keyof RecordForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  };

  const authHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const validate = () => {
    if (!form.patientId) return 'Seleccione un paciente';
    if (!form.reasonForVisit.trim()) return 'Ingrese motivo de consulta';
    if (form.status === 'COMPLETED' && !form.mainDiagnosis.trim()) return 'Ingrese diagnóstico antes de completar el expediente';
    return '';
  };

  const payload = () => ({
    patientId: form.patientId,
    consultationDate: form.consultationDate,
    reasonForVisit: form.reasonForVisit,
    chiefComplaint: form.chiefComplaint || form.reasonForVisit,
    currentIllness: form.currentIllness,
    personalPathologicalHistory: form.personalPathologicalHistory,
    personalNonPathologicalHistory: form.personalNonPathologicalHistory,
    surgicalHistory: form.surgicalHistory,
    traumaticHistory: form.traumaticHistory,
    allergicHistory: form.allergicHistory,
    currentMedications: form.currentMedications,
    familyHistory: form.familyHistory,
    gynecologicalObstetricHistory: form.gynecologicalObstetricHistory,
    toxicHabits: form.toxicHabits,
    reviewOfSystems: form.reviewOfSystems,
    recommendations: [form.recommendations, form.followUp, form.urgentFollowUp ? 'Seguimiento marcado como urgente.' : ''].filter(Boolean).join('\n'),
    treatmentPlan: form.instructions,
    status: form.status,
    vitalSigns: {
      bloodPressure: form.bloodPressure,
      heartRate: numberOrUndefined(form.heartRate),
      respiratoryRate: numberOrUndefined(form.respiratoryRate),
      temperature: numberOrUndefined(form.temperature),
      oxygenSaturation: numberOrUndefined(form.oxygenSaturation),
      weight: numberOrUndefined(form.weight),
      height: numberOrUndefined(form.height),
    },
    physicalExam: {
      generalAppearance: form.generalAppearance,
      heent: form.heent,
      cardiovascular: form.cardiovascular,
      respiratory: form.respiratory,
      abdomen: form.abdomen,
      extremities: form.extremities,
      neurological: form.neurological,
    },
    diagnoses: [
      {
        mainDiagnosis: form.mainDiagnosis,
        secondaryDiagnoses: form.secondaryDiagnoses,
        icd10Code: form.icd10Code,
        clinicalImpression: form.assessment,
      },
    ],
    prescriptions: [
      {
        medicationName: form.medicationName,
        dose: form.dose,
        route: form.route,
        frequency: form.frequency,
        duration: form.duration,
        instructions: form.instructions,
        requestedLabTests: form.requestedLabTests,
        requestedImagingStudies: form.requestedImagingStudies,
        nonPharmacologicalRecommendations: form.recommendations,
      },
    ],
  });

  const loadPatientHistory = useCallback(async () => {
    setIsInitialLoading(true);
    setLoadStatus('loading');
    try {
      const [patientResponse, recordsResponse, eventsResponse] = await Promise.all([
        fetch(`${apiBase}/api/patients/${patientId}`, { headers: authHeaders() }),
        fetch(`${apiBase}/api/medical-records/patient/${patientId}`, { headers: authHeaders() }),
        fetch(`${apiBase}/api/clinical-events?patientId=${patientId}`, { headers: authHeaders() }),
      ]);

      if (patientResponse.ok) {
        const loadedPatient = await patientResponse.json();
        setPatient(loadedPatient);
      }

      if (recordsResponse.ok) {
        const records = (await recordsResponse.json()) as ApiRecord[];
        setRecordHistory(records);
        const selectedRecord = recordId ? records.find((record) => record.id === recordId) : records[0];
        if (selectedRecord && mode !== 'new') {
          setForm(recordToForm(patientId, selectedRecord));
          setUploads(attachmentsToUploads(selectedRecord.attachments ?? []));
        } else {
          setForm(initialForm(patientId, recordId));
        }
      }

      if (eventsResponse.ok) {
        setClinicalEvents(await eventsResponse.json());
      }

      setLoadStatus('idle');
    } catch {
      showToast('error', 'No se pudo cargar el expediente');
      setLoadStatus('idle');
    } finally {
      setIsInitialLoading(false);
    }
  }, [authHeaders, mode, patientId, recordId, showToast]);

  useEffect(() => {
    void loadPatientHistory();
  }, [loadPatientHistory]);

  const saveChanges = async (silent = false) => {
    const error = validate();
    if (error) {
      setSaveStatus('error');
      setMessage(error);
      showToast('error', error);
      return;
    }

    setSaveStatus('loading');
    setMessage(silent ? 'Autoguardando...' : 'Guardando...');
    try {
      const targetId = form.recordId || recordId;
      if (!targetId) {
        await createRecord();
        return;
      }
      const optimisticRecord = formToRecordSnapshot(form, patient);
      setRecordHistory((current) => [optimisticRecord, ...current.filter((record) => record.id !== targetId)]);
      const response = await fetch(`${apiBase}/api/medical-records/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload()),
      });
      if (!response.ok) throw new Error('Error al guardar');
      const saved = await response.json();
      setRecordHistory((current) => [saved, ...current.filter((record) => record.id !== saved.id)]);
      await persistEvolutionNote(targetId);
      setDirty(false);
      setSaveStatus('success');
      setMessage('Guardado correctamente');
      if (!silent) showToast('success', 'Guardado correctamente');
    } catch {
      setSaveStatus('error');
      setMessage('Error al guardar');
      if (!silent) showToast('error', 'Error al guardar');
    }
  };

  const createRecord = async () => {
    const error = validate();
    if (error) {
      setSaveStatus('error');
      setMessage(error);
      return;
    }

      setSaveStatus('loading');
      setMessage('Guardando...');
      try {
      const optimisticId = `optimistic-${Date.now()}`;
      setRecordHistory((current) => [{ ...formToRecordSnapshot(form, patient), id: optimisticId, recordNumber: 'Nuevo expediente' }, ...current]);
      const response = await fetch(`${apiBase}/api/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload()),
      });
      if (!response.ok) throw new Error('Error al crear');
      const created = await response.json();
      setForm((current) => ({ ...current, recordId: created.id ?? current.recordId }));
      setRecordHistory((current) => [created, ...current.filter((record) => record.id !== optimisticId)]);
      await persistEvolutionNote(created.id);
      setDirty(false);
      setSaveStatus('success');
      setMessage('Guardado correctamente');
      showToast('success', 'Expediente creado');
    } catch {
      setSaveStatus('error');
      setMessage('Error al guardar');
      showToast('error', 'Error al guardar');
    }
  };

  const persistEvolutionNote = async (targetId: string) => {
    if (![form.subjective, form.objective, form.assessment, form.plan].some((value) => value.trim())) return;
    await fetch(`${apiBase}/api/medical-records/${targetId}/evolution-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        noteDate: form.noteDate,
        subjective: form.subjective,
        objective: form.objective,
        assessment: form.assessment,
        plan: form.plan,
      }),
    });
  };

  const targetRecordId = form.recordId || recordId || '';

  const postClinicalResource = async (path: string, body: Record<string, unknown>, success: string) => {
    if (!targetRecordId) {
      showToast('error', 'Guarda o crea el expediente antes de agregar este registro');
      return;
    }
    setLoadStatus('loading');
    try {
      const response = await fetch(`${apiBase}/api/medical-records/${targetRecordId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('No se pudo guardar');
      const created = await response.json();
      const keyByPath: Record<string, string> = {
        vaccines: 'vaccineRecords',
        'pregnancy-control': 'pregnancyControls',
        'body-map': 'bodyMapFindings',
        'dental-chart': 'dentalFindings',
        'lab-orders': 'labOrders',
        'imaging-orders': 'imagingOrders',
        documents: 'clinicalDocuments',
      };
      const key = keyByPath[path];
      if (key) {
        setRecordHistory((current) =>
          current.map((record) => (record.id === targetRecordId ? { ...record, [key]: [created, ...(record[key] ?? [])] } : record)),
        );
      }
      showToast('success', success);
    } catch {
      showToast('error', 'No se pudo guardar');
    } finally {
      setLoadStatus('idle');
    }
  };

  const activeRecord = useMemo(() => recordHistory.find((record) => record.id === targetRecordId) ?? recordHistory[0] ?? {}, [recordHistory, targetRecordId]);
  const timelineEvents = useMemo(() => buildTimelineEvents(clinicalEvents, recordHistory, patient), [clinicalEvents, recordHistory, patient]);

  const openDocument = (kind: DocumentKind) => {
    setDocumentKind(kind);
    setIsTemplateOpen(false);
    setIsMasterOpen(false);
  };

  const saveLiveDocument = async () => {
    if (!documentKind) return;
    setLoadStatus('loading');
    try {
      const common = { patientId, medicalRecordId: targetRecordId || undefined };
      const body =
        documentKind === 'prescription'
          ? { ...common, diagnosis: form.mainDiagnosis, recommendationsGeneral: form.recommendations, items: [{ medicationName: form.medicationName || 'Medicamento', dose: form.dose, route: form.route, frequency: form.frequency, duration: form.duration, instructions: form.instructions }] }
          : documentKind === 'lab'
            ? { ...common, diagnosis: form.mainDiagnosis, reason: form.labReason || form.reasonForVisit, observations: form.requestedLabTests, exams: [form.labOrderType, form.requestedLabTests].filter(Boolean) }
            : documentKind === 'image'
              ? { ...common, studyType: form.imagingStudyType, imagingType: form.imagingStudyType, anatomyRegion: form.bodyRegion, clinicalReason: form.imagingReason || form.reasonForVisit, presumptiveDiagnosis: form.mainDiagnosis, observations: form.requestedImagingStudies }
              : documentKind === 'consent'
                ? { ...common, procedureName: form.documentTitle || 'Procedimiento clínico', title: form.documentTitle || 'Consentimiento informado', content: form.documentContent || 'Declaro haber recibido información clara sobre el procedimiento indicado.', risks: 'Riesgos explicados al paciente.', alternatives: 'Alternativas explicadas al paciente.', patientAgreement: true }
                : { ...common, documentType: documentKind === 'incapacity' ? 'INCAPACIDAD' : documentKind === 'history' ? 'HISTORIA_CLINICA' : 'CERTIFICATE', title: form.documentTitle || documentTitle(documentKind), content: form.documentContent || printableClinicalSummary(form, patient), diagnosis: form.mainDiagnosis, restDays: documentKind === 'incapacity' ? 1 : undefined };
      const endpoint =
        documentKind === 'prescription'
          ? '/api/prescriptions'
          : documentKind === 'lab'
            ? '/api/lab-orders-external'
            : documentKind === 'image'
              ? '/api/imaging-orders'
              : documentKind === 'consent'
                ? '/api/consents'
                : '/api/documents/certificates';
      const response = await fetch(`${apiBase}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('No se pudo guardar');
      const saved = await response.json();
      if (saved.clinicalEvent) setClinicalEvents((current) => [saved.clinicalEvent, ...current]);
      showToast('success', 'Documento guardado en la línea de tiempo');
      setDocumentKind(null);
      await loadPatientHistory();
    } catch {
      showToast('error', 'No se pudo guardar el documento');
    } finally {
      setLoadStatus('idle');
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const targetId = form.recordId || recordId;
      if (dirty && targetId && saveStatus !== 'loading') void saveChanges(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [dirty, form.recordId, recordId, saveStatus]);

  const uploadFiles = async () => {
    const targetId = form.recordId || recordId;
    if (!targetId || selectedFiles.length === 0) return;
    setLoadStatus('loading');
    setMessage('Cargando...');
    const optimisticUploads = selectedFiles.map((file) => ({
      id: `pending-${file.name}-${Date.now()}`,
      name: file.name,
      type: file.type,
      status: 'pending' as const,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setUploads((current) => [...optimisticUploads, ...current]);
    try {
      const savedUploads: UploadItem[] = [];
      for (const file of selectedFiles) {
        const data = new FormData();
        data.append('file', file);
        data.append('description', file.name);
        const response = await fetch(`${apiBase}/api/medical-records/${targetId}/attachments`, {
          method: 'POST',
          headers: authHeaders(),
          body: data,
        });
        if (!response.ok) throw new Error('Upload failed');
        const saved = await response.json();
        savedUploads.push(attachmentToUpload(saved));
      }
      setUploads((current) => [...savedUploads, ...current.filter((file) => file.status !== 'pending')]);
      setSelectedFiles([]);
      setLoadStatus('idle');
      setMessage('Guardado correctamente');
      showToast('success', 'Archivos guardados');
    } catch {
      setLoadStatus('idle');
      setSaveStatus('error');
      setMessage('Error al guardar');
      setUploads((current) => current.filter((file) => file.status !== 'pending'));
      showToast('error', 'Error al guardar archivos');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type));
    setSelectedFiles(accepted);
    setUploads(
      accepted.map((file) => ({
        name: file.name,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })),
    );
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const statusClass =
    saveStatus === 'success' ? 'text-clinic-teal' : saveStatus === 'error' ? 'text-red-600' : 'text-slate-500 dark:text-slate-300';
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab === activeTab));
  const goToTab = (offset: number) => setActiveTab(tabs[Math.min(tabs.length - 1, Math.max(0, activeIndex + offset))]);

  return (
    <ClinicalShell title={`Expediente de ${patient.fullName ?? samplePatient.fullName}`} subtitle={`Paciente ${patient.patientCode ?? samplePatient.patientCode}`}>
      <div className="grid gap-5 p-6">
        {toast && (
          <div
            className={`fixed right-5 top-5 z-50 rounded-md px-4 py-3 text-sm font-medium shadow-lg ${
              toast.tone === 'success' ? 'bg-teal-600 text-white' : toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {toast.text}
          </div>
        )}
        <div className="grid gap-5">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expediente clínico</p>
                <p className="text-sm font-medium">{patient.fullName ?? samplePatient.fullName} · {patient.patientCode ?? samplePatient.patientCode}</p>
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-950">PA {form.bloodPressure || '-'} · IMC {bmi || '-'}</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-md border px-3 py-2 text-left text-sm ${
                  activeTab === tab
                    ? 'border-clinic-teal bg-teal-50 text-clinic-teal dark:bg-teal-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-clinic-teal hover:text-clinic-teal dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={activeIndex === 0} onClick={() => goToTab(-1)} className="h-9 rounded-md border border-slate-200 text-sm disabled:opacity-50 dark:border-slate-700">Anterior</button>
              <button type="button" disabled={activeIndex === tabs.length - 1} onClick={() => goToTab(1)} className="h-9 rounded-md border border-slate-200 text-sm disabled:opacity-50 dark:border-slate-700">Siguiente</button>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`text-sm ${statusClass}`}>{loadStatus === 'loading' ? 'Cargando...' : message}</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={createRecord} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-100">
                  <FilePlus2 className="h-4 w-4" />
                  Crear nuevo expediente
                </button>
                <button type="button" onClick={() => void saveChanges()} disabled={saveStatus === 'loading'} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white disabled:opacity-70">
                  {saveStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saveStatus === 'loading' ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>

        {isInitialLoading && <LoadingSkeleton />}

        {!isInitialLoading && activeTab === 'Información' && <PatientTab patientId={patientId} patient={patient} records={recordHistory} />}
        {!isInitialLoading && activeTab === 'Información' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Consulta actual y antecedentes" icon={Stethoscope} />
            <div className="grid gap-4">
              <ControlledTextArea label="Motivo de consulta" value={form.reasonForVisit} onChange={(value) => updateField('reasonForVisit', value)} />
              <ControlledTextArea label="Enfermedad actual" value={form.currentIllness} onChange={(value) => updateField('currentIllness', value)} />
              <Accordion title="Antecedentes personales" open={openSections.personales} onToggle={() => toggleSection('personales', setOpenSections)}>
                <QuickChecks title="Tags clínicas" items={['Diabetes', 'Hipertensión', 'Asma', 'Cardiopatía', 'Renal crónico']} onPick={(tag) => updateField('personalPathologicalHistory', appendTag(form.personalPathologicalHistory, tag))} />
                <ControlledTextArea label="Patológicos" value={form.personalPathologicalHistory} onChange={(value) => updateField('personalPathologicalHistory', value)} />
                <ControlledTextArea label="Quirúrgicos" value={form.surgicalHistory} onChange={(value) => updateField('surgicalHistory', value)} />
                <ControlledTextArea label="Traumáticos" value={form.traumaticHistory} onChange={(value) => updateField('traumaticHistory', value)} />
                <ControlledTextArea label="Alergias" value={form.allergicHistory} onChange={(value) => updateField('allergicHistory', value)} />
                <ControlledTextArea label="Medicamentos actuales" value={form.currentMedications} onChange={(value) => updateField('currentMedications', value)} />
              </Accordion>
              <Accordion title="Antecedentes familiares" open={openSections.familiares} onToggle={() => toggleSection('familiares', setOpenSections)}>
                <ControlledTextArea label="Familiares" value={form.familyHistory} onChange={(value) => updateField('familyHistory', value)} />
              </Accordion>
              <Accordion title="Antecedentes gineco-obstétricos" open={openSections.gineco} onToggle={() => toggleSection('gineco', setOpenSections)}>
                <QuickChecks title="Atajos" items={['Embarazo actual', 'Planificación', 'Menopausia', 'Cesárea previa']} onPick={(tag) => updateField('gynecologicalObstetricHistory', appendTag(form.gynecologicalObstetricHistory, tag))} />
                <ControlledTextArea label="Gineco-obstétricos" value={form.gynecologicalObstetricHistory} onChange={(value) => updateField('gynecologicalObstetricHistory', value)} />
              </Accordion>
              <Accordion title="Hábitos" open={openSections.habitos} onToggle={() => toggleSection('habitos', setOpenSections)}>
                <ControlledTextArea label="Hábitos tóxicos" value={form.toxicHabits} onChange={(value) => updateField('toxicHabits', value)} />
              </Accordion>
              <Accordion title="Revisión por sistemas" open={openSections.sistemas} onToggle={() => toggleSection('sistemas', setOpenSections)}>
                <ControlledTextArea label="Revisión por sistemas" value={form.reviewOfSystems} onChange={(value) => updateField('reviewOfSystems', value)} />
              </Accordion>
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Signos vitales' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Signos vitales" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ControlledInput label="Presión arterial" value={form.bloodPressure} onChange={(value) => updateField('bloodPressure', value)} />
              <ControlledInput label="Frecuencia cardiaca" type="number" value={form.heartRate} onChange={(value) => updateField('heartRate', value)} />
              <ControlledInput label="Frecuencia respiratoria" type="number" value={form.respiratoryRate} onChange={(value) => updateField('respiratoryRate', value)} />
              <ControlledInput label="Temperatura" type="number" value={form.temperature} onChange={(value) => updateField('temperature', value)} />
              <ControlledInput label="Saturación O2" type="number" value={form.oxygenSaturation} onChange={(value) => updateField('oxygenSaturation', value)} />
              <ControlledInput label="Peso kg" type="number" value={form.weight} onChange={(value) => updateField('weight', value)} />
              <ControlledInput label="Talla m" type="number" value={form.height} onChange={(value) => updateField('height', value)} />
              <Field label="IMC automático" value={bmi || 'Pendiente'} />
              <Field label="Superficie corporal" value={clinicalCalculations.bsa ? `${clinicalCalculations.bsa} m²` : 'Pendiente'} />
              <Field label="Nivel presión" value={clinicalCalculations.pressureLevel} />
              <Field label="Saturación" value={clinicalCalculations.saturationLabel} />
              <Field label="Percentil pediátrico" value={clinicalCalculations.pediatricHint} />
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Procedimientos' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Examen físico por sistemas" />
            <div className="grid gap-4 lg:grid-cols-2">
              <ControlledTextArea label="General" value={form.generalAppearance} onChange={(value) => updateField('generalAppearance', value)} />
              <ControlledTextArea label="HEENT" value={form.heent} onChange={(value) => updateField('heent', value)} />
              <ControlledTextArea label="Cardiovascular" value={form.cardiovascular} onChange={(value) => updateField('cardiovascular', value)} />
              <ControlledTextArea label="Respiratorio" value={form.respiratory} onChange={(value) => updateField('respiratory', value)} />
              <ControlledTextArea label="Abdomen" value={form.abdomen} onChange={(value) => updateField('abdomen', value)} />
              <ControlledTextArea label="Extremidades" value={form.extremities} onChange={(value) => updateField('extremities', value)} />
              <ControlledTextArea label="Neurológico" value={form.neurological} onChange={(value) => updateField('neurological', value)} />
            </div>
            <div className="mt-5">
              <BodyMapPanel form={form} updateField={updateField} items={activeRecord.bodyMapFindings ?? []} onSave={() => postClinicalResource('body-map', bodyMapPayload(form), 'Hallazgo corporal guardado')} embedded />
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Procedimientos' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Diagnósticos CIE-10" icon={Search} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Cie10Search onPick={(code, diagnosis) => {
                updateField('icd10Code', code);
                updateField('mainDiagnosis', diagnosis);
              }} />
              <ControlledInput label="Diagnóstico principal" value={form.mainDiagnosis} onChange={(value) => updateField('mainDiagnosis', value)} />
              <ControlledInput label="Código ICD10" value={form.icd10Code} onChange={(value) => updateField('icd10Code', value)} />
              <ControlledTextArea label="Diagnósticos secundarios" value={form.secondaryDiagnoses} onChange={(value) => updateField('secondaryDiagnoses', value)} />
              <ControlledSelect label="Estado" value={form.status} onChange={(value) => updateField('status', value as RecordForm['status'])} />
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Recetas' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Tratamiento y órdenes" icon={Pill} />
            <div className="grid gap-4 lg:grid-cols-2">
              <QuickChecks title="Plantillas rápidas" items={['Acetaminofén 500 mg VO c/8h por 3 días', 'Ibuprofeno 400 mg VO c/8h por 3 días', 'Suero oral según tolerancia']} onPick={(tag) => updateField('instructions', appendTag(form.instructions, tag))} />
              <ControlledInput label="Medicamento" value={form.medicationName} onChange={(value) => updateField('medicationName', value)} />
              <ControlledInput label="Dosis" value={form.dose} onChange={(value) => updateField('dose', value)} />
              <ControlledInput label="Vía" value={form.route} onChange={(value) => updateField('route', value)} />
              <ControlledInput label="Frecuencia" value={form.frequency} onChange={(value) => updateField('frequency', value)} />
              <ControlledInput label="Duración" value={form.duration} onChange={(value) => updateField('duration', value)} />
              <ControlledTextArea label="Indicaciones" value={form.instructions} onChange={(value) => updateField('instructions', value)} />
              <ControlledTextArea label="Órdenes de laboratorio" value={form.requestedLabTests} onChange={(value) => updateField('requestedLabTests', value)} />
              <ControlledTextArea label="Órdenes de imágenes" value={form.requestedImagingStudies} onChange={(value) => updateField('requestedImagingStudies', value)} />
              <ControlledTextArea label="Recomendaciones" value={form.recommendations} onChange={(value) => updateField('recommendations', value)} />
              <ControlledTextArea label="Seguimiento" value={form.followUp} onChange={(value) => updateField('followUp', value)} />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={form.urgentFollowUp} onChange={(event) => updateField('urgentFollowUp', event.target.checked)} />
                Seguimiento prioritario
              </label>
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Evoluciones' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Línea de tiempo clínica" />
            <ClinicalTimeline events={timelineEvents} />
            <div className="my-6 border-t border-slate-200 dark:border-slate-800" />
            <SectionTitle title="Nueva evolución SOAP" />
            <div className="grid gap-4 lg:grid-cols-2">
              <ControlledInput label="Fecha" type="date" value={form.noteDate} onChange={(value) => updateField('noteDate', value)} />
              <ControlledTextArea label="Subjetivo" value={form.subjective} onChange={(value) => updateField('subjective', value)} />
              <ControlledTextArea label="Objetivo" value={form.objective} onChange={(value) => updateField('objective', value)} />
              <ControlledTextArea label="Análisis" value={form.assessment} onChange={(value) => updateField('assessment', value)} />
              <ControlledTextArea label="Plan" value={form.plan} onChange={(value) => updateField('plan', value)} />
            </div>
            <div className="mt-5 border-l-2 border-clinic-teal pl-4">
              <p className="text-sm font-medium">Línea de tiempo</p>
              {(activeRecord.evolutionNotes?.length ? activeRecord.evolutionNotes : [{ noteDate: form.noteDate, assessment: form.assessment || 'Nueva evolución en edición', doctorName: 'Médico tratante' }]).map((note: ApiRecord, index: number) => (
                <div key={note.id ?? index} className="mt-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-medium">{formatDate(note.noteDate)} · {note.doctorName ?? note.doctor?.fullName ?? 'Médico'}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{note.assessment || note.plan || 'Sin resumen'}</p>
                  {note.id && <a href={`${apiBase}/api/medical-records/evolution-notes/${note.id}/pdf`} className="mt-2 inline-flex items-center gap-1 text-clinic-teal"><Download className="h-3 w-3" />PDF</a>}
                </div>
              ))}
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Laboratorio' && (
          <div className="grid gap-5 xl:grid-cols-2">
            <ClinicalOrderPanel
              title="Órdenes de laboratorio"
              icon={ShieldPlus}
              primaryLabel="Examen"
              primaryValue={form.labOrderType}
              priority={form.labPriority}
              reason={form.labReason}
              items={activeRecord.labOrders ?? []}
              onPrimary={(value) => updateField('labOrderType', value)}
              onPriority={(value) => updateField('labPriority', value)}
              onReason={(value) => updateField('labReason', value)}
              onSave={() => postClinicalResource('lab-orders', { orderType: form.labOrderType, priority: form.labPriority, reason: form.labReason }, 'Orden de laboratorio guardada')}
            />
            <ClinicalOrderPanel
              title="Órdenes de imágenes"
              icon={ImageIcon}
              primaryLabel="Estudio"
              primaryValue={form.imagingStudyType}
              priority={form.imagingPriority}
              reason={form.imagingReason}
              items={activeRecord.imagingOrders ?? []}
              onPrimary={(value) => updateField('imagingStudyType', value)}
              onPriority={(value) => updateField('imagingPriority', value)}
              onReason={(value) => updateField('imagingReason', value)}
              onSave={() => postClinicalResource('imaging-orders', { studyType: form.imagingStudyType, priority: form.imagingPriority, reason: form.imagingReason }, 'Orden de imagen guardada')}
            />
          </div>
        )}
        {!isInitialLoading && activeTab === 'Recetas' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Receta médica" icon={Pill} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Cie10Search onPick={(code, diagnosis) => {
                updateField('icd10Code', code);
                updateField('mainDiagnosis', diagnosis);
              }} />
              <ControlledInput label="Medicamento" value={form.medicationName} onChange={(value) => updateField('medicationName', value)} />
              <ControlledInput label="Dosis" value={form.dose} onChange={(value) => updateField('dose', value)} />
              <ControlledInput label="Frecuencia" value={form.frequency} onChange={(value) => updateField('frequency', value)} />
              <ControlledInput label="Duración" value={form.duration} onChange={(value) => updateField('duration', value)} />
              <ControlledInput label="Vía" value={form.route} onChange={(value) => updateField('route', value)} />
              <ControlledTextArea label="Indicaciones" value={form.instructions} onChange={(value) => updateField('instructions', value)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => void saveChanges()} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white"><Save className="h-4 w-4" />Guardar receta</button>
              {form.recordId && <a href={`${apiBase}/api/medical-records/${form.recordId}/prescription.pdf`} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm"><Printer className="h-4 w-4" />PDF/Imprimir</a>}
              <a href={`https://wa.me/?text=${encodeURIComponent(`${form.medicationName} ${form.dose} ${form.frequency}`)}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm"><MessageCircle className="h-4 w-4" />WhatsApp</a>
              <a href={`mailto:?subject=Receta Clinica Keyser&body=${encodeURIComponent(`${form.medicationName} ${form.dose} ${form.frequency}`)}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm"><Mail className="h-4 w-4" />Correo</a>
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Imágenes' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Archivos clínicos" icon={Paperclip} />
            <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
              <Upload className="mx-auto h-6 w-6 text-clinic-teal" />
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)} className="mx-auto mt-3 block max-w-full text-sm" />
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Arrastra o selecciona JPG, PNG o PDF.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={uploadFiles} disabled={loadStatus === 'loading' || selectedFiles.length === 0} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white disabled:opacity-60">
                {loadStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir archivos
              </button>
              {form.recordId && (
                <a href={`${apiBase}/api/medical-records/${form.recordId}/pdf`} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-100">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </a>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {uploads.map((file) => (
                <div key={file.name} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
                  {file.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.previewUrl} alt={file.name} className="mb-2 aspect-video w-full rounded object-cover" />
                  ) : (
                    <div className="mb-2 flex aspect-video items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">{file.type.includes('pdf') ? 'PDF' : 'Imagen'}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        {!isInitialLoading && activeTab === 'Expedientes' && (
          <FolderExplorer
            records={recordHistory}
            activeRecord={activeRecord}
            patientId={patientId}
            onOpenDocument={() => setIsTemplateOpen(true)}
          />
        )}
        {!isInitialLoading && activeTab === 'Vacunas' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Registro de vacunas" icon={Syringe} />
            <div className="grid gap-4 lg:grid-cols-2">
              <ControlledInput label="Nombre vacuna" value={form.vaccineName} onChange={(value) => updateField('vaccineName', value)} />
              <ControlledInput label="Fecha aplicación" type="date" value={form.vaccineDate} onChange={(value) => updateField('vaccineDate', value)} />
              <ControlledInput label="Próxima dosis" type="date" value={form.vaccineNextDose} onChange={(value) => updateField('vaccineNextDose', value)} />
              <ControlledInput label="Lote" value={form.vaccineLot} onChange={(value) => updateField('vaccineLot', value)} />
              <ControlledTextArea label="Observaciones" value={form.vaccineObservations} onChange={(value) => updateField('vaccineObservations', value)} />
            </div>
            <button className="mt-4 h-10 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white" onClick={() => postClinicalResource('vaccines', { vaccineName: form.vaccineName, appliedAt: form.vaccineDate, nextDoseAt: form.vaccineNextDose || undefined, lotNumber: form.vaccineLot, observations: form.vaccineObservations }, 'Vacuna guardada')}>Guardar vacuna</button>
            <TimelineList items={activeRecord.vaccineRecords ?? []} primary="vaccineName" secondary="nextDoseAt" empty="Sin vacunas registradas." />
          </section>
        )}
        {!isInitialLoading && activeTab === 'Obstetricia' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Control de embarazo" icon={Baby} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ControlledInput label="FUR" type="date" value={form.lastPeriodDate} onChange={(value) => updateField('lastPeriodDate', value)} />
              <Field label="FPP automática" value={form.dueDate || 'Pendiente'} />
              <Field label="Edad gestacional" value={form.gestationalAge || 'Pendiente'} />
              <ControlledInput label="Gesta" type="number" value={form.gestations} onChange={(value) => updateField('gestations', value)} />
              <ControlledInput label="Partos" type="number" value={form.births} onChange={(value) => updateField('births', value)} />
              <ControlledInput label="Abortos" type="number" value={form.abortions} onChange={(value) => updateField('abortions', value)} />
              <ControlledInput label="Cesáreas" type="number" value={form.cesareans} onChange={(value) => updateField('cesareans', value)} />
              <ControlledInput label="Movimientos fetales" value={form.fetalMovements} onChange={(value) => updateField('fetalMovements', value)} />
              <ControlledInput label="Presión arterial" value={form.bloodPressure} onChange={(value) => updateField('bloodPressure', value)} />
              <ControlledInput label="Peso materno" type="number" value={form.maternalWeight} onChange={(value) => updateField('maternalWeight', value)} />
              <ControlledInput label="Altura uterina" type="number" value={form.uterineHeight} onChange={(value) => updateField('uterineHeight', value)} />
              <ControlledInput label="FCF" type="number" value={form.fetalHeartRate} onChange={(value) => updateField('fetalHeartRate', value)} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ControlledTextArea label="Observaciones" value={form.pregnancyObservations} onChange={(value) => updateField('pregnancyObservations', value)} />
              <ControlledTextArea label="Alertas obstétricas" value={form.pregnancyAlerts} onChange={(value) => updateField('pregnancyAlerts', value)} />
            </div>
            <button className="mt-4 h-10 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white" onClick={() => postClinicalResource('pregnancy-control', pregnancyPayload(form), 'Control obstétrico guardado')}>Guardar control</button>
            <TimelineList items={activeRecord.pregnancyControls ?? []} primary="gestationalAge" secondary="observations" empty="Sin controles prenatales." />
          </section>
        )}
        {!isInitialLoading && activeTab === 'Mapa corporal' && (
          <BodyMapPanel form={form} updateField={updateField} items={activeRecord.bodyMapFindings ?? []} onSave={() => postClinicalResource('body-map', bodyMapPayload(form), 'Hallazgo corporal guardado')} />
        )}
        {!isInitialLoading && activeTab === 'Odontograma' && (
          <DentalPanel form={form} updateField={updateField} items={activeRecord.dentalFindings ?? []} onSave={() => postClinicalResource('dental-chart', { toothNumber: form.toothNumber, status: form.toothStatus, description: form.dentalDescription, procedure: form.dentalProcedure, observations: form.dentalObservations }, 'Hallazgo dental guardado')} />
        )}
        {!isInitialLoading && activeTab === 'Documentos' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Informes y documentos" icon={FileText} />
            <div className="grid gap-4 lg:grid-cols-2">
              <ControlledInput label="Tipo" value={form.documentType} onChange={(value) => updateField('documentType', value)} />
              <ControlledInput label="Título" value={form.documentTitle} onChange={(value) => updateField('documentTitle', value)} />
              <ControlledTextArea label="Contenido" value={form.documentContent} onChange={(value) => updateField('documentContent', value)} />
            </div>
            <button className="mt-4 h-10 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white" onClick={() => postClinicalResource('documents', { documentType: form.documentType, title: form.documentTitle, content: form.documentContent }, 'Documento guardado')}>Guardar documento</button>
            <TimelineList items={activeRecord.clinicalDocuments ?? []} primary="title" secondary="documentType" empty="Sin documentos emitidos." />
          </section>
        )}
        {!isInitialLoading && activeTab === 'IA clínica' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SectionTitle title="Asistente clínico opcional" icon={Sparkles} />
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              Apoyo de redacción y razonamiento clínico. No diagnostica automáticamente; el médico valida todo.
            </p>
            <ControlledTextArea label="Texto clínico o pregunta" value={form.aiPrompt} onChange={(value) => updateField('aiPrompt', value)} />
            <div className="mt-4 flex flex-wrap gap-2">
              {['Mejorar redacción', 'Resumir evolución', 'Sugerir diferenciales', 'Sugerir plan básico'].map((label) => (
                <button key={label} onClick={() => updateField('aiDraft', aiSuggestion(label, form))} className="h-9 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">{label}</button>
              ))}
            </div>
            {form.aiDraft && <div className="mt-4 rounded-md border border-slate-200 p-4 text-sm dark:border-slate-700">{form.aiDraft}</div>}
          </section>
        )}

        {mode !== 'dashboard' && (
          <Link href={`/expediente/${patientId}`} className="text-sm font-medium text-clinic-teal">
            Volver al tablero del paciente
          </Link>
        )}
          </div>
        </div>
        <MasterActionButton
          open={isMasterOpen}
          onToggle={() => setIsMasterOpen((value) => !value)}
          onEvolution={() => setActiveTab('Evoluciones')}
          onPrescription={() => openDocument('prescription')}
          onLabOrder={() => openDocument('lab')}
          onImageOrder={() => openDocument('image')}
          onCertificate={() => openDocument('certificate')}
          onIncapacity={() => openDocument('incapacity')}
          onUpload={() => setActiveTab('Imágenes')}
          onAppointment={() => showToast('info', 'Agenda semanal disponible desde la vista de evoluciones')}
        />
        {isTemplateOpen && <TemplateSelector onClose={() => setIsTemplateOpen(false)} onSelect={openDocument} />}
        {documentKind && (
          <LiveDocumentModal
            kind={documentKind}
            form={form}
            patient={patient}
            record={activeRecord}
            signed={signedPreview}
            onSign={() => {
              setSignedPreview(true);
              showToast('info', 'Firma insertada si está configurada en el perfil médico');
            }}
            updateField={updateField}
            onClose={() => setDocumentKind(null)}
            onSave={saveLiveDocument}
          />
        )}
      </div>
    </ClinicalShell>
  );
}

function PatientTab({ patientId, patient, records }: { patientId: string; patient: PatientSummary; records: ApiRecord[] }) {
  const latest = records[0];
  const nextAppointment = patient.appointments?.find((appointment) => new Date(String(appointment.startsAt)) >= new Date()) ?? patient.appointments?.[0];
  const alerts = clinicalAlerts(patient, records);
  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Panel general del paciente" icon={HeartPulse} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/expediente/${patientId}/nuevo`} className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white">
            <FilePlus2 className="h-4 w-4" />
            Nuevo expediente
          </Link>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          {patient.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={patient.photoUrl} alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-teal-50 text-2xl font-semibold text-clinic-teal dark:bg-teal-950">
              {(patient.fullName ?? 'CK').split(' ').slice(0, 2).map((part) => part[0]).join('')}
            </div>
          )}
          <h3 className="mt-3 text-center text-lg font-semibold">{patient.fullName}</h3>
          <p className="text-center text-sm text-slate-500">{patient.patientCode}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {alerts.map((alert) => (
              <span key={alert} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-100">
                <AlertTriangle className="h-3 w-3" />
                {alert}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Edad" value={ageFromBirthDate(patient.birthDate)} />
          <Field label="Sexo" value={patient.gender} />
          <Field label="Teléfono" value={patient.phone} />
          <Field label="Ciudad" value={patient.city} />
          <Field label="Médico tratante" value={patient.assignedDoctor?.fullName ?? latest?.doctor?.fullName} />
          <Field label="Última consulta" value={formatDate(latest?.consultationDate)} />
          <Field label="Próxima cita" value={formatDate(nextAppointment?.startsAt ?? latest?.nextAppointmentDate)} />
          <Field label="Tipo de sangre" value={patient.bloodType} />
          <Field label="Cédula" value={patient.idNumber} />
          <Field label="Dirección" value={patient.address} />
          <Field label="Alergias" value={patient.allergies} />
          <Field label="Crónicas" value={patient.chronicDiseases} />
        </div>
      </div>
      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold">Historial cargado</p>
        <div className="grid gap-2">
          {records.length === 0 ? (
            <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700">Sin expedientes guardados.</p>
          ) : (
            records.map((record) => (
              <Link key={record.id} href={`/expediente/${patientId}/${record.id}`} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm hover:border-clinic-teal dark:border-slate-700">
                <span>{record.recordNumber ?? 'Expediente'} - {record.reasonForVisit ?? record.chiefComplaint ?? 'Sin motivo registrado'}</span>
                <span className="text-slate-500">{formatDate(record.consultationDate)}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MasterActionButton({
  open,
  onToggle,
  onEvolution,
  onPrescription,
  onLabOrder,
  onImageOrder,
  onCertificate,
  onIncapacity,
  onUpload,
  onAppointment,
}: {
  open: boolean;
  onToggle: () => void;
  onEvolution: () => void;
  onPrescription: () => void;
  onLabOrder: () => void;
  onImageOrder: () => void;
  onCertificate: () => void;
  onIncapacity: () => void;
  onUpload: () => void;
  onAppointment: () => void;
}) {
  const actions = [
    { label: 'Nueva evolución', icon: ClipboardList, action: onEvolution },
    { label: 'Nueva receta', icon: Pill, action: onPrescription },
    { label: 'Nueva orden de laboratorio', icon: Syringe, action: onLabOrder },
    { label: 'Nueva orden de imagen', icon: ImageIcon, action: onImageOrder },
    { label: 'Nuevo certificado', icon: FileText, action: onCertificate },
    { label: 'Nueva incapacidad', icon: ShieldPlus, action: onIncapacity },
    { label: 'Subir archivo', icon: Upload, action: onUpload },
    { label: 'Nueva cita', icon: CalendarDays, action: onAppointment },
  ];
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {actions.map((item) => (
            <button key={item.label} type="button" onClick={item.action} className="flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
              <item.icon className="h-4 w-4 text-clinic-teal" />
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={onToggle} className="flex h-14 w-14 items-center justify-center rounded-full bg-clinic-teal text-white shadow-xl transition hover:scale-105">
        {open ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
      </button>
    </div>
  );
}

const documentCards: Array<{ kind: DocumentKind; category: string; name: string; color: string }> = [
  { kind: 'prescription', category: 'Prescripciones', name: 'Receta médica', color: 'bg-blue-50 text-blue-900' },
  { kind: 'lab', category: 'Órdenes', name: 'Orden de laboratorio', color: 'bg-emerald-50 text-emerald-900' },
  { kind: 'image', category: 'Órdenes', name: 'Orden de imagen', color: 'bg-cyan-50 text-cyan-900' },
  { kind: 'certificate', category: 'Certificados', name: 'Certificado médico', color: 'bg-violet-50 text-violet-900' },
  { kind: 'incapacity', category: 'Certificados', name: 'Incapacidad', color: 'bg-amber-50 text-amber-900' },
  { kind: 'consent', category: 'Consentimientos', name: 'Consentimiento informado', color: 'bg-rose-50 text-rose-900' },
  { kind: 'history', category: 'Especialidades', name: 'Historia clínica imprimible', color: 'bg-slate-100 text-slate-900' },
];

function TemplateSelector({ onClose, onSelect }: { onClose: () => void; onSelect: (kind: DocumentKind) => void }) {
  const [category, setCategory] = useState('Inicio');
  const categories = ['Inicio', 'Prescripciones', 'Órdenes', 'Certificados', 'Consentimientos', 'Indicaciones', 'Especialidades', 'Sin categoría'];
  const visible = category === 'Inicio' ? documentCards : documentCards.filter((card) => card.category === category);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Seleccione un documento para llenar</h2>
            <p className="text-sm text-slate-500">Plantillas limpias con datos del paciente y Clínica Keyser.</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-slate-200 p-2 dark:border-slate-700"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${category === item ? 'bg-clinic-teal text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{item}</button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((card, index) => (
            <article key={card.name} className={`rounded-lg border border-slate-200 p-4 ${card.color} dark:border-slate-700`}>
              <div className="flex items-start justify-between gap-2">
                <FileText className="h-5 w-5" />
                <button title="Fijar como favorita" className="rounded-full bg-white/70 p-1"><Star className={`h-4 w-4 ${index < 2 ? 'fill-current' : ''}`} /></button>
              </div>
              <h3 className="mt-4 font-semibold">{card.name}</h3>
              <p className="mt-1 text-xs opacity-75">{card.category}</p>
              <button onClick={() => onSelect(card.kind)} className="mt-4 h-9 rounded-md bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm">Seleccionar</button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveDocumentModal({
  kind,
  form,
  patient,
  record,
  signed,
  updateField,
  onSign,
  onClose,
  onSave,
}: {
  kind: DocumentKind;
  form: RecordForm;
  patient: PatientSummary;
  record: ApiRecord;
  signed: boolean;
  updateField: (field: keyof RecordForm, value: string | boolean) => void;
  onSign: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="font-semibold">{documentTitle(kind)}</h2>
            <p className="text-sm text-slate-500">Formulario editable + vista previa en hoja</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.print()} className="h-9 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">Imprimir</button>
            <button onClick={() => navigator.share?.({ title: documentTitle(kind), text: patient.fullName })} className="h-9 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">Compartir</button>
            <button onClick={onClose} className="h-9 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">Cerrar</button>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 md:grid-cols-2">
              {(kind === 'prescription' || kind === 'history' || kind === 'certificate' || kind === 'incapacity') && <ControlledInput label="Diagnóstico" value={form.mainDiagnosis} onChange={(value) => updateField('mainDiagnosis', value)} />}
              {kind === 'prescription' && <><ControlledInput label="Medicamento" value={form.medicationName} onChange={(value) => updateField('medicationName', value)} /><ControlledInput label="Dosis" value={form.dose} onChange={(value) => updateField('dose', value)} /><ControlledInput label="Vía" value={form.route} onChange={(value) => updateField('route', value)} /><ControlledInput label="Frecuencia" value={form.frequency} onChange={(value) => updateField('frequency', value)} /><ControlledInput label="Duración" value={form.duration} onChange={(value) => updateField('duration', value)} /><ControlledTextArea label="Indicaciones" value={form.instructions} onChange={(value) => updateField('instructions', value)} /></>}
              {kind === 'lab' && <><ControlledTextArea label="Exámenes solicitados" value={form.requestedLabTests || form.labOrderType} onChange={(value) => updateField('requestedLabTests', value)} /><ControlledTextArea label="Motivo clínico" value={form.labReason || form.reasonForVisit} onChange={(value) => updateField('labReason', value)} /></>}
              {kind === 'image' && <><ControlledInput label="Estudio solicitado" value={form.imagingStudyType} onChange={(value) => updateField('imagingStudyType', value)} /><ControlledInput label="Región anatómica" value={form.bodyRegion} onChange={(value) => updateField('bodyRegion', value)} /><ControlledTextArea label="Motivo clínico" value={form.imagingReason || form.reasonForVisit} onChange={(value) => updateField('imagingReason', value)} /></>}
              {(kind === 'certificate' || kind === 'incapacity' || kind === 'consent' || kind === 'history') && <><ControlledInput label="Título" value={form.documentTitle || documentTitle(kind)} onChange={(value) => updateField('documentTitle', value)} /><ControlledTextArea label="Texto del documento" value={form.documentContent || printableClinicalSummary(form, patient)} onChange={(value) => updateField('documentContent', value)} /></>}
              <ControlledTextArea label="Recomendaciones" value={form.recommendations} onChange={(value) => updateField('recommendations', value)} />
            </div>
          </div>
          <DocumentSheet kind={kind} form={form} patient={patient} record={record} signed={signed} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm dark:border-slate-700">Cancelar</button>
          <div className="flex flex-wrap gap-2">
            <button onClick={onSign} className="h-10 rounded-md border border-slate-200 px-4 text-sm dark:border-slate-700">Firma del médico</button>
            <button onClick={onSave} className="h-10 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentSheet({ kind, form, patient, record, signed }: { kind: DocumentKind; form: RecordForm; patient: PatientSummary; record: ApiRecord; signed: boolean }) {
  const doctor = record.doctor?.doctorProfile ?? record.doctor ?? { fullName: 'Dr. Sergio Herrera', minsaCode: '95520' };
  return (
    <aside className="printable mx-auto min-h-[900px] w-full max-w-[760px] rounded-sm bg-white p-10 text-slate-950 shadow-xl">
      <header className="flex items-center gap-4 border-b-2 border-clinic-coral pb-4">
        <img src="/clinica-keyser-logo.jpg" alt="Clínica Keyser" className="h-16 w-16 object-contain" />
        <div>
          <h2 className="text-xl font-bold text-clinic-teal">Clínica Keyser</h2>
          <p className="text-xs">De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua</p>
          <p className="text-xs">Tel. 8495-2200 · WhatsApp 50584952200</p>
        </div>
      </header>
      <section className="mt-5 grid grid-cols-2 gap-2 text-sm">
        <p><strong>Paciente:</strong> {patient.fullName}</p>
        <p><strong>Expediente:</strong> {patient.patientCode}</p>
        <p><strong>Edad:</strong> {ageFromBirthDate(patient.birthDate)}</p>
        <p><strong>Sexo:</strong> {patient.gender ?? '-'}</p>
        <p><strong>Fecha nacimiento:</strong> {formatDate(patient.birthDate)}</p>
        <p><strong>Teléfono:</strong> {patient.phone ?? '-'}</p>
        <p className="col-span-2"><strong>Dirección:</strong> {patient.address ?? '-'}</p>
      </section>
      <h1 className="mt-7 text-center text-lg font-bold uppercase tracking-wide">{documentTitle(kind)}</h1>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-7">
        {documentBody(kind, form, patient)}
      </div>
      <footer className="mt-16 text-center text-sm">
        {signed && <p className="mb-2 font-semibold text-clinic-teal">Firma digital insertada</p>}
        <p>__________________________________</p>
        <p className="font-semibold">{doctor.fullName ?? 'Dr. Sergio Herrera'}</p>
        <p>{doctor.specialty ?? 'Médico General, Ecografista Clínico y Médico Estético'}</p>
        <p>Código MINSA: {doctor.minsaCode ?? '95520'}</p>
        <p className="mt-5 text-xs text-slate-500">Documento emitido electrónicamente por Clínica Keyser.</p>
      </footer>
    </aside>
  );
}

function ClinicalTimeline({ events }: { events: ApiRecord[] }) {
  return (
    <div className="mt-4 grid gap-3">
      {events.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">Sin eventos clínicos registrados todavía.</p>
      ) : (
        events.map((event) => (
          <article key={`${event.type}-${event.id}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[160px_1fr_auto]">
            <div>
              <p className="font-semibold text-clinic-teal">{formatDate(event.eventAt ?? event.createdAt ?? event.date)}</p>
              <p className="text-xs text-slate-500">{event.doctor?.doctorProfile?.fullName ?? event.doctor?.fullName ?? event.doctorName ?? 'Clínica Keyser'}</p>
            </div>
            <div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">{event.typeLabel ?? event.type ?? 'Evento'}</span>
              <h3 className="mt-2 font-semibold">{event.title}</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{event.summary ?? 'Registro clínico guardado en expediente.'}</p>
            </div>
            <div className="flex items-center gap-2 md:flex-col">
              {event.href && <Link href={event.href} className="rounded-md border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">Abrir</Link>}
              {event.pdfHref && <a href={event.pdfHref} className="rounded-md bg-clinic-teal px-3 py-2 text-xs font-semibold text-white">PDF</a>}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function FolderExplorer({ records, activeRecord, patientId, onOpenDocument }: { records: ApiRecord[]; activeRecord: ApiRecord; patientId: string; onOpenDocument: () => void }) {
  const [query, setQuery] = useState('');
  const folders = [
    { name: 'Consultas médicas', count: records.length, items: records.map((record) => ({ title: record.reasonForVisit ?? record.recordNumber, date: record.consultationDate, href: `/expediente/${patientId}/${record.id}` })) },
    { name: 'Odontología', count: activeRecord.dentalFindings?.length ?? 0, items: (activeRecord.dentalFindings ?? []).map((item: ApiRecord) => ({ title: `Pieza ${item.toothNumber}`, date: item.createdAt, summary: item.status })) },
    { name: 'Laboratorio', count: (activeRecord.labOrders?.length ?? 0) + (activeRecord.externalLabOrders?.length ?? 0), items: [...(activeRecord.labOrders ?? []), ...(activeRecord.externalLabOrders ?? [])].map((item: ApiRecord) => ({ title: item.orderType ?? item.orderNumber ?? 'Orden de laboratorio', date: item.createdAt, summary: item.reason })) },
    { name: 'Certificados', count: activeRecord.clinicalDocuments?.length ?? 0, items: (activeRecord.clinicalDocuments ?? []).map((item: ApiRecord) => ({ title: item.title, date: item.createdAt, summary: item.documentType })) },
    { name: 'Recetas', count: activeRecord.prescriptions?.length ?? 0, items: (activeRecord.prescriptions ?? []).map((item: ApiRecord) => ({ title: item.medicationName ?? item.prescriptionNumber ?? 'Receta', date: item.createdAt, summary: item.instructions })) },
    { name: 'Órdenes de imagen', count: activeRecord.imagingOrders?.length ?? 0, items: (activeRecord.imagingOrders ?? []).map((item: ApiRecord) => ({ title: item.studyType, date: item.createdAt, summary: item.reason })) },
    { name: 'Consentimientos', count: 0, items: [] },
    { name: 'Exámenes médicos', count: activeRecord.attachments?.length ?? 0, items: (activeRecord.attachments ?? []).map((item: ApiRecord) => ({ title: item.fileName, date: item.createdAt, summary: item.fileType })) },
  ].filter((folder) => folder.name.toLowerCase().includes(query.toLowerCase()) || folder.items.some((item: ApiRecord) => item.title?.toLowerCase?.().includes(query.toLowerCase())));
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Expedientes y procedimientos" icon={FolderOpen} />
        <button onClick={onOpenDocument} className="h-10 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white">Nuevo documento</button>
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar carpeta o documento" className="mt-4 h-10 w-full rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {folders.map((folder) => (
          <details key={folder.name} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><FolderOpen className="h-5 w-5 text-clinic-teal" /><span className="font-semibold">{folder.name}</span></div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{folder.count}</span>
              </div>
            </summary>
            <div className="mt-3 grid gap-2">
              {folder.items.length === 0 ? <p className="text-sm text-slate-500">Sin documentos.</p> : folder.items.map((item: ApiRecord, index: number) => (
                item.href ? <Link key={index} href={item.href} className="rounded-md bg-slate-50 p-3 text-sm hover:text-clinic-teal dark:bg-slate-950">{item.title}<p className="text-xs text-slate-500">{formatDate(item.date)} · {item.summary}</p></Link> : <div key={index} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">{item.title}<p className="text-xs text-slate-500">{formatDate(item.date)} · {item.summary}</p></div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function buildTimelineEvents(events: ApiRecord[], records: ApiRecord[], patient: PatientSummary) {
  const derived = records.flatMap((record) => [
    { id: `record-${record.id}`, type: 'EXPEDIENTE', typeLabel: 'Expediente', title: record.reasonForVisit ?? record.recordNumber, summary: record.diagnosisText ?? record.currentIllness, eventAt: record.consultationDate, doctor: record.doctor, href: `/expediente/${patient.id}/${record.id}`, pdfHref: `${apiBase}/api/medical-records/${record.id}/pdf` },
    ...(record.evolutionNotes ?? []).map((note: ApiRecord) => ({ id: `evo-${note.id}`, type: 'EVOLUCIÓN', title: 'Evolución clínica', summary: note.assessment ?? note.plan, eventAt: note.noteDate, doctorName: note.doctorName, pdfHref: note.id ? `${apiBase}/api/medical-records/evolution-notes/${note.id}/pdf` : undefined })),
    ...(record.attachments ?? []).map((file: ApiRecord) => ({ id: `file-${file.id}`, type: 'ARCHIVO', title: 'Archivo subido', summary: file.fileName, eventAt: file.createdAt })),
    ...(record.bodyMapFindings ?? []).map((item: ApiRecord) => ({ id: `body-${item.id}`, type: 'ANATOMÍA', title: item.region, summary: item.description, eventAt: item.createdAt })),
    ...(record.dentalFindings ?? []).map((item: ApiRecord) => ({ id: `dental-${item.id}`, type: 'ODONTOGRAMA', title: `Pieza ${item.toothNumber}`, summary: item.status, eventAt: item.createdAt })),
  ]);
  return [...events, ...derived].sort((a, b) => new Date(b.eventAt ?? b.createdAt ?? 0).getTime() - new Date(a.eventAt ?? a.createdAt ?? 0).getTime());
}

function documentTitle(kind: DocumentKind) {
  const labels: Record<DocumentKind, string> = {
    prescription: 'Receta médica',
    lab: 'Orden de laboratorio',
    image: 'Orden de imagen',
    certificate: 'Certificado médico',
    incapacity: 'Incapacidad médica',
    consent: 'Consentimiento informado',
    history: 'Historia clínica imprimible',
  };
  return labels[kind];
}

function documentBody(kind: DocumentKind, form: RecordForm, patient: PatientSummary) {
  if (kind === 'prescription') return `Diagnóstico: ${form.mainDiagnosis || 'No especificado'}\n\nRp.\n${form.medicationName} ${form.dose}\nVía: ${form.route || '-'} · Frecuencia: ${form.frequency || '-'} · Duración: ${form.duration || '-'}\n\nIndicaciones:\n${form.instructions || '-'}\n\nRecomendaciones:\n${form.recommendations || '-'}`;
  if (kind === 'lab') return `Motivo clínico: ${form.labReason || form.reasonForVisit || '-'}\nDiagnóstico: ${form.mainDiagnosis || '-'}\n\nExámenes solicitados:\n${(form.requestedLabTests || form.labOrderType || 'Hematología').split('\n').map((item) => `• ${item}`).join('\n')}\n\nObservaciones:\n${form.recommendations || '-'}`;
  if (kind === 'image') return `Estudio solicitado: ${form.imagingStudyType || '-'}\nRegión anatómica: ${form.bodyRegion || '-'}\nDiagnóstico presuntivo: ${form.mainDiagnosis || '-'}\nMotivo clínico: ${form.imagingReason || form.reasonForVisit || '-'}\n\nObservaciones:\n${form.requestedImagingStudies || '-'}`;
  return form.documentContent || printableClinicalSummary(form, patient);
}

function printableClinicalSummary(form: RecordForm, patient: PatientSummary) {
  return `Por este medio se hace constar la atención médica brindada a ${patient.fullName ?? 'paciente'}.\n\nMotivo de consulta: ${form.reasonForVisit || '-'}\nEnfermedad actual: ${form.currentIllness || '-'}\nAntecedentes: ${form.personalPathologicalHistory || '-'}\nSignos vitales: PA ${form.bloodPressure || '-'}, FC ${form.heartRate || '-'}, Temp ${form.temperature || '-'}, SpO2 ${form.oxygenSaturation || '-'}\nExamen físico: ${form.generalAppearance || '-'}\nDiagnóstico: ${form.mainDiagnosis || '-'}\nPlan: ${form.plan || form.instructions || '-'}`;
}

function LoadingSkeleton() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ControlledInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function ControlledTextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );
}

function ControlledSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950">
        <option value="DRAFT">Borrador</option>
        <option value="COMPLETED">Completado</option>
        <option value="ARCHIVED">Archivado</option>
      </select>
    </label>
  );
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
        {title}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="grid gap-4 border-t border-slate-200 p-4 dark:border-slate-700 lg:grid-cols-2">{children}</div>}
    </div>
  );
}

function QuickChecks({ title, items, onPick }: { title: string; items: string[]; onPick: (item: string) => void }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950 lg:col-span-2">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item} type="button" onClick={() => onPick(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs hover:border-clinic-teal hover:text-clinic-teal dark:border-slate-700 dark:bg-slate-900">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

const cie10Options = [
  ['I10', 'Hipertensión esencial primaria'],
  ['E11', 'Diabetes mellitus tipo 2'],
  ['J00', 'Rinofaringitis aguda'],
  ['N39.0', 'Infección de vías urinarias'],
  ['K29', 'Gastritis y duodenitis'],
  ['R51', 'Cefalea'],
  ['Z34', 'Supervisión de embarazo normal'],
];

function Cie10Search({ onPick }: { onPick: (code: string, diagnosis: string) => void }) {
  const [query, setQuery] = useState('');
  const matches = cie10Options.filter(([code, label]) => `${code} ${label}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  return (
    <div className="relative grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 lg:col-span-2">
      Buscador CIE-10
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar código o diagnóstico" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950" />
      {query && (
        <div className="absolute top-16 z-10 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {matches.map(([code, diagnosis]) => (
            <button key={code} type="button" onClick={() => {
              onPick(code, diagnosis);
              setQuery('');
            }} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <strong>{code}</strong> · {diagnosis}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClinicalOrderPanel({
  title,
  icon,
  primaryLabel,
  primaryValue,
  priority,
  reason,
  items,
  onPrimary,
  onPriority,
  onReason,
  onSave,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryLabel: string;
  primaryValue: string;
  priority: string;
  reason: string;
  items: ApiRecord[];
  onPrimary: (value: string) => void;
  onPriority: (value: string) => void;
  onReason: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <SectionTitle title={title} icon={icon} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ControlledInput label={primaryLabel} value={primaryValue} onChange={onPrimary} />
        <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Prioridad
          <select value={priority} onChange={(event) => onPriority(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-clinic-teal dark:border-slate-700 dark:bg-slate-950">
            <option value="ROUTINE">Rutina</option>
            <option value="PRIORITY">Prioritaria</option>
            <option value="URGENT">Urgente</option>
          </select>
        </label>
        <ControlledTextArea label="Motivo / observaciones" value={reason} onChange={onReason} />
      </div>
      <button type="button" onClick={onSave} className="mt-4 h-10 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white">Emitir orden</button>
      <TimelineList items={items} primary="orderType" secondary="studyType" empty="Sin órdenes registradas." />
    </section>
  );
}

function TimelineList({ items, primary, secondary, empty }: { items: ApiRecord[]; primary: string; secondary: string; empty: string }) {
  return (
    <div className="mt-5 border-l-2 border-clinic-teal pl-4">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="mb-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="font-medium">{item[primary] ?? item[secondary] ?? item.title ?? 'Registro clínico'}</p>
            <p className="text-slate-500">{formatDate(item.createdAt)} · {item[secondary] ?? item.observations ?? item.reason ?? ''}</p>
          </div>
        ))
      )}
    </div>
  );
}

const bodyRegions = [
  'Cabeza',
  'Cuello',
  'Tórax',
  'Abdomen',
  'Pelvis',
  'Espalda',
  'Hombro derecho',
  'Hombro izquierdo',
  'Brazo derecho',
  'Brazo izquierdo',
  'Codo derecho',
  'Codo izquierdo',
  'Antebrazo derecho',
  'Antebrazo izquierdo',
  'Mano derecha',
  'Mano izquierda',
  'Cadera derecha',
  'Cadera izquierda',
  'Muslo derecho',
  'Muslo izquierdo',
  'Rodilla derecha',
  'Rodilla izquierda',
  'Pierna derecha',
  'Pierna izquierda',
  'Tobillo derecho',
  'Tobillo izquierdo',
  'Pie derecho',
  'Pie izquierdo',
];
const anatomyLayers = ['Superficie corporal', 'Sistema muscular', 'Sistema óseo', 'Órganos', 'Sistema vascular simple', 'Sistema nervioso simple'];
const layerPalette: Record<string, string> = {
  'Superficie corporal': 'from-teal-50 to-slate-100',
  'Sistema muscular': 'from-rose-50 to-red-100',
  'Sistema óseo': 'from-slate-50 to-zinc-200',
  Órganos: 'from-emerald-50 to-lime-100',
  'Sistema vascular simple': 'from-red-50 to-sky-100',
  'Sistema nervioso simple': 'from-violet-50 to-indigo-100',
};

function Anatomy3DViewer({ selected, layer, onSelect }: { selected: string; layer: string; onSelect: (region: string) => void }) {
  const [hovered, setHovered] = useState('');
  const colorByLayer: Record<string, string> = {
    'Superficie corporal': '#dbeafe',
    'Sistema muscular': '#fecaca',
    'Sistema óseo': '#e5e7eb',
    Órganos: '#bbf7d0',
    'Sistema vascular simple': '#bfdbfe',
    'Sistema nervioso simple': '#ddd6fe',
  };
  const regions = [
    { name: 'Cabeza', position: [0, 2.15, 0], scale: [0.42, 0.5, 0.38] },
    { name: 'Tórax', position: [0, 1.25, 0], scale: [0.72, 0.9, 0.35] },
    { name: 'Abdomen', position: [0, 0.35, 0], scale: [0.58, 0.65, 0.32] },
    { name: 'Brazo derecho', position: [-0.92, 0.95, 0], scale: [0.18, 0.85, 0.18] },
    { name: 'Brazo izquierdo', position: [0.92, 0.95, 0], scale: [0.18, 0.85, 0.18] },
    { name: 'Pierna derecha', position: [-0.28, -0.9, 0], scale: [0.23, 1.05, 0.22] },
    { name: 'Pierna izquierda', position: [0.28, -0.9, 0], scale: [0.23, 1.05, 0.22] },
  ] as const;
  return (
    <div className="mb-4 h-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-700">
      <Canvas camera={{ position: [0, 1, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 5]} intensity={1.2} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={7} />
        {regions.map((part) => (
          <mesh
            key={part.name}
            position={part.position as any}
            scale={part.scale as any}
            onClick={() => onSelect(part.name)}
            onPointerOver={(event: any) => {
              event.stopPropagation();
              setHovered(part.name);
            }}
            onPointerOut={() => setHovered('')}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={selected === part.name ? '#ef2f32' : hovered === part.name ? '#38bdf8' : colorByLayer[layer] ?? '#dbeafe'} roughness={0.45} metalness={0.05} />
            {(selected === part.name || hovered === part.name) && (
              <Html distanceFactor={8}>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-900 shadow">{part.name}</span>
              </Html>
            )}
          </mesh>
        ))}
      </Canvas>
    </div>
  );
}

function BodyMapPanel({
  form,
  updateField,
  items,
  onSave,
  embedded = false,
}: {
  form: RecordForm;
  updateField: (field: keyof RecordForm, value: string | boolean) => void;
  items: ApiRecord[];
  onSave: () => void;
  embedded?: boolean;
}) {
  const selectRegion = (region: string) => updateField('bodyRegion', region);
  const regionClass = (region: string) => `cursor-pointer transition ${form.bodyRegion === region ? 'fill-teal-500 stroke-teal-800' : 'fill-slate-200 stroke-slate-400 hover:fill-teal-100 dark:fill-slate-700 dark:stroke-slate-500 dark:hover:fill-teal-900'}`;
  const regionSummary = items.filter((item) => item.layer === form.bodyLayer || !item.layer).slice(0, 8);
  return (
    <section className={`${embedded ? 'rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950' : 'rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'}`}>
      <SectionTitle title="Modelo anatómico simple" icon={MapPinned} />
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className={`rounded-lg border border-slate-200 bg-gradient-to-br ${layerPalette[form.bodyLayer] ?? layerPalette['Superficie corporal']} p-4 text-center dark:border-slate-700 dark:from-slate-900 dark:to-slate-950`}>
          <div className="mb-3 flex justify-center gap-2">
            {(['anterior', 'posterior'] as const).map((view) => (
              <button key={view} type="button" onClick={() => updateField('bodyView', view)} className={`rounded-md px-3 py-1 text-sm capitalize ${form.bodyView === view ? 'bg-clinic-teal text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{view}</button>
            ))}
          </div>
          <label className="mb-3 grid gap-1 text-left text-xs font-medium text-slate-600 dark:text-slate-300">
            Capa anatómica
            <select value={form.bodyLayer} onChange={(event) => updateField('bodyLayer', event.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {anatomyLayers.map((layer) => <option key={layer}>{layer}</option>)}
            </select>
          </label>
          <Anatomy3DViewer selected={form.bodyRegion} layer={form.bodyLayer} onSelect={selectRegion} />
          <svg viewBox="0 0 220 420" className="mx-auto h-[360px] w-full max-w-[220px]" role="img" aria-label="Modelo anatómico seleccionable">
            <ellipse onClick={() => selectRegion('Cabeza')} className={regionClass('Cabeza')} cx="110" cy="40" rx="34" ry="36" strokeWidth="2" />
            <rect onClick={() => selectRegion('Cuello')} className={regionClass('Cuello')} x="94" y="75" width="32" height="24" rx="10" strokeWidth="2" />
            <path onClick={() => selectRegion(form.bodyView === 'posterior' ? 'Espalda' : 'Tórax')} className={regionClass(form.bodyView === 'posterior' ? 'Espalda' : 'Tórax')} d="M72 100 Q110 82 148 100 L158 190 Q110 212 62 190 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Abdomen')} className={regionClass('Abdomen')} d="M66 190 Q110 212 154 190 L145 260 Q110 276 75 260 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Pelvis')} className={regionClass('Pelvis')} d="M75 260 Q110 282 145 260 L136 292 Q110 304 84 292 Z" strokeWidth="2" />
            <circle onClick={() => selectRegion('Hombro derecho')} className={regionClass('Hombro derecho')} cx="67" cy="108" r="13" strokeWidth="2" />
            <circle onClick={() => selectRegion('Hombro izquierdo')} className={regionClass('Hombro izquierdo')} cx="153" cy="108" r="13" strokeWidth="2" />
            <path onClick={() => selectRegion('Brazo derecho')} className={regionClass('Brazo derecho')} d="M62 108 Q38 140 34 205 L54 208 Q62 155 82 118 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Brazo izquierdo')} className={regionClass('Brazo izquierdo')} d="M158 108 Q182 140 186 205 L166 208 Q158 155 138 118 Z" strokeWidth="2" />
            <circle onClick={() => selectRegion('Codo derecho')} className={regionClass('Codo derecho')} cx="45" cy="174" r="10" strokeWidth="2" />
            <circle onClick={() => selectRegion('Codo izquierdo')} className={regionClass('Codo izquierdo')} cx="175" cy="174" r="10" strokeWidth="2" />
            <path onClick={() => selectRegion('Antebrazo derecho')} className={regionClass('Antebrazo derecho')} d="M38 184 L56 188 L54 222 L36 220 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Antebrazo izquierdo')} className={regionClass('Antebrazo izquierdo')} d="M164 188 L182 184 L184 220 L166 222 Z" strokeWidth="2" />
            <ellipse onClick={() => selectRegion('Mano derecha')} className={regionClass('Mano derecha')} cx="43" cy="224" rx="15" ry="20" strokeWidth="2" />
            <ellipse onClick={() => selectRegion('Mano izquierda')} className={regionClass('Mano izquierda')} cx="177" cy="224" rx="15" ry="20" strokeWidth="2" />
            <circle onClick={() => selectRegion('Cadera derecha')} className={regionClass('Cadera derecha')} cx="86" cy="272" r="12" strokeWidth="2" />
            <circle onClick={() => selectRegion('Cadera izquierda')} className={regionClass('Cadera izquierda')} cx="134" cy="272" r="12" strokeWidth="2" />
            <path onClick={() => selectRegion('Muslo derecho')} className={regionClass('Muslo derecho')} d="M78 286 L108 286 L104 336 L78 336 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Muslo izquierdo')} className={regionClass('Muslo izquierdo')} d="M112 286 L142 286 L142 336 L116 336 Z" strokeWidth="2" />
            <circle onClick={() => selectRegion('Rodilla derecha')} className={regionClass('Rodilla derecha')} cx="91" cy="346" r="11" strokeWidth="2" />
            <circle onClick={() => selectRegion('Rodilla izquierda')} className={regionClass('Rodilla izquierda')} cx="129" cy="346" r="11" strokeWidth="2" />
            <path onClick={() => selectRegion('Pierna derecha')} className={regionClass('Pierna derecha')} d="M78 356 L103 356 L101 385 L76 385 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Pierna izquierda')} className={regionClass('Pierna izquierda')} d="M117 356 L142 356 L144 385 L119 385 Z" strokeWidth="2" />
            <circle onClick={() => selectRegion('Tobillo derecho')} className={regionClass('Tobillo derecho')} cx="88" cy="386" r="8" strokeWidth="2" />
            <circle onClick={() => selectRegion('Tobillo izquierdo')} className={regionClass('Tobillo izquierdo')} cx="132" cy="386" r="8" strokeWidth="2" />
            <path onClick={() => selectRegion('Pie derecho')} className={regionClass('Pie derecho')} d="M74 365 L102 365 L98 395 L65 395 Z" strokeWidth="2" />
            <path onClick={() => selectRegion('Pie izquierdo')} className={regionClass('Pie izquierdo')} d="M118 365 L146 365 L155 395 L122 395 Z" strokeWidth="2" />
          </svg>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {bodyRegions.map((region) => (
              <button key={region} type="button" onClick={() => selectRegion(region)} className={`rounded-full border px-2 py-1 text-xs ${form.bodyRegion === region ? 'border-clinic-teal bg-teal-50 text-clinic-teal dark:bg-teal-950' : 'border-slate-200 dark:border-slate-700'}`}>{region}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <ControlledInput label="Capa anatómica" value={form.bodyLayer} onChange={(value) => updateField('bodyLayer', value)} />
          <ControlledInput label="Región seleccionada" value={form.bodyRegion} onChange={(value) => updateField('bodyRegion', value)} />
          <ControlledInput label="Diagnóstico relacionado" value={form.bodyRelatedDiagnosis} onChange={(value) => updateField('bodyRelatedDiagnosis', value)} />
          <ControlledTextArea label="Descripción clínica" value={form.bodyDescription} onChange={(value) => updateField('bodyDescription', value)} />
          <div className="flex flex-wrap gap-3">
            <ClinicalCheckbox label="Dolor" checked={form.bodyPain} onChange={(value) => updateField('bodyPain', value)} />
            <ClinicalCheckbox label="Inflamación" checked={form.bodyInflammation} onChange={(value) => updateField('bodyInflammation', value)} />
            <ClinicalCheckbox label="Lesión visible" checked={form.bodyLesion} onChange={(value) => updateField('bodyLesion', value)} />
            <ClinicalCheckbox label="Masa" checked={form.bodyMass} onChange={(value) => updateField('bodyMass', value)} />
            <ClinicalCheckbox label="Limitación funcional" checked={form.bodyFunctionalLimitation} onChange={(value) => updateField('bodyFunctionalLimitation', value)} />
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Adjuntar imagen
            <input type="file" accept="image/png,image/jpeg" onChange={(event) => updateField('bodyImageUrl', event.target.files?.[0]?.name ?? '')} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <button type="button" onClick={onSave} className="h-10 w-fit rounded-md bg-clinic-teal px-4 text-sm font-medium text-white">Guardar hallazgo</button>
          <div className="flex flex-wrap gap-2">
            {regionSummary.map((item) => (
              <span key={item.id} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-100">
                {item.layer ? `${item.layer} · ` : ''}{item.region}: {item.description || 'evaluado'}
              </span>
            ))}
          </div>
          <TimelineList items={items} primary="region" secondary="description" empty="Sin hallazgos corporales." />
        </div>
      </div>
    </section>
  );
}

const toothStatuses = ['Sano', 'Caries', 'Restaurado', 'Ausente', 'Extracción indicada', 'Endodoncia', 'Implante', 'Corona', 'Observación'];
const toothColor: Record<string, string> = {
  Sano: 'bg-emerald-50 text-emerald-800',
  Caries: 'bg-red-50 text-red-800',
  Restaurado: 'bg-blue-50 text-blue-800',
  Ausente: 'bg-slate-200 text-slate-800',
  'Extracción indicada': 'bg-orange-50 text-orange-800',
  Endodoncia: 'bg-amber-50 text-amber-800',
  Implante: 'bg-purple-50 text-purple-800',
  Corona: 'bg-cyan-50 text-cyan-800',
  Observación: 'bg-violet-50 text-violet-800',
};

function DentalPanel({ form, updateField, items, onSave }: { form: RecordForm; updateField: (field: keyof RecordForm, value: string | boolean) => void; items: ApiRecord[]; onSave: () => void }) {
  const [face, setFace] = useState('Oclusal');
  const teeth = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28','48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38'];
  const statusByTooth = Object.fromEntries(items.map((item) => [item.toothNumber, item.status]));
  const saveWithFace = () => {
    updateField('dentalObservations', appendTag(form.dentalObservations, `Cara ${face}`));
    window.setTimeout(onSave, 0);
  };
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <SectionTitle title="Odontograma simple" icon={Sparkles} />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-8 gap-2">
          {teeth.map((tooth) => (
            <button key={tooth} type="button" onClick={() => updateField('toothNumber', tooth)} className={`aspect-square rounded-md border text-sm font-medium ${form.toothNumber === tooth ? 'border-clinic-teal ring-2 ring-teal-100' : 'border-slate-200 dark:border-slate-700'} ${toothColor[statusByTooth[tooth]] ?? 'bg-white dark:bg-slate-950'}`}>
              {tooth}
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          <ControlledInput label="Pieza" value={form.toothNumber} onChange={(value) => updateField('toothNumber', value)} />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Caras dentales</p>
            <div className="grid grid-cols-3 gap-2">
              {['Mesial', 'Distal', 'Oclusal', 'Vestibular', 'Lingual'].map((item) => (
                <button key={item} type="button" onClick={() => setFace(item)} className={`rounded-md border px-2 py-1.5 text-xs ${face === item ? 'border-clinic-teal bg-teal-50 text-clinic-teal dark:bg-teal-950' : 'border-slate-200 dark:border-slate-700'}`}>{item}</button>
              ))}
            </div>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Estado
            <select value={form.toothStatus} onChange={(event) => updateField('toothStatus', event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              {toothStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <ControlledTextArea label="Descripción" value={form.dentalDescription} onChange={(value) => updateField('dentalDescription', value)} />
          <ControlledInput label="Procedimiento" value={form.dentalProcedure} onChange={(value) => updateField('dentalProcedure', value)} />
          <ControlledTextArea label="Observaciones" value={form.dentalObservations} onChange={(value) => updateField('dentalObservations', value)} />
          <button type="button" onClick={saveWithFace} className="h-10 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white">Guardar pieza</button>
          <TimelineList items={items.filter((item) => item.toothNumber === form.toothNumber)} primary="status" secondary="observations" empty="Sin historial para esta pieza." />
        </div>
      </div>
    </section>
  );
}

function ClinicalCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-clinic-teal" />
      {label}
    </label>
  );
}

function toggleSection(key: string, setOpenSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) {
  setOpenSections((current) => ({ ...current, [key]: !current[key] }));
}

function numberOrUndefined(value: string) {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function recordToForm(patientId: string, record: ApiRecord): RecordForm {
  const diagnosis = record.diagnoses?.[0] ?? {};
  const prescription = record.prescriptions?.[0] ?? {};
  const evolution = record.evolutionNotes?.[0] ?? {};
  const vitalSigns = record.vitalSigns ?? {};
  const physicalExam = record.physicalExam ?? {};

  return {
    patientId,
    recordId: record.id ?? '',
    consultationDate: toDateInput(record.consultationDate) || sampleRecord.consultationDate,
    reasonForVisit: record.reasonForVisit ?? '',
    chiefComplaint: record.chiefComplaint ?? '',
    currentIllness: record.currentIllness ?? '',
    personalPathologicalHistory: record.personalPathologicalHistory ?? record.clinicalHistory?.personalPathologicalHistory ?? '',
    personalNonPathologicalHistory: record.personalNonPathologicalHistory ?? record.clinicalHistory?.personalNonPathologicalHistory ?? '',
    surgicalHistory: record.surgicalHistory ?? record.clinicalHistory?.surgicalHistory ?? '',
    traumaticHistory: record.traumaticHistory ?? record.clinicalHistory?.traumaticHistory ?? '',
    allergicHistory: record.allergicHistory ?? record.clinicalHistory?.allergicHistory ?? '',
    currentMedications: record.currentMedications ?? record.clinicalHistory?.currentMedications ?? '',
    familyHistory: record.familyHistory ?? record.clinicalHistory?.familyHistory ?? '',
    gynecologicalObstetricHistory: record.gynecologicalObstetricHistory ?? record.clinicalHistory?.gynecologicalObstetricHistory ?? '',
    toxicHabits: record.toxicHabits ?? record.clinicalHistory?.toxicHabits ?? '',
    reviewOfSystems: record.reviewOfSystems ?? record.clinicalHistory?.reviewOfSystems ?? '',
    bloodPressure: stringify(vitalSigns.bloodPressure),
    heartRate: stringify(vitalSigns.heartRate),
    respiratoryRate: stringify(vitalSigns.respiratoryRate),
    temperature: stringify(vitalSigns.temperature),
    oxygenSaturation: stringify(vitalSigns.oxygenSaturation),
    weight: stringify(vitalSigns.weight),
    height: stringify(vitalSigns.height),
    generalAppearance: physicalExam.generalAppearance ?? '',
    heent: physicalExam.heent ?? '',
    cardiovascular: physicalExam.cardiovascular ?? '',
    respiratory: physicalExam.respiratory ?? '',
    abdomen: physicalExam.abdomen ?? '',
    extremities: physicalExam.extremities ?? '',
    neurological: physicalExam.neurological ?? '',
    mainDiagnosis: diagnosis.mainDiagnosis ?? record.diagnosisText ?? '',
    secondaryDiagnoses: diagnosis.secondaryDiagnoses ?? '',
    icd10Code: diagnosis.icd10Code ?? '',
    medicationName: prescription.medicationName ?? '',
    dose: prescription.dose ?? '',
    route: prescription.route ?? '',
    frequency: prescription.frequency ?? '',
    duration: prescription.duration ?? '',
    instructions: prescription.instructions ?? record.treatmentPlan ?? '',
    requestedLabTests: prescription.requestedLabTests ?? '',
    requestedImagingStudies: prescription.requestedImagingStudies ?? '',
    recommendations: prescription.nonPharmacologicalRecommendations ?? record.recommendations ?? '',
    followUp: record.nextAppointmentDate ? `Proxima cita: ${toDateInput(record.nextAppointmentDate)}` : '',
    noteDate: toDateInput(evolution.noteDate) || toDateInput(record.consultationDate) || sampleRecord.consultationDate,
    subjective: evolution.subjective ?? '',
    objective: evolution.objective ?? '',
    assessment: evolution.assessment ?? diagnosis.clinicalImpression ?? '',
    plan: evolution.plan ?? '',
    status: record.status ?? 'DRAFT',
    urgentFollowUp: false,
    vaccineName: record.vaccineRecords?.[0]?.vaccineName ?? 'Influenza',
    vaccineDate: toDateInput(record.vaccineRecords?.[0]?.appliedAt) || sampleRecord.consultationDate,
    vaccineNextDose: toDateInput(record.vaccineRecords?.[0]?.nextDoseAt),
    vaccineLot: record.vaccineRecords?.[0]?.lotNumber ?? '',
    vaccineObservations: record.vaccineRecords?.[0]?.observations ?? '',
    lastPeriodDate: toDateInput(record.pregnancyControls?.[0]?.lastPeriodDate),
    dueDate: toDateInput(record.pregnancyControls?.[0]?.dueDate),
    gestationalAge: record.pregnancyControls?.[0]?.gestationalAge ?? '',
    gestations: stringify(record.pregnancyControls?.[0]?.gestations),
    births: stringify(record.pregnancyControls?.[0]?.births),
    abortions: stringify(record.pregnancyControls?.[0]?.abortions),
    cesareans: stringify(record.pregnancyControls?.[0]?.cesareans),
    fetalMovements: record.pregnancyControls?.[0]?.fetalMovements ?? '',
    maternalWeight: stringify(record.pregnancyControls?.[0]?.maternalWeight),
    uterineHeight: stringify(record.pregnancyControls?.[0]?.uterineHeight),
    fetalHeartRate: stringify(record.pregnancyControls?.[0]?.fetalHeartRate),
    pregnancyObservations: record.pregnancyControls?.[0]?.observations ?? '',
    pregnancyAlerts: record.pregnancyControls?.[0]?.alerts ?? '',
    bodyView: record.bodyMapFindings?.[0]?.view ?? 'anterior',
    bodyLayer: record.bodyMapFindings?.[0]?.layer ?? 'Superficie corporal',
    bodyRegion: record.bodyMapFindings?.[0]?.region ?? 'Tórax',
    bodyDescription: record.bodyMapFindings?.[0]?.description ?? '',
    bodyRelatedDiagnosis: record.bodyMapFindings?.[0]?.relatedDiagnosis ?? '',
    bodyPain: record.bodyMapFindings?.[0]?.hasPain ?? false,
    bodyInflammation: record.bodyMapFindings?.[0]?.hasInflammation ?? false,
    bodyLesion: record.bodyMapFindings?.[0]?.hasLesion ?? false,
    bodyMass: record.bodyMapFindings?.[0]?.hasMass ?? false,
    bodyFunctionalLimitation: record.bodyMapFindings?.[0]?.hasFunctionalLimitation ?? false,
    bodyImageUrl: record.bodyMapFindings?.[0]?.imageUrl ?? '',
    toothNumber: record.dentalFindings?.[0]?.toothNumber ?? '11',
    toothStatus: record.dentalFindings?.[0]?.status ?? 'Caries',
    dentalDescription: record.dentalFindings?.[0]?.description ?? '',
    dentalProcedure: record.dentalFindings?.[0]?.procedure ?? '',
    dentalObservations: record.dentalFindings?.[0]?.observations ?? '',
    labOrderType: record.labOrders?.[0]?.orderType ?? 'Biometría hemática completa',
    labPriority: record.labOrders?.[0]?.priority ?? 'ROUTINE',
    labReason: record.labOrders?.[0]?.reason ?? '',
    imagingStudyType: record.imagingOrders?.[0]?.studyType ?? 'Ultrasonido',
    imagingPriority: record.imagingOrders?.[0]?.priority ?? 'ROUTINE',
    imagingReason: record.imagingOrders?.[0]?.reason ?? '',
    documentType: record.clinicalDocuments?.[0]?.documentType ?? 'Constancia',
    documentTitle: record.clinicalDocuments?.[0]?.title ?? 'Constancia médica',
    documentContent: record.clinicalDocuments?.[0]?.content ?? '',
    aiPrompt: '',
    aiDraft: '',
  };
}

function formToRecordSnapshot(form: RecordForm, patient: PatientSummary): ApiRecord {
  return {
    id: form.recordId || `draft-${Date.now()}`,
    patientId: form.patientId,
    patient,
    recordNumber: form.recordId ? sampleRecord.recordNumber : 'Pendiente',
    consultationDate: form.consultationDate,
    reasonForVisit: form.reasonForVisit,
    chiefComplaint: form.chiefComplaint,
    status: form.status,
    diagnoses: [{ mainDiagnosis: form.mainDiagnosis, icd10Code: form.icd10Code }],
    updatedAt: new Date().toISOString(),
  };
}

function attachmentsToUploads(attachments: ApiRecord[]): UploadItem[] {
  return attachments.map(attachmentToUpload);
}

function attachmentToUpload(attachment: ApiRecord): UploadItem {
  return {
    id: attachment.id,
    name: attachment.fileName ?? 'Archivo',
    type: attachment.mimeType ?? attachment.fileType ?? 'application/octet-stream',
    status: 'saved',
  };
}

function stringify(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function toDateInput(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function appendTag(current: string, tag: string) {
  if (current.includes(tag)) return current;
  return [current, tag].filter(Boolean).join(current ? ', ' : '');
}

function ageNumber(value: unknown) {
  if (!value) return 0;
  const birthDate = new Date(String(value));
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

function pregnancyPayload(form: RecordForm) {
  return {
    lastPeriodDate: form.lastPeriodDate || undefined,
    dueDate: form.dueDate || undefined,
    gestationalAge: form.gestationalAge,
    gestations: numberOrUndefined(form.gestations),
    births: numberOrUndefined(form.births),
    abortions: numberOrUndefined(form.abortions),
    cesareans: numberOrUndefined(form.cesareans),
    fetalMovements: form.fetalMovements,
    bloodPressure: form.bloodPressure,
    maternalWeight: numberOrUndefined(form.maternalWeight),
    uterineHeight: numberOrUndefined(form.uterineHeight),
    fetalHeartRate: numberOrUndefined(form.fetalHeartRate),
    observations: form.pregnancyObservations,
    alerts: form.pregnancyAlerts,
  };
}

function bodyMapPayload(form: RecordForm) {
  return {
    view: form.bodyView,
    layer: form.bodyLayer,
    region: form.bodyRegion,
    description: form.bodyDescription,
    relatedDiagnosis: form.bodyRelatedDiagnosis,
    hasPain: form.bodyPain,
    hasInflammation: form.bodyInflammation,
    hasLesion: form.bodyLesion,
    hasMass: form.bodyMass,
    hasFunctionalLimitation: form.bodyFunctionalLimitation,
    imageUrl: form.bodyImageUrl || undefined,
  };
}

function clinicalAlerts(patient: PatientSummary, records: ApiRecord[]) {
  const text = [patient.allergies, patient.chronicDiseases, records[0]?.diagnosisText, records[0]?.diagnoses?.[0]?.mainDiagnosis].filter(Boolean).join(' ').toLowerCase();
  const alerts = new Set<string>();
  if (patient.allergies) alerts.add('Alergias');
  if (text.includes('diabetes')) alerts.add('Diabetes');
  if (text.includes('hipert')) alerts.add('Hipertensión');
  if (text.includes('embarazo')) alerts.add('Embarazo');
  if (ageNumber(patient.birthDate) < 18) alerts.add('Pediátrico');
  if (text.includes('cardio') || text.includes('hipert') || text.includes('diabetes')) alerts.add('Riesgo cardiovascular');
  return Array.from(alerts).slice(0, 6);
}

function aiSuggestion(mode: string, form: RecordForm) {
  const base = [form.reasonForVisit, form.currentIllness, form.mainDiagnosis, form.assessment].filter(Boolean).join(' ');
  if (mode === 'Mejorar redacción') return `Redacción sugerida: ${base || 'Paciente evaluado en consulta.'}\n\nNota: validar y ajustar por criterio médico.`;
  if (mode === 'Resumir evolución') return `Resumen: ${form.subjective || 'Sin subjetivo registrado'} / ${form.objective || 'Sin objetivo registrado'} / ${form.assessment || 'Sin análisis'} / ${form.plan || 'Sin plan'}.\n\nEl médico debe validar.`;
  if (mode === 'Sugerir diferenciales') return `Posibles diferenciales para considerar, no diagnósticos automáticos: revisar causas frecuentes, signos de alarma y correlación con examen físico.\n\nBase: ${form.mainDiagnosis || form.reasonForVisit || 'sin diagnóstico principal'}.`;
  return `Plan básico sugerido para revisión médica: educación del paciente, signos de alarma, seguimiento, estudios según criterio clínico y tratamiento documentado.\n\nNo sustituye juicio médico.`;
}

function formatDate(value: unknown) {
  const dateValue = toDateInput(value);
  return dateValue || 'No registrado';
}

function ageFromBirthDate(value: unknown) {
  if (!value) return samplePatient.age;
  const birthDate = new Date(String(value));
  if (Number.isNaN(birthDate.getTime())) return samplePatient.age;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return `${age} años`;
}
