import type { Dict } from "@/dictionaries";

// base prefixes in-page anchors so the footer also works on the legal pages.
export function Footer({ t, base = "" }: { t: Dict["footer"]; base?: string }) {
  const link = "inline-flex min-h-11 items-center hover:text-sunny";
  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold">
            kidsit<span className="text-sunny">·</span>ai
          </p>
          <p className="mt-2 max-w-xs font-bold text-paper/60">{t.tagline}</p>
        </div>
        <nav aria-label={t.label} className="grid grid-cols-2 gap-x-16 font-bold">
          {t.links.map((l) => (
            <a key={l.href} className={link} href={l.href.startsWith("#") ? base + l.href : l.href}>
              {l.label}
            </a>
          ))}
          <a className={link} href={t.switchHref} lang={t.switchLang} hrefLang={t.switchLang}>
            {t.switchLabel}
          </a>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-sm font-bold text-paper/70 sm:px-6">
        {t.disclaimer}
      </p>
    </footer>
  );
}
