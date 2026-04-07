/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        para: {
          blue: '#0071ce',   // Azul Institucional
          red: '#EB2939',    // Vermelho Institucional
        },
      },
      fontFamily: {
        sans: ['Avenir Next', 'sans-serif'], // Fonte oficial
      },
    },
  },
  plugins: [],
};