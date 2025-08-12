/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1220',
        surface: '#0f172a',
        muted: '#1f2937',
        border: '#1f2937',
        primary: {
          DEFAULT: '#60a5fa',
          foreground: '#0b1220'
        },
        secondary: {
          DEFAULT: '#34d399',
          foreground: '#0b1220'
        },
        accent: '#a78bfa',
        text: '#e5e7eb',
        subtext: '#94a3b8'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
} 