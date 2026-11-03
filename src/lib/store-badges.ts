import type { Lang } from "@/dictionaries";

/**
 * Official store badges.
 * The Play artwork includes transparent padding (content is 168/250 of the file height),
 * so its box is 60px when the App Store badge is 40px. The visible badges then match.
 */
export const storeBadgeArt: Record<
  Lang,
  {
    apple: { src: string; width: number; height: number };
    play: { src: string; width: number; height: number };
  }
> = {
  en: {
    apple: { src: "/badges/app-store-en.svg", width: 120, height: 40 },
    play: { src: "/badges/google-play-en.png", width: 155, height: 60 },
  },
  he: {
    apple: { src: "/badges/app-store-he.svg", width: 116, height: 40 },
    play: { src: "/badges/google-play-he.png", width: 155, height: 60 },
  },
};
