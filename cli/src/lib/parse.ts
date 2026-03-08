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

export function sparse<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
