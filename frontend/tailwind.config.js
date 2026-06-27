/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // <-- Added ** to catch subfolders like onboarding
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'light-mesh': 'radial-gradient(at 0% 0%, rgba(243,244,246,1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(219,234,254,1) 0px, transparent 50%)',
        'dark-mesh': 'radial-gradient(at 0% 0%, rgba(13,18,30,1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(21,28,45,1) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}