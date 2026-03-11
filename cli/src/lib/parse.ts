export function parseNum(field: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") throw new Error(`Invalid ${field}: empty value`);
  const n = Number(trimmed);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${field}: "${raw}" is not a number`);
  return n;
}

export function parseList(raw: string): string[] {
  return raw.split(",").map(s => s.trim()).filter(s => s !== "");
}

export function parseJsonObject(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Invalid JSON"); }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object, not an array or primitive");
  }
  return parsed as Record<string, unknown>;
}

export function parseTimestamp(date: string, raw: string): string {
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const pad = raw.length === 4 ? `0${raw}` : raw;
    return appendLocalOffset(date, pad);
  }
  // ISO string without timezone offset — treat as local time
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(raw)) {
    const isoDate = raw.slice(0, 10);
    const timePart = raw.slice(11); // HH:MM or HH:MM:SS
    return appendLocalOffset(isoDate, timePart);
  }
  return raw;
}

function appendLocalOffset(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const local = new Date(y, mo - 1, d, h, mi);
  const offset = local.toTimeString().match(/([+-]\d{4})/)?.[1] ?? "+0000";
  const sign = offset[0];
  const hh = offset.slice(1, 3);
  const mm = offset.slice(3, 5);
  const seconds = time.length > 5 ? "" : ":00";
  return `${date}T${time}${seconds}${sign}${hh}:${mm}`;
}

export function mergeSupplements(existing: string[], incoming: string[]): string[] {
  return [...new Set([...existing, ...incoming])];
}

export function sparse<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
