import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        clinic: {
          teal: '#1f2f66',
          mint: '#eef2ff',
          ink: '#10212b',
          coral: '#ef2f32',
        },
      },
    },
  },
  plugins: [],
};

export default config;
