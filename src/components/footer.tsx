import type { Dict, Lang } from "@/dictionaries";
import { LangSwitchLink } from "./lang-switch";
import { CookieSettingsButton } from "./cookie-consent";

// base prefixes in-page anchors so the footer also works on the legal pages; path ("/privacy" etc.) makes the
// language switch go to the same page in the other language. Hebrew blog posts without an English sibling
// still switch to the English home. Paired posts and both blog indexes pass switchTo.
export function Footer({
  t,
  base = "",
  path = "",
  lang,
  switchTo,
}: {
  t: Dict["footer"];
  base?: string;
  path?: string;
  lang?: Lang;
  switchTo?: string;
}) {
  const link = "inline-flex min-h-11 items-center whitespace-nowrap hover:text-sunny";
  const locale: Lang = lang ?? (base.startsWith("/he") ? "he" : "en");
  const switchHref = switchTo ?? (path.startsWith("/blog") ? t.switchHref : t.switchHref + path);
  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold">
            kidsit<span className="text-sunny">·</span>ai
          </p>
          <p className="mt-2 max-w-xs font-bold text-paper/60">{t.tagline}</p>
        </div>
        <nav aria-label={t.label} className="grid grid-cols-2 gap-x-6 font-bold sm:gap-x-16">
          {t.links.map((l) => (
            <a key={l.href} className={link} href={l.href.startsWith("#") ? base + l.href : l.href}>
              {l.label}
            </a>
          ))}
          <CookieSettingsButton lang={locale} className={link} />
          <LangSwitchLink className={link} href={switchHref} lang={t.switchLang} hrefLang={t.switchLang}>
            {t.switchLabel}
          </LangSwitchLink>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-sm font-bold text-paper/70 sm:px-6">
        {t.disclaimer}
      </p>
    </footer>
  );
}
