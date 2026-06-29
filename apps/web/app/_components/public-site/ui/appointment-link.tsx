import { ReactNode } from 'react';
import type { Settings } from '../types';
import { whatsappUrl } from '../utils';

export function AppointmentLink({ settings, className, children }: { settings: Settings; className: string; children: ReactNode }) {
  return <a href={whatsappUrl(settings, 'Hola Clínica Keyser, deseo agendar una cita.')} target="_blank" rel="noreferrer" className={className}>{children}</a>;
}
