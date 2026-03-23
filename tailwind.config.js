/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          navy: '#131921',
          light: '#232F3E',
        },
        skeuo: {
          bg: '#F5F5F7',
          highlight: '#FFFFFF',
          shadow: '#D1D1D4',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
      },
      boxShadow: {
        'skeuo-outset': '8px 8px 16px #d1d1d4, -8px -8px 16px #ffffff',
        'skeuo-inset': 'inset 6px 6px 10px #d1d1d4, inset -6px -6px 10px #ffffff',
        'skeuo-pressed': 'inset 4px 4px 8px #d1d1d4, inset -4px -4px 8px #ffffff',
        'skeuo-sm': '4px 4px 8px #d1d1d4, -4px -4px 8px #ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}