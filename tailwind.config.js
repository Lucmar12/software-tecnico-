/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette istituzionale/tecnica
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#599dff',
          500: '#3479f6',
          600: '#1f5ae3',
          700: '#1a48c4',
          800: '#1b3d9f',
          900: '#1c377e',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
