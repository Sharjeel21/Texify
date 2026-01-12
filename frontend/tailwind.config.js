// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
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
        // Your Brand Colors
        charcoal: {
          DEFAULT: '#353535',
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#a8a8a8',
          400: '#6e6e6e',
          500: '#353535', // Your main charcoal
          600: '#2a2a2a',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0a0a0a',
        },
        teal: {
          DEFAULT: '#3c6e71',
          50: '#f0f7f7',
          100: '#d9ebec',
          200: '#b7d9db',
          300: '#8bbfc2',
          400: '#5e9fa3',
          500: '#3c6e71', // Your main teal
          600: '#2f575a',
          700: '#27464a',
          800: '#23393e',
          900: '#1f3035',
        },
        slate: {
          DEFAULT: '#284b63',
          50: '#f0f5f9',
          100: '#d9e6f0',
          200: '#b8d0e3',
          300: '#8ab0ce',
          400: '#5c8db5',
          500: '#3f6f8f',
          600: '#284b63', // Your main slate
          700: '#1f3a4d',
          800: '#1c3241',
          900: '#1b2b37',
        },
        // Neutral colors
        white: '#ffffff',
        gray: {
          DEFAULT: '#d9d9d9',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d9d9d9', // Your main gray
          400: '#c4c4c4',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },

        // Shadcn UI color system (mapped to your colors)
        border: "hsl(0, 0%, 85%)", // #d9d9d9
        input: "hsl(0, 0%, 85%)",
        ring: "hsl(182, 30%, 34%)", // teal
        background: "hsl(0, 0%, 100%)", // white
        foreground: "hsl(0, 0%, 21%)", // charcoal
        
        primary: {
          DEFAULT: "hsl(182, 30%, 34%)", // #3c6e71 teal
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(203, 39%, 28%)", // #284b63 slate
          foreground: "hsl(0, 0%, 100%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(0, 0%, 85%)", // #d9d9d9
          foreground: "hsl(0, 0%, 45%)",
        },
        accent: {
          DEFAULT: "hsl(0, 0%, 85%)",
          foreground: "hsl(0, 0%, 21%)",
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(0, 0%, 21%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(0, 0%, 21%)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}