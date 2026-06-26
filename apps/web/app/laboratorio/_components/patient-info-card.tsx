'use client';

import React, { useState } from 'react';
import { ChevronDown, Calendar, MapPin, Phone, User, AlertCircle } from 'lucide-react';
import { Badge } from '@clinic/ui';

interface PatientInfo {
  id: string;
  fullName: string;
  patientCode: string;
  idNumber?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  category?: string;
  insurance?: string;
  allergies?: string[];
  notes?: string;
  creditLimit?: number;
  creditUsed?: number;
}

interface PatientInfoCardProps {
  patient: PatientInfo | null;
  loading?: boolean;
  expanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  className?: string;
}

export function PatientInfoCard({
  patient,
  loading = false,
  expanded: initialExpanded = false,
  onToggleExpand,
  className = '',
}: PatientInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggleExpand?.(newState);
  };

  if (!patient) {
    return null;
  }

  const creditUsagePercent = patient.creditLimit
    ? Math.round((patient.creditUsed ?? 0) / patient.creditLimit * 100)
    : 0;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Collapsed Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="text-left flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {patient.fullName}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {patient.patientCode} {patient.age && `· ${patient.age} años`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {patient.category && (
            <Badge
              variant="info"
              label={patient.category}
            />
          )}
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900 space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            {patient.phone && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {patient.phone}
                </p>
              </div>
            )}
            {patient.city && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {patient.city}
                </p>
              </div>
            )}
          </div>

          {/* Insurance & Credit */}
          {(patient.insurance || patient.creditLimit) && (
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              {patient.insurance && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Seguro</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                    {patient.insurance}
                  </p>
                </div>
              )}
              {patient.creditLimit && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Crédito</p>
                    <span className="text-xs font-medium">
                      {creditUsagePercent}% usado
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-clinic-teal h-2 rounded-full transition-all"
                      style={{ width: `${creditUsagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    C$ {patient.creditUsed?.toFixed(2) ?? '0.00'} / C$ {patient.creditLimit.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                Alergias
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {patient.allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="warning"
                    label={allergy}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {patient.notes && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">Notas</p>
              <p className="text-sm text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">
                {patient.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
