// Internal research record for the team, backing the /marketing landing page.
// Partial by design: this carries only the sourced findings that were retained and used to
// write that page's copy (3 pain quotes, the sub-avatar definition, the market gap, the chosen
// killer feature). It is not the full original three-part RIN research output — that lived in an
// earlier chat session and wasn't saved to a file, so it isn't reproduced here. Nothing on this
// page is invented; anything not sourced says so.

const QUOTES = [
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

export default function MarketingResearchPage() {
  return (
    <main className="mx-auto max-w-[840px] px-6 py-20 md:px-14">
      <div className="mb-14 rounded-[16px] border border-dashed border-black/15 bg-white/60 p-6 font-body text-[14px] leading-[1.7] text-[#5a594f]">
        <strong className="text-[#15151a]">Partial record, not the full research.</strong> The
        original three-part research (sub-avatar identification, avatar-language research,
        killer-feature research) was produced in an earlier chat session and wasn&rsquo;t saved as
        a file. What follows is the subset that survived into this session and was used to write
        the <a href="/marketing" className="underline hover:text-[#e8402e]">/marketing</a> landing
        page copy. Ask for the research to be redone in full if you need the rest.
      </div>

      <h1 className="font-display text-[32px] italic leading-[1.2] text-[#15151a] sm:text-[40px]">
        Research behind /marketing
      </h1>

      <section className="mt-14">
        <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8c8a81]">
          Sub-avatar #1
        </h2>
        <p className="mt-4 font-body text-[17px] leading-[1.7] text-[#15151a]">
          Parents of autistic / SPD (sensory processing disorder) children, specifically around
          meltdowns — the acute, in-the-moment crisis, not general parenting advice.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8c8a81]">
          The market gap
        </h2>
        <p className="mt-4 font-body text-[17px] leading-[1.7] text-[#15151a]">
          No one answers <em className="not-italic text-[#e8402e]">in</em> the moment — existing
          options answer <em className="not-italic">before</em> it (a multi-week course) or{" "}
          <em className="not-italic">after</em> it (alone, processing what happened). Nothing meets
          the parent at second zero, while it&rsquo;s happening.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8c8a81]">
          Avatar-language research — real quotes
        </h2>
        <div className="mt-6 flex flex-col gap-5">
          {QUOTES.map((q) => (
            <figure
              key={q.quote}
              className="rounded-[16px] border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(20,15,10,0.04)]"
            >
              <blockquote className="font-display text-[18px] italic leading-[1.5] text-[#15151a]">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 font-body text-[12px] uppercase tracking-[0.1em] text-[#8c8a81]">
                {q.href ? (
                  <a href={q.href} target="_blank" rel="noreferrer" className="hover:text-[#e8402e]">
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

      <section className="mt-14">
        <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8c8a81]">
          Killer feature chosen (&ldquo;the red button&rdquo;)
        </h2>
        <p className="mt-4 font-body text-[17px] leading-[1.7] text-[#15151a]">
          Press one button the second a meltdown starts, say out loud what&rsquo;s happening — no
          typing, no forms — and get guidance under 10 seconds, tuned to that specific child from
          every prior time, not a generic script.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-[#8c8a81]">
          Boundaries honored in the landing page
        </h2>
        <ul className="mt-4 list-disc pl-5 font-body text-[16px] leading-[1.8] text-[#15151a]">
          <li>No invented testimonials, logos, clients, or numbers.</li>
          <li>No competitor names on the public page (would need separate legal review).</li>
          <li>Missing proof is labeled &ldquo;coming,&rdquo; never faked.</li>
        </ul>
      </section>

      <footer className="mt-20 font-body text-[12px] text-[#b3b1a7]">
        Unlisted test page · kidsit.ai/marketing/research · noindex
      </footer>
    </main>
  );
}
