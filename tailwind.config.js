/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  // Prefix every utility so this package's Tailwind never collides with the
  // host app's own Tailwind setup (they can run two different configs safely).
  prefix: "brk-",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--brk-border))",
        input: "hsl(var(--brk-input))",
        ring: "hsl(var(--brk-ring))",
        background: "hsl(var(--brk-background))",
        foreground: "hsl(var(--brk-foreground))",
        primary: {
          DEFAULT: "hsl(var(--brk-primary))",
          foreground: "hsl(var(--brk-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--brk-secondary))",
          foreground: "hsl(var(--brk-secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--brk-muted))",
          foreground: "hsl(var(--brk-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--brk-accent))",
          foreground: "hsl(var(--brk-accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--brk-destructive))",
          foreground: "hsl(var(--brk-destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--brk-card))",
          foreground: "hsl(var(--brk-card-foreground))",
        },
        chart: {
          1: "hsl(var(--brk-chart-1))",
          2: "hsl(var(--brk-chart-2))",
          3: "hsl(var(--brk-chart-3))",
          4: "hsl(var(--brk-chart-4))",
          5: "hsl(var(--brk-chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--brk-radius)",
        md: "calc(var(--brk-radius) - 2px)",
        sm: "calc(var(--brk-radius) - 4px)",
      },
    },
  },
  plugins: [],
};
