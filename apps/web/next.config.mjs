import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(currentDirectory, '../..'),
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/keyser-prototype/index.html' },
        { source: '/servicios', destination: '/keyser-prototype/index.html' },
        { source: '/promociones', destination: '/keyser-prototype/index.html' },
        { source: '/noticias', destination: '/keyser-prototype/index.html' },
        { source: '/contacto', destination: '/keyser-prototype/index.html' },
        { source: '/preguntas', destination: '/keyser-prototype/index.html' },
      ],
    };
  },
};

export default nextConfig;
