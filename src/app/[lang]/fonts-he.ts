// preload: false: these are Hebrew-subset files; keeping them out of the preload set keeps /en lean.
import { Fredoka, Rubik } from "next/font/google";

const fredoka = Fredoka({ subsets: ["latin", "hebrew"], variable: "--font-fredoka", weight: ["500", "600"], preload: false });
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", weight: ["400", "700", "800"], preload: false });

export const fontClass = `${fredoka.variable} ${rubik.variable}`;
