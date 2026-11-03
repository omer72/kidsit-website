import Image from "next/image";
import { dictionaries, storeUrl, type Lang } from "@/dictionaries";
import { storeBadgeArt } from "@/lib/store-badges";

/**
 * Official App Store + Google Play badges, same visible height, wrapping in LTR and RTL.
 * `clearNagish` keeps the row out of the fixed accessibility button's physical-right column on phones.
 */
export function StoreBadges({
  lang,
  placement,
  className = "",
  clearNagish = false,
}: {
  lang: Lang;
  placement: string;
  className?: string;
  clearNagish?: boolean;
}) {
  const labels = dictionaries[lang].stores;
  const art = storeBadgeArt[lang];
  const items = [
    {
      key: "apple" as const,
      href: storeUrl.apple(placement, lang),
      alt: labels.appleAlt,
      ...art.apple,
      imgClass: "h-10 w-auto",
    },
    {
      key: "play" as const,
      href: storeUrl.play(placement, lang),
      alt: labels.playAlt,
      ...art.play,
      imgClass: "h-[60px] w-auto",
    },
  ];
  return (
    <div
      className={`flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 ${clearNagish ? "max-md:pr-[4.5rem]" : ""} ${className}`}
    >
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          aria-label={item.alt}
          className="inline-flex min-h-11 max-w-full items-center rounded-md"
        >
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            unoptimized
            className={`${item.imgClass} max-w-full`}
            style={{ width: "auto", height: item.key === "apple" ? 40 : 60, maxWidth: "100%" }}
          />
        </a>
      ))}
    </div>
  );
}
