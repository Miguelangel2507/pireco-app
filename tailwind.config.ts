import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A8A',
          50:  '#eff4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#1E3A8A',
          800: '#1a3480',
          900: '#162d6e',
        },
        accent: {
          DEFAULT: '#3D7BFF',
          light: '#6C9FFF',
          dark:  '#2860E0',
        },
        // Semantic surface tokens (resolved via CSS vars)
        app: {
          bg:      'var(--bg)',
          surface: 'var(--surface)',
          border:  'var(--border)',
          text:    'var(--text)',
          sub:     'var(--text-sub)',
        },
      },
      fontFamily: {
        sans:        ['Montserrat', 'sans-serif'],
        montserrat:  ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        card:   '12px',
        chip:   '20px',
        btn:    '8px',
      },
      fontSize: {
        // Spec: "tamaños contenidos, nada de fuentes grandes"
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs':  ['11px', { lineHeight: '16px' }],
        'sm':  ['12px', { lineHeight: '18px' }],
        'base':['13px', { lineHeight: '20px' }],
        'lg':  ['15px', { lineHeight: '22px' }],
        'xl':  ['17px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
      },
    },
  },
  plugins: [],
}
export default config
