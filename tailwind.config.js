/**  @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#800000',
          light: '#A00000',
          dark: '#600000',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          light: '#F0F0F0',
          dark: '#E0E0E0',
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
 