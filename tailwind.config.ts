import type { Config } from "tailwindcss";
import { colors } from "./src/colors";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: ["var(--font-fredoka)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        sticker: `4px 4px 0 0 ${colors.ink}`,
        "sticker-sm": `2px 2px 0 0 ${colors.ink}`,
        "sticker-lg": `8px 8px 0 0 ${colors.ink}`,
      },
    },
  },
  plugins: [],
};
export default config;
