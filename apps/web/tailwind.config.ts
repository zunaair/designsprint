import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'Tahoma', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fef2f4',
          100: '#fde6ea',
          200: '#E6BCC5',
          400: '#e03050',
          500: '#C7052D',
          600: '#9B0423',
          700: '#7a031b',
          dark: '#1A1A2E',
        },
      },
      borderOpacity: {
        8: '0.08',
      },
      animation: {
        'spin-slow':   'spin 3s linear infinite',
        'pulse-fast':  'pulse 0.8s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
