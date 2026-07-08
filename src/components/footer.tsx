import type { Dict } from "@/dictionaries";

export function Footer({ t }: { t: Dict["footer"] }) {
  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold">
            kidsit<span className="text-sunny">·</span>ai
          </p>
          <p className="mt-2 max-w-xs font-bold text-paper/60">{t.tagline}</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-16 gap-y-2 font-bold">
          {t.links.map((l) => (
            <a key={l.href} className="hover:text-sunny" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-sm font-bold text-paper/70 sm:px-6">
        {t.disclaimer}
      </p>
    </footer>
  );
}
