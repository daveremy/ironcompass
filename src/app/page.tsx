import Shell from "@/components/layout/shell";
import Calendar from "@/components/calendar/calendar";
import DayDetail from "@/components/day-detail/day-detail";
import type { ViewType } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; month?: string }>;
}) {
  const params = await searchParams;
  const view = params.view;
  const date = params.date && isValidDate(params.date) ? params.date : undefined;
  const month = params.month && isValidDate(params.month) ? params.month : undefined;

  const currentView: ViewType = view === "daily" ? "daily" : "calendar";

  return (
    <Shell currentView={currentView}>
      {currentView === "daily" && date ? (
        <DayDetail date={date} backMonth={month} />
      ) : (
        <Calendar initialMonth={month} />
      )}
    </Shell>
  );
}
