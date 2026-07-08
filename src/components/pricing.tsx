"use client";

// Billing toggle pattern adapted from 21st.dev pricing-section (kokonutd/867),
// restyled to the kidsit sticker system.
import { useState } from "react";
import { m, spring, useStagger, Reveal } from "./motion";
import { STORE_URLS, type Dict } from "@/dictionaries";

const PREMIUM_PRICE = { monthly: "$9.99", yearly: "$59.99" };

const STORES = [
  { key: "apple", href: STORE_URLS.apple },
  { key: "play", href: STORE_URLS.play },
] as const;

function StoreButtons({ t, variant }: { t: Dict["pricing"]; variant: "light" | "sunny" }) {
  const labels = { apple: t.storeApple, play: t.storePlay };
  return (
    <div className="mt-6 flex gap-2">
      {STORES.map((s) => (
        <m.a
          key={s.key}
          href={s.href}
          className={`flex-1 rounded-xl border-2 border-ink px-2 py-3 text-center text-sm font-bold shadow-sticker-sm ${
            variant === "sunny" ? "bg-sunny text-ink" : "bg-paper text-ink"
          }`}
          whileHover={{ y: -2, boxShadow: "4px 6px 0 0 #26265E" }}
          whileTap={{ y: 0, boxShadow: "2px 2px 0 0 #26265E" }}
          transition={spring}
        >
          {labels[s.key]}
        </m.a>
      ))}
    </div>
  );
}

function BillingToggle({
  yearly,
  onChange,
  t,
}: {
  yearly: boolean;
  onChange: (v: boolean) => void;
  t: Dict["pricing"];
}) {
  return (
    <div className="inline-flex rounded-xl border-2 border-ink bg-white p-1 shadow-sticker-sm">
      {([false, true] as const).map((isYearly) => {
        const active = yearly === isYearly;
        return (
          <button
            key={String(isYearly)}
            className="relative px-4 py-1.5 text-sm font-extrabold"
            aria-pressed={active}
            onClick={() => onChange(isYearly)}
          >
            {active && (
              <m.span
                layoutId="billing-thumb"
                className="absolute inset-0 rounded-lg bg-sunny"
                transition={spring}
              />
            )}
            <span className="relative">{isYearly ? t.yearly : t.monthly}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Pricing({ t }: { t: Dict["pricing"] }) {
  const [yearly, setYearly] = useState(true);
  const { parent, child } = useStagger();
  const period = yearly ? "yearly" : "monthly";

  return (
    <section id="pricing" className="mx-auto max-w-4xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
        <p className="mt-3 max-w-md text-lg font-bold text-ink/70">{t.sub}</p>
        <div className="mt-6">
          <BillingToggle yearly={yearly} onChange={setYearly} t={t} />
        </div>
      </Reveal>

      <m.div
        className="mt-10 grid items-stretch gap-6 md:grid-cols-2"
        variants={parent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <m.div variants={child}>
          <article className="flex h-full flex-col rounded-3xl border-2 border-ink bg-white p-6 shadow-sticker">
            <h3 className="font-display text-xl font-semibold">{t.free.name}</h3>
            <p className="mt-1 text-sm font-bold text-ink/60">{t.free.desc}</p>
            <p className="mt-4">
              <span className="font-display text-4xl font-semibold">{t.free.price}</span>{" "}
              <span className="font-bold text-ink/60">{t.free.cadence}</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2">
              {t.free.features.map((f) => (
                <li key={f} className="flex gap-2 font-bold">
                  <span className="text-mint" aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <StoreButtons t={t} variant="light" />
          </article>
        </m.div>

        <m.div variants={child}>
          <article className="relative flex h-full flex-col rounded-3xl border-2 border-ink bg-grape p-6 text-white shadow-sticker-lg md:-rotate-1">
            <span className="absolute -top-4 right-6 rotate-2 rounded-lg border-2 border-ink bg-sunny px-3 py-1 text-sm font-extrabold text-ink shadow-sticker-sm">
              {t.premium.badge}
            </span>
            <h3 className="font-display text-xl font-semibold">{t.premium.name}</h3>
            <p className="mt-1 text-sm font-bold text-white/70">{t.premium.desc}</p>
            <p className="mt-4">
              <m.span
                key={period}
                className="inline-block font-display text-4xl font-semibold"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {PREMIUM_PRICE[period]}
              </m.span>{" "}
              <span className="font-bold text-white/70">
                {yearly ? t.perYear : t.perMonth}
              </span>
            </p>
            <ul className="mt-5 flex-1 space-y-2">
              {t.premium.features.map((f) => (
                <li key={f} className="flex gap-2 font-bold">
                  <span className="text-sunny" aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <StoreButtons t={t} variant="sunny" />
          </article>
        </m.div>
      </m.div>
    </section>
  );
}
