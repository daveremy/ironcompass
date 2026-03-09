export function formatNumber(v: number | null, decimals = 1): string | null {
  if (v == null) return null;
  return Number(v.toFixed(decimals)).toString();
}

export function toTitleCase(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}`;
}
