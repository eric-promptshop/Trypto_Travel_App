import type { Config } from "tailwindcss"

const config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        // TripNav Brand Colors
        brand: {
          blue: {
            50: "#e6f0f7",
            100: "#cce1ef",
            200: "#99c3df",
            300: "#66a5cf",
            400: "#3387bf",
            500: "#2d6ba3",
            600: "#1f5582",
            700: "#194466",
            800: "#143349",
            900: "#0e222d",
          },
          orange: {
            50: "#fff5f0",
            100: "#ffebe1",
            200: "#ffd7c3",
            300: "#ffc3a5",
            400: "#ffaf87",
            500: "#ff8759",
            600: "#ff6b35",
            700: "#e55525",
            800: "#cc4015",
            900: "#b22a05",
          },
          gray: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#374151",
            700: "#1f2937",
            800: "#111827",
            900: "#030712",
          },
          green: {
            50: "#f0fdf4",
            100: "#dcfce7",
            200: "#bbf7d0",
            300: "#86efac",
            400: "#4ade80",
            500: "#22c55e",
            600: "#16a34a",
            700: "#15803d",
            800: "#166534",
            900: "#14532d",
          },
          neutral: {
            50: "#fafafa",
            100: "#f5f5f5",
            200: "#e5e5e5",
            300: "#d4d4d4",
            400: "#a3a3a3",
            500: "#737373",
            600: "#525252",
            700: "#404040",
            800: "#262626",
            900: "#171717",
          }
        },
        // Map old variables to TripNav colors
        border: "var(--brand-gray-border)",
        input: "var(--brand-gray-border)",
        ring: "var(--brand-blue-primary)",
        background: "#ffffff",
        foreground: "var(--brand-gray-text)",
        primary: {
          DEFAULT: "var(--brand-blue-primary)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--brand-blue-secondary)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--brand-gray-light)",
          foreground: "var(--brand-gray-secondary)",
        },
        accent: {
          DEFAULT: "var(--brand-orange-accent)",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "var(--brand-gray-text)",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "var(--brand-gray-text)",
        },
        success: {
          DEFAULT: "var(--brand-green-success)",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "radar-scan": {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "50%": { opacity: "0.2" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "radar-scan": "radar-scan 2s infinite linear",
        "confetti-fall": "confetti-fall 5s linear infinite",
      },
      height: {
        'screen-safe': 'calc(var(--vh, 1vh) * 100)',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
