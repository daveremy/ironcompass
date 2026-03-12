export function todayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Parse YYYY-MM-DD strictly — rejects impossible dates like 2026-02-31. */
export function parseDate(s: string): Date {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Invalid date format: "${s}" (expected YYYY-MM-DD)`);
  const [, ys, ms, ds] = match;
  const y = Number(ys), m = Number(ms), d = Number(ds);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    throw new Error(`Invalid date: "${s}" is not a real calendar date`);
  }
  return date;
}

/** Format a Date as YYYY-MM-DD. */
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Return YYYY-MM-DD string n days before a reference date string. */
export function daysBeforeDate(ref: string, n: number): string {
  const d = parseDate(ref);
  d.setDate(d.getDate() - n);
  return formatDate(d);
}
