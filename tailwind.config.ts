import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#26265E",
        paper: "#F3F6FF",
        grape: "#5B3DF5",
        sunny: "#FFC53D",
        bubblegum: "#FF7BA9",
        mint: "#3ECFAF",
      },
      fontFamily: {
        display: ["var(--font-fredoka)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        sticker: "4px 4px 0 0 #26265E",
        "sticker-sm": "2px 2px 0 0 #26265E",
        "sticker-lg": "8px 8px 0 0 #26265E",
      },
    },
  },
  plugins: [],
};
export default config;
