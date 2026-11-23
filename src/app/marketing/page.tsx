// Unlisted landing-page test for sub-avatar #1 (autism/SPD meltdown parents), built from the
// RIN research in this product's strategy work: the real pain quotes, the single proven gap
// (no one answers IN the moment — only before it, with a course, or after it, alone), and the
// one killer feature chosen to close it (voice -> guidance under 10 seconds, learned per child).
// No invented testimonials, logos or numbers. Where real proof doesn't exist yet, the block says so.

const PAIN_QUOTES = [
  {
    quote: "Get through the night. And tomorrow make a plan.",
    source: "UK autism parent community",
    href: "https://community.autism.org.uk/f/mental-health-and-wellbeing/26058/help/229083",
  },
  {
    quote:
      "They look like an autism meltdown or a night terror but last up to 3 hours... happen much more frequently.",
    source: "Parent, Mayo Clinic Connect",
    href: "https://connect.mayoclinic.org/comment/1583721/",
  },
  {
    quote: "I'm exhausted physically and emotionally... frankly at the end of my tether.",
    source: "Parent, UK support forum",
    href: null,
  },
] as const;

const STEPS = [
  {
    n: "01",
    label: "Press",
    body: "The second it starts, press the one button — in your pocket, not a login screen.",
  },
  {
    n: "02",
    label: "Talk",
    body: "Say out loud what's happening. No typing, no forms, no choosing from a list.",
  },
  {
    n: "03",
    label: "Know",
    body: "Under 10 seconds: guidance built for this child — it learned from every time before what worked, and what didn't.",
  },
] as const;

export default function MarketingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative grain mx-auto grid min-h-[92vh] max-w-[1400px] grid-cols-1 items-center gap-16 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:px-14 md:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_15%_0%,rgba(255,77,61,0.14),transparent_60%)]" />

        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-3 text-[13px] uppercase tracking-[0.22em] text-[#8a8a92]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#ff4d3d]" />
            kidsit.ai — for parents of autistic &amp; SPD kids
          </div>

          <h1 className="font-display text-[42px] italic leading-[1.08] text-[#f5f4f0] sm:text-[54px] lg:text-[64px]">
            He&rsquo;s melting down.
            <br />
            You&rsquo;re googling it at 2am,
            <br />
            telling yourself you&rsquo;re
            <br />
            <span className="not-italic text-[#ff4d3d]">at the end of your tether.</span>
          </h1>

          <p className="mt-9 max-w-[520px] font-body text-[18px] leading-[1.6] text-[#c9c8cf]">
            Press one button and say what&rsquo;s happening — in under 10 seconds, get guidance
            built for <em className="not-italic text-[#f5f4f0]">this exact child</em>, not a
            stranger&rsquo;s script.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              href="#start"
              className="inline-flex items-center gap-3 rounded-full bg-[#ff4d3d] px-8 py-4 font-body text-[15px] font-semibold text-[#0b0b10] transition hover:bg-[#ff6a5c]"
            >
              Press it when it happens — start free
            </a>
            <span className="font-body text-[13px] text-[#8a8a92]">3 free answers. No card.</span>
          </div>

          <p className="mt-8 max-w-[460px] font-body text-[13px] leading-[1.6] text-[#5f5f67]">
            Not a diagnosis. Not a replacement for your psychologist or doctor. It&rsquo;s what
            happens in the 10 seconds before you&rsquo;d even reach one.
          </p>
        </div>

        {/* Visual centerpiece — the killer feature itself */}
        <div className="relative z-10 flex justify-center md:justify-end">
          <div className="relative flex w-full max-w-[320px] flex-col items-center rounded-[32px] border border-white/10 bg-[#121218] px-8 py-12 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]">
            <span className="mb-10 font-body text-[11px] uppercase tracking-[0.3em] text-[#8a8a92]">
              the red button
            </span>

            <div className="press-button relative flex h-[168px] w-[168px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff6a5c,#b8160a_72%)]">
              <span className="font-display text-[22px] italic leading-tight text-[#0b0b10]">
                press
              </span>
            </div>

            <div className="timer-digit mt-10 font-body text-[13px] tracking-[0.3em] text-[#8a8a92]">
              00:00 <span className="text-[#ff4d3d]">→</span> 00:09
            </div>

            <p className="mt-6 text-center font-body text-[14px] leading-[1.6] text-[#c9c8cf]">
              &ldquo;He won&rsquo;t put his shoes on, he&rsquo;s screaming&rdquo;
              <br />
              <span className="text-[#8a8a92]">— guidance in 9 seconds, tuned to him.</span>
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 md:px-14">
        <h2 className="font-display text-[28px] italic text-[#f5f4f0] sm:text-[34px]">
          You already know this part.
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PAIN_QUOTES.map((q) => (
            <figure
              key={q.quote}
              className="rounded-[20px] border border-white/10 bg-white/[0.02] p-7"
            >
              <blockquote className="font-display text-[19px] italic leading-[1.5] text-[#f0efe9]">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 font-body text-[12px] uppercase tracking-[0.1em] text-[#6b6b73]">
                {q.href ? (
                  <a href={q.href} target="_blank" rel="noreferrer" className="hover:text-[#ff4d3d]">
                    {q.source} ↗
                  </a>
                ) : (
                  q.source
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* MECHANISM */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 md:px-14">
        <h2 className="font-display text-[28px] italic text-[#f5f4f0] sm:text-[34px]">
          Not another 3-month course.
          <br />
          Not another app that doesn&rsquo;t know him.
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative pl-0">
              <div className="font-display text-[48px] italic text-[#ff4d3d]/70">{s.n}</div>
              <div className="mt-3 font-body text-[13px] uppercase tracking-[0.2em] text-[#8a8a92]">
                {s.label}
              </div>
              <p className="mt-4 font-body text-[16px] leading-[1.6] text-[#c9c8cf]">{s.body}</p>
              {i < STEPS.length - 1 && (
                <div className="mt-10 hidden h-px w-full bg-gradient-to-r from-white/10 to-transparent md:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PROOF / VALUE */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 md:px-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-8">
            <div className="font-body text-[13px] uppercase tracking-[0.2em] text-[#8a8a92]">
              what it is not
            </div>
            <p className="mt-4 font-body text-[17px] leading-[1.6] text-[#f0efe9]">
              No diagnosis claims. No replacing your psychologist or doctor. Just what helps in
              the moment between visits.
            </p>
          </div>
          <div className="rounded-[20px] border border-dashed border-white/15 bg-transparent p-8">
            <div className="font-body text-[13px] uppercase tracking-[0.2em] text-[#8a8a92]">
              proof — coming
            </div>
            <p className="mt-4 font-body text-[17px] leading-[1.6] text-[#8a8a92]">
              Real pilot-family results will replace this block once our first cohort completes.
              Nothing here is invented.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="start" className="mx-auto max-w-[900px] px-6 py-28 text-center md:px-14">
        <h2 className="font-display text-[34px] italic leading-[1.2] text-[#f5f4f0] sm:text-[44px]">
          Next time he falls apart,
          <br />
          you won&rsquo;t be guessing alone.
        </h2>
        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-full bg-[#ff4d3d] px-9 py-4 font-body text-[15px] font-semibold text-[#0b0b10] transition hover:bg-[#ff6a5c]"
          >
            Start free — 3 answers on us
          </a>
          <span className="font-body text-[13px] text-[#6b6b73]">
            No credit card. Not a replacement for professional care.
          </span>
        </div>
      </section>

      <footer className="mx-auto max-w-[1100px] px-6 pb-16 font-body text-[12px] text-[#4c4c53] md:px-14">
        Unlisted test page · kidsit.ai/marketing · noindex
      </footer>
    </main>
  );
}
