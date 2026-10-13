import { Fredoka, Nunito } from "next/font/google";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["500", "600"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "700", "800"] });

export const fontClass = `${fredoka.variable} ${nunito.variable}`;
