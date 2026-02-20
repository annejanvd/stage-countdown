/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}"
  ],
  theme: {
    extend: {
      colors: {
        /* Base */
        "bg-base": "#4F4F4D",

        /* Text hierarchy */
        "text-hero": "#FFFFFF",
        "text-primary": "#F3F3EF",
        "text-secondary": "#DADAD4",
        "text-muted": "#BEBEB7",
        "text-inverse": "#121212",

        /* Website status */
        "status-online": "#59C27A",
        "status-warning": "#E0A24F",
        "status-offline": "#D85C5C",

        /* Temperature */
        "temp-cold": "#5DA9E9",
        "temp-normal": "#78B882",
        "temp-hot": "#E07A3F",

        /* Music */
        "music-accent": "#6F8EDC"
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    }
  },
  plugins: []
}
