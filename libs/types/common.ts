/**
 * Common types used across all modules
 */

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

export interface MutationState extends LoadingState {
  isSubmitting: boolean;
}

export interface FormState {
  isDirty: boolean;
  isValid: boolean;
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ColumnDef<T = any> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export type BadgeVariant =
  | 'status-active'
  | 'status-draft'
  | 'status-pending'
  | 'status-cancelled'
  | 'status-voided'
  | 'priority-routine'
  | 'priority-urgent'
  | 'priority-stat'
  | 'critical-low'
  | 'critical-high'
  | 'warning'
  | 'success'
  | 'info';

export interface ActionButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void | Promise<void>;
  danger?: boolean;
  disabled?: boolean;
}

export interface ModalAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}
