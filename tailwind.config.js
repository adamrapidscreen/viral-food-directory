/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        background: '#0f172a', // Slate 950
        surface: {
          DEFAULT: 'rgba(30, 41, 59, 0.9)', // Slate 800 with 90% opacity
          solid: '#1e293b', // Slate 800 solid
        },
        accent: {
          viral: '#f43f5e', // Rose 500 for Love/Viral actions
          match: '#10b981', // Emerald 500 for high match scores
        },
        // Luxury Editorial Theme Colors
        pearl: '#f8fafc', // A very light slate/white
        emerald: {
          rich: '#022c22', // The darkest green for cards
          light: '#34d399', // Bright green for highlights
        },
        gold: {
          accent: '#fbbf24', // Amber for stars
        },
      },
      borderRadius: {
        DEFAULT: '1rem', // xl (16px)
        '2xl': '1.5rem', // 2xl (24px)
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
