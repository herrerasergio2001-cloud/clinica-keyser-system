'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  placeholder: string;
  onSearch: (query: string) => void;
  onSelect?: (value: string) => void;
  suggestions?: Array<{ id: string; label: string; description?: string }>;
  loading?: boolean;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
}

export function SearchInput({
  placeholder,
  onSearch,
  onSelect,
  suggestions = [],
  loading = false,
  debounceMs = 300,
  autoFocus = false,
  className = '',
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.length > 0) {
      timeoutRef.current = setTimeout(() => {
        onSearch(value);
        setShowSuggestions(true);
      }, debounceMs);
    } else {
      setShowSuggestions(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, onSearch, debounceMs]);

  const handleClear = () => {
    setValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSelect = (suggestion: typeof suggestions[0]) => {
    setValue(suggestion.label);
    setShowSuggestions(false);
    onSelect?.(suggestion.id);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => value.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 text-base border border-slate-300 rounded-lg focus:border-clinic-teal focus:outline-none focus:ring-2 focus:ring-clinic-teal/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 dark:bg-slate-800 dark:border-slate-700">
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                Buscando...
              </div>
            )}
            {!loading && suggestions.length === 0 && value.length > 0 && (
              <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                No se encontraron resultados
              </div>
            )}
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-slate-900 dark:text-white">
                  {suggestion.label}
                </div>
                {suggestion.description && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {suggestion.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
