import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        forest: {
          DEFAULT: "var(--green)",
          hover: "#103e31",
          dark: "#16392e",
        },
        paper: "var(--paper)",
        muted: "var(--muted)",
        line: "var(--line)",
        focus: "#ad7b36",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
      maxWidth: {
        container: "1240px",
      },
    },
  },
  plugins: [],
};
export default config;
