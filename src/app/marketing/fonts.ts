// Editorial display serif for headlines + a clean grotesk for body/UI, separate from the
// playful Fredoka/Rubik pair the product site uses — this page is a one-off premium test.
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"], style: ["normal", "italic"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

export const fontClass = `${fraunces.variable} ${inter.variable}`;
