/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Discord blurple
        primary: {
          50:  '#eef0fd',
          100: '#d9dcfa',
          200: '#b3baf5',
          300: '#8893f4',
          400: '#7289da',
          500: '#5865f2',
          600: '#4752c4',
          700: '#3c45a5',
          800: '#303d8a',
          900: '#23306e',
          950: '#161d4a',
        },
        // Discord surface scale (dark mode reference)
        surface: {
          50:  '#f2f3f5',
          100: '#e3e5e8',
          200: '#d4d7dc',
          300: '#c7ccd1',
          400: '#80848e',
          500: '#4e5058',
          600: '#3f4147',
          700: '#35373c',
          800: '#313338',
          900: '#2b2d31',
          950: '#1e1f22',
        },
        // Semantic tokens via CSS variables — auto light/dark
        c: {
          bg:      'var(--c-bg)',
          sidebar: 'var(--c-sidebar)',
          card:    'var(--c-card)',
          border:  'var(--c-border)',
          hover:   'var(--c-hover)',
          active:  'var(--c-active)',
          text:    'var(--c-text)',
          soft:    'var(--c-soft)',
          muted:   'var(--c-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'panel':   '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'glow':    '0 0 20px rgba(88,101,242,0.35)',
        'glow-sm': '0 0 10px rgba(88,101,242,0.25)',
      },
      animation: {
        'slide-up':   'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
        'slide-in':   'slideIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.15s ease-out',
        'scale-in':   'scaleIn 0.15s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp:   { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)',    opacity: '1' } },
        slideIn:   { '0%': { transform: 'translateX(-8px)', opacity: '0' }, '100%': { transform: 'translateX(0)',    opacity: '1' } },
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn:   { '0%': { transform: 'scale(0.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
}
