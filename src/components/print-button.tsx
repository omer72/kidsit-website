"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-grape px-4 text-sm font-bold text-white shadow-sticker-sm"
    >
      {label}
    </button>
  );
}
