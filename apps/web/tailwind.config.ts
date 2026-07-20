import type { Config } from "tailwindcss";

/**
 * Maps to the locked palette in ARCHITECTURE.md ("Design system"). Values
 * themselves live in app/globals.css as CSS custom properties (raw hex, not
 * HSL triplets — avoids error-prone hex->HSL conversion while staying
 * exactly faithful to the locked hex values).
 */
const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
        },
        border: "var(--border)",
        muted: {
          DEFAULT: "var(--surface-secondary)",
          foreground: "var(--text-muted)",
        },
        faint: "var(--text-faint)",
        accent: {
          tint: "var(--accent-tint)",
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "#FFFFFF",
        },
        success: { DEFAULT: "var(--success)", bg: "var(--success-bg)" },
        warning: { DEFAULT: "var(--warning)", bg: "var(--warning-bg)" },
        destructive: { DEFAULT: "var(--destructive)", bg: "var(--destructive-bg)", foreground: "#FFFFFF" },
        card: "var(--surface)",
        input: "var(--border)",
        ring: "var(--accent)",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
