function getBase(): string {
  return (process.env.IRONCOMPASS_DASHBOARD_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function dayUrl(date: string): string {
  return `${getBase()}/?view=daily&date=${date}`;
}

export function calendarUrl(month?: string): string {
  const base = getBase();
  return month ? `${base}/?month=${month}` : base;
}
