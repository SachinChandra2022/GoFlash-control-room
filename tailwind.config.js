/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Extended slate palette for true dark-mode depth
        slate: {
          925: "#0b0f18",
          950: "#090e1a",
        },
      },
      keyframes: {
        // Stock number flash on update
        stockFlash: {
          "0%":   { textShadow: "0 0 0px transparent" },
          "30%":  { textShadow: "0 0 40px rgba(52, 211, 153, 0.9)" },
          "100%": { textShadow: "0 0 0px transparent" },
        },
        // Danger pulse for sold-out state
        dangerPulse: {
          "0%, 100%": { textShadow: "0 0 20px rgba(244, 63, 94, 0.4)" },
          "50%":       { textShadow: "0 0 50px rgba(244, 63, 94, 0.9)" },
        },
        // Shake for sold-out counter
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%":      { transform: "translateX(-8px)" },
          "20%":      { transform: "translateX(8px)" },
          "30%":      { transform: "translateX(-6px)" },
          "40%":      { transform: "translateX(6px)" },
          "50%":      { transform: "translateX(-3px)" },
          "60%":      { transform: "translateX(3px)" },
        },
        // Packet glide along pipeline
        packetFlow: {
          "0%":   { left: "0%",   opacity: 0 },
          "5%":   { opacity: 1 },
          "95%":  { opacity: 1 },
          "100%": { left: "100%", opacity: 0 },
        },
        // Terminal cursor blink
        cursorBlink: {
          "0%, 100%": { opacity: 1 },
          "50%":       { opacity: 0 },
        },
        // Scanline sweep
        scanline: {
          "0%":   { top: "-5%" },
          "100%": { top: "105%" },
        },
        // Glow pulse for node active state
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(52, 211, 153, 0)" },
          "50%":       { boxShadow: "0 0 0 6px rgba(52, 211, 153, 0.15)" },
        },
        // Log entry slide-in
        logSlideIn: {
          "0%":   { opacity: 0, transform: "translateX(-8px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        // Button loading shimmer
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        // Neon flicker for header logo
        neonFlicker: {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": {
            textShadow: "0 0 10px rgba(52,211,153,0.8), 0 0 20px rgba(52,211,153,0.4)",
          },
          "20%, 24%, 55%": {
            textShadow: "none",
          },
        },
      },
      animation: {
        "stock-flash":   "stockFlash 0.5s ease-out",
        "danger-pulse":  "dangerPulse 1.5s ease-in-out infinite",
        "shake":         "shake 0.5s ease-in-out infinite",
        "packet-flow":   "packetFlow 1.4s linear",
        "cursor-blink":  "cursorBlink 1s step-end infinite",
        "scanline":      "scanline 8s linear infinite",
        "glow-pulse":    "glowPulse 2s ease-in-out infinite",
        "log-slide":     "logSlideIn 0.15s ease-out",
        "shimmer":       "shimmer 1.2s linear infinite",
        "neon-flicker":  "neonFlicker 4s linear infinite",
      },
      // Custom scrollbar utilities via arbitrary variants
      scrollbarColor: {
        DEFAULT: "rgba(51,65,85,0.5) transparent",
      },
    },
  },
  plugins: [
    // Minimal scrollbar plugin inline
    function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "scrollbar-color": "rgba(51,65,85,0.7) transparent",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(51,65,85,0.7)",
            borderRadius: "2px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(71,85,105,0.9)",
          },
        },
      });
    },
  ],
};