/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Renault Sunlight Yellow & Monochromes
        renault: {
          yellow: '#ffed00',
          'yellow-deep': '#e6d200',
          ink: '#000000',
          dark: '#000000',
          deep: '#111111',
          card: '#161616',
          charcoal: '#222222',
          mute: '#666666',
          ash: '#8a8a8a',
          stone: '#c4c4c4',
          hairline: 'rgba(255, 255, 255, 0.14)',
          'hairline-subtle': 'rgba(255, 255, 255, 0.08)',
        },
        brand: {
          500: '#ffed00',
          600: '#e6d200',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Manrope', 'sans-serif'],
        display: ['"Inter Tight"', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '3px',
        md: '4px',
        pill: '46px',
        full: '9999px',
      },
      lineHeight: {
        tightest: '0.95',
      },
    },
  },
  plugins: [],
}
