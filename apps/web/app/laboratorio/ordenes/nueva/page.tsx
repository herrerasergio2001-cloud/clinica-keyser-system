'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SaveIcon, XCircle } from 'lucide-react';
import { Button, LoadingSkeleton } from '@clinic/ui';
import { LabShell } from '../../_components/lab-shell-wrapper';
import { ExamSearch } from '../../_components/exam-search';
import { PatientInfoCard } from '../../_components/patient-info-card';
import { OrderCart } from '../../_components/order-cart';
import { SearchInput } from '@clinic/ui';

interface Patient {
  id: string;
  fullName: string;
  patientCode: string;
  idNumber?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  phone?: string;
  city?: string;
  allergies?: string[];
  creditLimit?: number;
  creditUsed?: number;
}

interface Exam {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string;
}

interface ExamProfile {
  id: string;
  name: string;
  exams: Exam[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Page() {
  const router = useRouter();

  // Mock data
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([
    { id: '1', name: 'Hemograma Completo', code: 'HC001', price: 250, category: 'Hematología' },
    { id: '2', name: 'Química Sanguínea', code: 'QS001', price: 350, category: 'Química Clínica' },
    { id: '3', name: 'Perfil Lipídico', code: 'PL001', price: 300, category: 'Química Clínica' },
    { id: '4', name: 'Glucosa', code: 'GL001', price: 100, category: 'Química Clínica' },
    { id: '5', name: 'Prueba de VIH', code: 'VH001', price: 500, category: 'Serología' },
    { id: '6', name: 'Prueba de COVID-19', code: 'CV001', price: 400, category: 'Virología' },
  ]);
  const [profiles] = useState<ExamProfile[]>([
    {
      id: 'p1',
      name: 'Check-up Básico',
      exams: [exams[0], exams[1]],
    },
    {
      id: 'p2',
      name: 'Perfil Cardiovascular',
      exams: [exams[2], exams[3]],
    },
  ]);
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patients] = useState<Patient[]>([
    {
      id: 'p1',
      fullName: 'Juan Pérez García',
      patientCode: 'CK-000001',
      age: 45,
      phone: '8495-2200',
      city: 'Managua',
      creditLimit: 5000,
      creditUsed: 1200,
    },
    {
      id: 'p2',
      fullName: 'María López Rodríguez',
      patientCode: 'CK-000002',
      age: 32,
      phone: '7650-7993',
      city: 'Chinandega',
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const handlePatientSearch = (query: string) => {
    setPatientSearchLoading(true);
    setTimeout(() => {
      setPatientSearchResults(
        patients
          .filter(
            (p) =>
              p.fullName.toLowerCase().includes(query.toLowerCase()) ||
              p.patientCode.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
      );
      setPatientSearchLoading(false);
    }, 300);
  };

  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setPatientSearchResults([]);
    }
  };

  const handleAddExam = (exam: Exam) => {
    const existing = cartItems.find((item) => item.id === exam.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === exam.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([...cartItems, { id: exam.id, name: exam.name, price: exam.price, quantity: 1 }]);
    }
  };

  const handleAddProfile = (profile: ExamProfile) => {
    profile.exams.forEach((exam) => handleAddExam(exam));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      setCartItems(cartItems.filter((item) => item.id !== id));
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
    }
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const handleSaveOrder = async () => {
    if (!selectedPatient || cartItems.length === 0) {
      alert('Selecciona un paciente y añade exámenes a la orden');
      return;
    }

    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      alert('Orden creada exitosamente');
      router.push('/laboratorio/ordenes');
    }, 1000);
  };

  return (
    <LabShell
      title="Nueva Orden"
      subtitle="Crear Nueva Orden de Laboratorio"
      description="Busca el paciente, selecciona los exámenes y guarda la orden"
      showBack
      breadcrumbs={[
        { label: 'Laboratorio', href: '/laboratorio' },
        { label: 'Órdenes', href: '/laboratorio/ordenes' },
        { label: 'Nueva Orden', href: '/laboratorio/ordenes/nueva' },
      ]}
    >
      <div className="space-y-6">
        {/* Patient Search (Full Width) */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Buscar Paciente
          </label>
          <SearchInput
            placeholder="Ingresa nombre o código del paciente..."
            onSearch={handlePatientSearch}
            onSelect={handleSelectPatient}
            suggestions={patientSearchResults.map((patient) => ({
              id: patient.id,
              label: patient.fullName,
              description: `${patient.patientCode} ${patient.age ? `· ${patient.age} años` : ''}`,
            }))}
            loading={patientSearchLoading}
            autoFocus
            className="w-full"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Patient Info + Exams (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info Card */}
            {selectedPatient ? (
              <PatientInfoCard patient={selectedPatient} />
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center dark:border-slate-600">
                <p className="text-slate-600 dark:text-slate-400">
                  Selecciona un paciente para comenzar
                </p>
              </div>
            )}

            {/* Exam Search */}
            <ExamSearch
              exams={exams}
              profiles={profiles}
              onAddExam={handleAddExam}
              onAddProfile={handleAddProfile}
              onSearch={(query) => {
                const results = exams.filter(
                  (e) =>
                    e.name.toLowerCase().includes(query.toLowerCase()) ||
                    e.code.toLowerCase().includes(query.toLowerCase())
                );
                // For now, just filter client-side
              }}
              searchResults={exams}
              searchLoading={false}
            />
          </div>

          {/* Right: Order Cart (1 col) */}
          <div className="lg:col-span-1">
            <OrderCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {selectedPatient && cartItems.length > 0 && (
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="primary"
              size="lg"
              isLoading={isSaving}
              onClick={handleSaveOrder}
              className="flex-1"
            >
              <SaveIcon className="h-5 w-5" />
              Guardar Orden
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setSelectedPatient(null);
                setCartItems([]);
              }}
            >
              <XCircle className="h-5 w-5" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </LabShell>
  );
}
