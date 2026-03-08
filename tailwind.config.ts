import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        ocean: "#0ea5a4",
        amber: "#f59e0b",
        sky: "#0369a1"
      },
      boxShadow: {
        soft: "0 12px 40px -20px rgba(2, 6, 23, 0.5)"
      }
    }
  },
  plugins: []
};

export default config;
