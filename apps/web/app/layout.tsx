import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clínica Keyser | Atención médica integral en Chinandega',
  description: 'Clínica Keyser: medicina general, ultrasonido, laboratorio, pediatría, ginecología, estética y servicios médicos en Chinandega.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
