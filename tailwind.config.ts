import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "SF Pro Display", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 120px rgba(34, 211, 238, 0.2)",
        soft: "0 20px 80px rgba(0, 0, 0, 0.5)"
      }
    }
  },
  plugins: []
};

export default config;
