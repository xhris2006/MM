/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        'gold-light': '#E8C97A',
        'gold-dark': '#9A7A30',
        deep: '#0A0A0F',
        surface: '#12121A',
        card: '#1A1A26',
        card2: '#20202E',
        miss: '#D4547A',
        master: '#4A8FD4',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
