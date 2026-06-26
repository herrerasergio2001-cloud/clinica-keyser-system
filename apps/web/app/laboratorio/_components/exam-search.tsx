'use client';

import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { SearchInput, Button } from '@clinic/ui';

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

interface ExamSearchProps {
  exams: Exam[];
  profiles: ExamProfile[];
  onAddExam: (exam: Exam) => void;
  onAddProfile: (profile: ExamProfile) => void;
  onSearch: (query: string) => void;
  searchResults: Exam[];
  searchLoading?: boolean;
  className?: string;
}

export function ExamSearch({
  exams,
  profiles,
  onAddExam,
  onAddProfile,
  onSearch,
  searchResults,
  searchLoading = false,
  className = '',
}: ExamSearchProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = [...new Set(exams.map((e) => e.category))];
  const filteredExams = selectedCategory
    ? exams.filter((e) => e.category === selectedCategory)
    : exams.slice(0, 12); // Show top 12 by default

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div>
        <SearchInput
          placeholder="Buscar examen por nombre o código..."
          onSearch={onSearch}
          suggestions={searchResults.map((exam) => ({
            id: exam.id,
            label: exam.name,
            description: `${exam.code} · C$ ${exam.price.toFixed(2)}`,
          }))}
          loading={searchLoading}
          onSelect={(examId) => {
            const exam = exams.find((e) => e.id === examId);
            if (exam) onAddExam(exam);
          }}
          autoFocus
        />
      </div>

      {/* Profiles (Quick Templates) */}
      {profiles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
            Perfiles Rápidos
          </p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => onAddProfile(profile)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-clinic-teal/10 text-clinic-teal hover:bg-clinic-teal/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Zap className="h-4 w-4" />
                {profile.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
            Categorías
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedCategory === ''
                  ? 'bg-clinic-teal text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-clinic-teal text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exam List */}
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
          Exámenes Disponibles
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filteredExams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => onAddExam(exam)}
              className="p-3 text-left border border-slate-200 rounded-lg hover:border-clinic-teal hover:bg-blue-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{exam.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {exam.code}
                  </p>
                </div>
                <Plus className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
              </div>
              <p className="text-sm font-semibold text-clinic-teal mt-2">
                C$ {exam.price.toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
