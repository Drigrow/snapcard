/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f8',
          500: '#0e8ceb',
          600: '#026ec9',
          700: '#0358a3',
          800: '#074b86',
          900: '#0c3f6f',
          950: '#082849',
        },
        cardBg: {
          light: '#ffffff',
          dark: '#12141a',
        },
        surface: {
          light: '#f8fafc',
          dark: '#181b22',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 2px 8px 0 rgba(0, 0, 0, 0.2)',
        'card-glow': '0 0 40px -10px rgba(14, 140, 235, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
