// Calendar helpers for the Google sections. GSC dates are in Pacific Time (per the Search Analytics API docs).

export function dayInZone(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** GSC finalized data lags ~2–3 days, so windows end 3 days before "today" in Pacific Time. */
export const GSC_LAG_DAYS = 3;

export function gscWindow(days: number, now: Date = new Date(), offsetDays = 0) {
  const end = addDays(dayInZone("America/Los_Angeles", now), -GSC_LAG_DAYS - offsetDays);
  return { startDate: addDays(end, -(days - 1)), endDate: end };
}
