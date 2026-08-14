/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0d0d0d',
          900: '#141414',
          800: '#1c1c1c',
          700: '#262626',
          600: '#333333',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f9f6f0',
          200: '#f2ede3',
          300: '#e8e0d0',
        },
        clay: {
          100: '#f5ede8',
          200: '#ecd9d0',
          300: '#dfc4b8',
          400: '#c9a090',
          500: '#b07d6c',
          600: '#8f5e50',
        },
        rose: {
          soft: '#e8c4bb',
        },
        gold: {
          soft: '#c9b48a',
          muted: '#a8926a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
