/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        obsidian: '#050505',
        graphite: '#111214',
        panel: '#16181d',
        line: 'rgba(255,255,255,0.1)'
      },
      boxShadow: {
        glow: '0 0 36px rgba(120, 119, 255, 0.18)'
      }
    }
  },
  plugins: []
};
