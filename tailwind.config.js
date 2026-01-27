/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        pearl: '#FEFEFE',
        darkgreen: '#1B4332',
        lightgold: '#D4AF37',
        brightorange: '#FF8C42',
        lightorange: '#FFE5D4',
        lightgreen: '#E8F5E9',
      },
    },
  },
  plugins: [],
};
