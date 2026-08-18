/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:   { DEFAULT: '#f3ecdd', 2: '#ece2cd', 3: '#e4d8bf' },
        card:    '#fbf7ee',
        ink:     { DEFAULT: '#21281f', soft: '#4c5347' },
        forest:  '#1b4436',
        teal:    '#2c6a5b',
        moss:    '#6f7a45',
        ochre:   '#c07a2b',
        amber:   '#de9426',
        rust:    '#a4441e',
        sky:     '#35617a',
        line:    { DEFAULT: 'rgba(33,40,31,0.14)', strong: 'rgba(33,40,31,0.28)' },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        ui: ['Archivo', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'monospace'],
      },
      boxShadow: {
        field: '0 18px 50px -18px rgba(27,38,30,0.45)',
      },
    },
  },
  plugins: [],
};
