/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app, #090a0f)',
        surface: 'var(--bg-surface, #11141d)',
        'surface-card': 'var(--bg-card, #181c28)',
        'surface-border': 'var(--border-color, #334155)',
        primary: 'var(--accent-primary, #f59e0b)',
        'primary-gold': 'var(--accent-primary-hover, #ffc174)',
        'on-primary': 'var(--text-on-primary, #090a0f)',
        magic: 'var(--accent-magic, #8b5cf6)',
        emerald: 'var(--accent-emerald, #10b981)',
        crimson: 'var(--accent-crimson, #ef4444)'
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        'cinzel-dec': ['Cinzel Decorative', 'serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif']
      }
    }
  },
  plugins: []
};
