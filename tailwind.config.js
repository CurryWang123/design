/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'beauty-pink': '#FF0080',
        'beauty-purple': '#7928CA',
        'beauty-gold': '#D4AF37',
        'beauty-cream': '#FFF5F7',
        'beauty-ink': '#1A1A1A',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
