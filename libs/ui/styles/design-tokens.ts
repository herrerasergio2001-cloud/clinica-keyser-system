/**
 * Clinic-wide design tokens and color system
 */

export const colors = {
  // Brand colors
  primary: '#1f2f66',      // Navy
  accent: '#087f8c',       // Teal
  danger: '#ef2f32',       // Red

  // Status colors
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  error: '#ef4444',        // Red
  info: '#3b82f6',         // Blue

  // Status-specific
  statusActive: '#10b981',     // Green
  statusDraft: '#6b7280',      // Gray
  statusPending: '#f59e0b',    // Amber
  statusCancelled: '#ef4444',  // Red
  statusVoided: '#374151',     // Dark gray

  // Priority-specific
  priorityRoutine: '#3b82f6',  // Blue
  priorityUrgent: '#f97316',   // Orange
  priorityStat: '#dc2626',     // Red

  // Critical values
  criticalLow: '#dc2626',
  criticalHigh: '#dc2626',

  // Neutral scale
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
};

export const typography = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3rem',
  '4xl': '4rem',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

export const radius = {
  sm: '0.375rem',
  base: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
};
