/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2E7D32',
          darkGreen: '#1B5E20',
          lime: '#AEEA00'
        }
      }
    },
  },
  plugins: [],
}
