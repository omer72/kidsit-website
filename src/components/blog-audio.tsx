"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/dictionaries";
import { readConsent } from "@/lib/consent";

/** Browser speech for posts without a generated file. Set to false if its quality is poor. */
export const SPEECH_FALLBACK = true;

const RATES = [1, 1.25, 1.5] as const;
const RATE_KEY = "kidsit.blogAudioRate";

const COPY = {
  he: { rate: "מהירות הקראה", readAloud: "הקראה בקול", stop: "עצירת ההקראה" },
  en: { rate: "Playback speed", readAloud: "Read aloud", stop: "Stop reading" },
} as const;

function storedRate(): number {
  try {
    const value = Number(window.localStorage.getItem(RATE_KEY));
    return (RATES as readonly number[]).includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

/** GA4 event, only with analytics consent and only when gtag.js is loaded (same gate as store_click). */
function track(name: "blog_audio_play" | "blog_audio_complete", params: { lang: Lang; slug: string; rate: number }) {
  if (typeof window.gtag !== "function" || !readConsent()?.analytics) return;
  try {
    window.gtag("event", name, params);
  } catch {
    /* analytics never breaks playback */
  }
}

type Props = { lang: Lang; slug: string; title: string; audio: { src: string; label: string } | null };

/**
 * "Listen" under the post title: the generated MP3 with native controls and 1× / 1.25× / 1.5×, or,
 * when the post has no file yet, a small browser read-aloud button (only if the browser has a voice
 * for the page language).
 */
export function BlogAudio({ lang, slug, title, audio }: Props) {
  if (audio) return <AudioPlayer lang={lang} slug={slug} src={audio.src} label={audio.label} />;
  return SPEECH_FALLBACK ? <ReadAloud lang={lang} title={title} /> : null;
}

function AudioPlayer({ lang, slug, src, label }: { lang: Lang; slug: string; src: string; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const played = useRef(false);
  const [rate, setRate] = useState(1);
  const ui = COPY[lang];

  useEffect(() => setRate(storedRate()), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // defaultPlaybackRate survives the load that preload="none" defers until the first play.
    el.defaultPlaybackRate = rate;
    el.playbackRate = rate;
  }, [rate]);

  const choose = (next: number) => {
    setRate(next);
    try {
      window.localStorage.setItem(RATE_KEY, String(next));
    } catch {
      /* private mode: the choice lasts this page view */
    }
  };

  return (
    <div className="blog-audio mt-6 rounded-2xl border-2 border-ink bg-white p-4 shadow-sticker-sm">
      <p id="blog-audio-label" className="font-display text-base font-semibold">
        {label}
      </p>
      <audio
        ref={ref}
        controls
        preload="none"
        src={src}
        dir="ltr"
        aria-labelledby="blog-audio-label"
        className="mt-3 w-full"
        onPlay={() => {
          if (played.current) return;
          played.current = true;
          track("blog_audio_play", { lang, slug, rate });
        }}
        onEnded={() => track("blog_audio_complete", { lang, slug, rate })}
      />
      <div role="group" aria-label={ui.rate} className="mt-3 flex flex-wrap gap-2">
        {RATES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={rate === r}
            onClick={() => choose(r)}
            className={`min-h-11 min-w-14 rounded-full border-2 border-ink px-3 text-sm font-bold ${
              rate === r ? "bg-ink text-white" : "bg-white text-ink hover:bg-sunny"
            }`}
          >
            <span dir="ltr">{r}×</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  const prefixes = lang === "he" ? ["he", "iw"] : ["en"];
  return window.speechSynthesis.getVoices().find((v) => prefixes.some((p) => v.lang.toLowerCase().startsWith(p))) ?? null;
}

function ReadAloud({ lang, title }: { lang: Lang; title: string }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const ui = COPY[lang];

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const update = () => setVoice(voiceFor(lang));
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, [lang]);

  if (!voice) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    // One utterance per paragraph: long utterances stop early in some browsers.
    const body = (document.querySelector(".blog-prose") as HTMLElement | null)?.innerText ?? "";
    const parts = [title, ...body.split(/\n+/)].map((p) => p.trim()).filter(Boolean);
    synth.cancel();
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = lang === "he" ? "he-IL" : "en-US";
      u.voice = voice;
      if (i === parts.length - 1) u.onend = () => setSpeaking(false);
      synth.speak(u);
    });
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="mt-4 inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-white px-4 text-sm font-bold text-ink hover:bg-sunny"
    >
      {speaking ? ui.stop : ui.readAloud}
    </button>
  );
}
