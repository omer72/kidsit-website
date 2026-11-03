import type { Lang } from "@/dictionaries";

/**
 * Official store badges, shown at the same 40px visual height.
 * The Play download PNGs ship with 41px of transparent padding on every side
 * (646×250, artwork 564×168). That padding is cropped out of the files so the
 * image box is the badge itself — scaling the padded file up to line the artwork
 * up left a ~10px inset and a wider gap than the App Store badge.
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
    play: { src: "/badges/google-play-en.png", width: 564, height: 168 },
  },
  he: {
    apple: { src: "/badges/app-store-he.svg", width: 116, height: 40 },
    play: { src: "/badges/google-play-he.png", width: 564, height: 168 },
  },
};
