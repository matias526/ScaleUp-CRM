import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0055B8", // ScaleUp blue primary
          foreground: "#FFFFFF",
          light: "#00A0E3", // ScaleUp blue secondary
          dark: "#004494", // Darker version of ScaleUp blue
        },
        secondary: {
          DEFAULT: "#82868B", // Materio secondary color
          foreground: "#FFFFFF",
          light: "#A8AAAD",
          dark: "#5E6266",
        },
        success: {
          DEFAULT: "#28C76F", // Materio success color
          foreground: "#FFFFFF",
          light: "#48DA89",
          dark: "#1F9D57",
        },
        info: {
          DEFAULT: "#00CFE8", // Materio info color
          foreground: "#FFFFFF",
          light: "#33D9ED",
          dark: "#00A1B5",
        },
        warning: {
          DEFAULT: "#FF9F43", // Materio warning color
          foreground: "#FFFFFF",
          light: "#FFB976",
          dark: "#FF8510",
        },
        error: {
          DEFAULT: "#EA5455", // Materio error color
          foreground: "#FFFFFF",
          light: "#EF7A7B",
          dark: "#E42728",
        },
        destructive: {
          DEFAULT: "#EA5455",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(34, 41, 47, 0.1)",
        "card-hover": "0 6px 30px 0 rgba(34, 41, 47, 0.15)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
