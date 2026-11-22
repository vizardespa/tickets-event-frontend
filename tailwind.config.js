/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        brunson: ['Brunson', 'sans-serif'],
        'brunson-rough': ['Brunson Rough', 'sans-serif'],
        coolvetica: ['Coolvetica', 'sans-serif'],
        'coolvetica-condensed': ['Coolvetica Condensed', 'sans-serif'],
        'coolvetica-crammed': ['Coolvetica Crammed', 'sans-serif'],
        'coolvetica-heavy-compressed': ['Coolvetica Heavy Compressed', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
