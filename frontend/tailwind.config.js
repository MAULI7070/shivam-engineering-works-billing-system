/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'govt-navy':  '#003366',
        'govt-blue':  '#00509E',
        'govt-amber': '#F5A623',
        'govt-light': '#E8F0FE',
        'govt-green': '#1A6B3C',
        'govt-red':   '#C0392B',
        'govt-gray':  '#F4F6F8',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
