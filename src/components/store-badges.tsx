import Image from "next/image";
import { dictionaries, type Lang } from "@/dictionaries";
import { storeHref, storeLinkData, type StoreLink } from "@/lib/store-links";
import { storeBadgeArt } from "@/lib/store-badges";

/**
 * Official App Store + Google Play badges, same visible height, wrapping in LTR and RTL.
 * `link` sets medium, page and placement for ct / the Play referrer (see src/lib/store-links.ts). The server renders the
 * default links; components/store-attribution.tsx re-builds them after hydration from the data-store-* attributes.
 * `clearNagish` keeps the row out of the fixed accessibility button's physical-right column on phones.
 */
export function StoreBadges({
  lang,
  link,
  className = "",
  clearNagish = false,
}: {
  lang: Lang;
  link: Omit<StoreLink, "lang">;
  className?: string;
  clearNagish?: boolean;
}) {
  const labels = dictionaries[lang].stores;
  const art = storeBadgeArt[lang];
  const full: StoreLink = { ...link, lang };
  const items = [
    {
      key: "apple" as const,
      href: storeHref("apple", full),
      data: storeLinkData("apple", full),
      alt: labels.appleAlt,
      ...art.apple,
    },
    {
      key: "play" as const,
      href: storeHref("play", full),
      data: storeLinkData("play", full),
      alt: labels.playAlt,
      ...art.play,
    },
  ];
  return (
    <div className={`store-badge-slot ${clearNagish ? "max-md:pr-[4.5rem]" : ""} ${className}`}>
      <div className="store-badge-row">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            {...item.data}
            aria-label={item.alt}
            className="inline-flex min-h-11 shrink-0 items-center rounded-md"
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              unoptimized
              className="h-10 w-auto max-w-full"
              style={{ width: "auto", height: 40, maxWidth: "100%" }}
            />
          </a>
        ))}
      </div>
    </div>
  );
}
