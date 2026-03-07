export function formatNumber(v: number | null, decimals = 1): string | null {
  if (v == null) return null;
  return Number(v.toFixed(decimals)).toString();
}
