// fonts-he is only imported from the /he layout (and admin). Preload so
// Rubik/Fredoka are available before the first layout: otherwise legal
// (and hash-scroll) metrics shift when the webfont swaps in. This does
// not put Hebrew files on /en.
import { Fredoka, Rubik } from "next/font/google";

const fredoka = Fredoka({ subsets: ["latin", "hebrew"], variable: "--font-fredoka", weight: ["500", "600"] });
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", weight: ["400", "700", "800"] });

export const fontClass = `${fredoka.variable} ${rubik.variable}`;
