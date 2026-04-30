/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        light: "var(--color-light)",
        dark: "var(--color-dark)",
        neutral: "var(--color-neutral)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        coinbase: {
          blue: "var(--cb-blue)",
          hover: "var(--cb-hover-blue)",
          link: "var(--cb-link-blue)",
          text: "var(--cb-text)",
          dark: "var(--cb-dark)",
          darkCard: "var(--cb-dark-card)",
          light: "var(--cb-light)",
          surface: "var(--cb-surface)",
          border: "var(--cb-muted-border)",
        },
      },
      fontFamily: {
        roboto: ["Nunito", "sans-serif"],
        fredoka: ["Fredoka", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        display: [
          "Fredoka",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Nunito",
          "Inter",
          "Avenir Next",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        text: [
          "Nunito",
          "Inter",
          "Georgia",
          "system-ui",
          "sans-serif",
        ],
        icons: ["CoinbaseIcons", "Material Symbols Rounded", "sans-serif"],
      },
      borderRadius: {
        coinbase: "56px",
        "coinbase-xl": "40px",
        "coinbase-full": "100000px",
      },
      screens: {
        xs: "400px",
        smx: "576px",
        mdx: "640px",
        lgx: "896px",
        "2xlx": "1440px",
        "3xl": "1600px",
      },
      lineHeight: {
        display: "1",
        "section-tight": "1.11",
      },
      letterSpacing: {
        "button-tight": "0.16px",
      },
    },
  },
  plugins: [],
};
