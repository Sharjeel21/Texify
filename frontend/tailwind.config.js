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
          500: '#353535',
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
          500: '#3c6e71',
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
          600: '#284b63',
          700: '#1f3a4d',
          800: '#1c3241',
          900: '#1b2b37',
        },
        // AppUI.css Textile Theme Colors (for compatibility)
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // primary-color
          700: '#b45309', // primary-hover
          800: '#92400e',
          900: '#78350f', // bg-sidebar
        },
        emerald: {
          600: '#059669', // secondary-color
        },
        white: '#ffffff',
        gray: {
          DEFAULT: '#d9d9d9',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d9d9d9',
          400: '#c4c4c4',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },

        // Shadcn UI color system
        border: "hsl(0, 0%, 85%)",
        input: "hsl(0, 0%, 85%)",
        ring: "hsl(182, 30%, 34%)",
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(0, 0%, 21%)",
        
        primary: {
          DEFAULT: "hsl(182, 30%, 34%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(203, 39%, 28%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(0, 0%, 85%)",
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
      spacing: {
        // AppUI.css spacing compatibility
        'header': 'var(--header-height, 70px)',
        'sidebar': 'var(--sidebar-width, 280px)',
        'xs': 'var(--spacing-xs, 0.5rem)',
        'sm': 'var(--spacing-sm, 1rem)',
        'md': 'var(--spacing-md, 1.5rem)',
        'lg': 'var(--spacing-lg, 2rem)',
        'xl': 'var(--spacing-xl, 3rem)',
      },
      zIndex: {
        'header': '1000',
        'sidebar': '999',
        'overlay': '998',
        'dropdown': '1001',
        '997': '997',
        '998': '998',
        '999': '999',
        '1000': '1000',
        '1001': '1001',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'appui': 'var(--border-radius, 12px)',
      },
      boxShadow: {
        'appui-sm': 'var(--shadow-sm, 0 1px 3px 0 rgba(217, 119, 6, 0.08))',
        'appui-md': 'var(--shadow-md, 0 4px 8px -2px rgba(217, 119, 6, 0.15))',
        'appui-lg': 'var(--shadow-lg, 0 10px 20px -5px rgba(217, 119, 6, 0.2))',
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
        "fadeIn": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slideUp": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slideDown": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeIn": "fadeIn 0.3s ease",
        "slideUp": "slideUp 0.3s ease",
        "slideDown": "slideDown 0.3s ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}