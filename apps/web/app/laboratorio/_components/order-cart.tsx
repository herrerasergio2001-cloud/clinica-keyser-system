'use client';

import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Badge } from '@clinic/ui';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  className?: string;
}

export function OrderCart({ items, onUpdateQuantity, onRemoveItem, className = '' }: OrderCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-6 sticky top-6 dark:bg-slate-800 dark:border-slate-700 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Resumen de Orden
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
          Añade exámenes a la orden
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  C$ {item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                  disabled={item.quantity === 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Summary */}
      {items.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
            <span className="font-medium">C$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Impuesto (15%):</span>
            <span className="font-medium">C$ {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-clinic-teal pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Total:</span>
            <span>C$ {total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
