/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        devanagari: [
          '"Noto Sans Devanagari"',
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
