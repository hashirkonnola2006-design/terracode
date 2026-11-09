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
        space: {
          950: '#030712',
          900: '#060b16',
          850: '#081020',
          800: '#0b162c',
          700: '#112244',
        },
        eco: {
          light: '#86efac',
          DEFAULT: '#4ade80',
          glow: '#22c55e',
          dark: '#16a34a',
          emerald: '#10b981',
          cyan: '#06b6d4',
        },
        polluted: {
          dark: '#1c1917',
          gray: '#44403c',
          smog: '#78716c',
          rust: '#9a3412',
          haze: '#ca8a04',
        }
      },
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        label: ['var(--font-label)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 40px -10px rgba(74, 222, 128, 0.45)',
        'glow-green-lg': '0 0 60px -5px rgba(74, 222, 128, 0.6)',
        'glow-smog': '0 0 40px -10px rgba(180, 83, 9, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
