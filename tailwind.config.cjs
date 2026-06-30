/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./frontend/index.html", "./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8f7",
          100: "#e8ece8",
          300: "#aeb9b0",
          500: "#607065",
          700: "#334138",
          900: "#17211c"
        },
        signal: {
          green: "#1f8a5f",
          red: "#c0473b",
          amber: "#cc7a1a",
          blue: "#2b6dbf"
        }
      },
      boxShadow: {
        panel: "0 18px 50px rgba(23, 33, 28, 0.10)"
      }
    }
  },
  plugins: []
};
