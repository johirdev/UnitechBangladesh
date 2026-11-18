/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", '"Noto Sans Bengali"', "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#F99622",
          50: "#FFF6EB",
          100: "#FEE9CF",
          200: "#FDD29F",
          300: "#FBB866",
          400: "#FAA543",
          500: "#F99622",
          600: "#E07A0A",
          700: "#B95F08",
          800: "#8F490B",
          900: "#5E300A",
        },
        ink: { DEFAULT: "#111827", soft: "#4B5563", muted: "#6B7280" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)",
        lift: "0 12px 32px -8px rgba(249,150,34,.35)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: 0, transform: "translateY(16px)" }, "100%": { opacity: 1, transform: "none" } },
        kenburns: { "0%": { transform: "scale(1)" }, "100%": { transform: "scale(1.08)" } },
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        spinSlow: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        fadeUp: "fadeUp .6s ease both",
        kenburns: "kenburns 8s ease-out both",
        fadeIn: "fadeIn .7s ease both",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        spinSlow: "spinSlow 18s linear infinite",
      },
    },
  },
  plugins: [],
};
