'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

export type MasterAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

export function MasterActionMenu({ actions }: { actions: MasterAction[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    function closeOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', closeWithEscape);
    document.addEventListener('mousedown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeWithEscape);
      document.removeEventListener('mousedown', closeOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {actions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <item.icon className="h-4 w-4 text-clinic-teal" />
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label={open ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-clinic-teal text-white shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-200"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
      </button>
    </div>
  );
}
