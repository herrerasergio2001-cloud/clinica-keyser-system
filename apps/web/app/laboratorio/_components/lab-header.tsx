'use client';

import React from 'react';
import {
  Search,
  FilePlus,
  Beaker,
  Settings,
  Printer,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { Button } from '@clinic/ui';

interface LabHeaderProps {
  onSearch: () => void;
  onNewOrder: () => void;
  onAddExam: () => void;
  onReagents: () => void;
  onPrintLabels: () => void;
  onReprint: () => void;
  onSettings: () => void;
}

export function LabHeader({
  onSearch,
  onNewOrder,
  onAddExam,
  onReagents,
  onPrintLabels,
  onReprint,
  onSettings,
}: LabHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Main Title */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Laboratorio</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Sistema de Información de Laboratorio (LIS)</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
        <Button
          variant="primary"
          size="md"
          onClick={onSearch}
          className="flex-col h-auto py-4 text-center"
        >
          <Search className="h-6 w-6 mb-2 mx-auto" />
          <span className="text-xs">Buscar<br />Paciente</span>
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onNewOrder}
          className="flex-col h-auto py-4 text-center"
        >
          <FilePlus className="h-6 w-6 mb-2 mx-auto" />
          <span className="text-xs">Nueva<br />Orden</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onAddExam}
          className="flex-col h-auto py-4 text-center"
        >
          <Beaker className="h-6 w-6 mb-2 mx-auto" />
          <span className="text-xs">Agregar<br />Examen</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onReagents}
          className="flex-col h-auto py-4 text-center"
        >
          <RotateCcw className="h-6 w-6 mb-2 mx-auto" />
          <span className="text-xs">Reactivos</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onPrintLabels}
          className="flex-col h-auto py-4 text-center"
        >
          <Printer className="h-6 w-6 mb-2 mx-auto" />
          <span className="text-xs">Imprimir<br />Etiquetas</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onReprint}
          className="flex-col h-auto py-4 text-center"
        >
          <RotateCcw className="h-6 w-6 mb-2 mx-auto" />
          <span className="text-xs">Reimprimir<br />Resultados</span>
        </Button>
      </div>
    </div>
  );
}
