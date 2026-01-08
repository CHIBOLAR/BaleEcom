import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#026aa2",
          light: "#3588b5",
          dark: "#065986",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#c9e4f2",
          300: "#b3d2e3",
          400: "#8ebbd4",
          500: "#67a6c7",
          600: "#3588b5",
          700: "#026aa2",
          800: "#065986",
          900: "#0b4a6f",
        },
        secondary: {
          DEFAULT: "#10B981",
          dark: "#059669",
        },
        background: {
          DEFAULT: "#fefbf4",
        },
        gray: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d6d6d6",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#424242",
          800: "#292929",
          900: "#141414",
        },
      },
      fontFamily: {
        sans: ['"Poppins"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['"Literata"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gray-md': '0 4px 0 0 #d6d6d6',
        'gray-sm': '0 2px 0 0 #d6d6d6',
        'primary-md': '0 4px 0 0 #3588b5',
        'primary-sm': '0 2px 0 0 #3588b5',
      },
    },
  },
  plugins: [],
};

export default config;
