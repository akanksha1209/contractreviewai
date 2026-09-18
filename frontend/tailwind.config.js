/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep forest greens — reference palette
        ink: {
          950: "#0f2a20", // deepest background
          900: "#132f24", // main background
          850: "#18392c", // panel background
          800: "#1a3a2e", // card background
          750: "#204638", // hover / raised
          700: "#2e5744", // border
          600: "#3a6650", // border hover
          500: "#4d7a63", // muted border
        },
        paper: {
          100: "#f5f7f4", // primary text
          200: "#e2e8e0", // secondary text
          300: "#c7d2c9", // muted
          400: "#a8b5a8", // dim
          500: "#7a8879", // very dim
        },
        accent: {
          DEFAULT: "#d4f34a", // lime — primary accent
          soft: "#c2e035",     // darker lime (hover)
          dim: "#6b7a1f",      // subtle lime for backgrounds
        },
        danger: "#ef4444",
        warn: "#fbbf24",
        ok: "#4ade80",
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"Manrope"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        xxs: ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};
