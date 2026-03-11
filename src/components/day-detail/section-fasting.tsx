import type { FastingRow } from "@/lib/types";
import SectionCard from "./section-card";
import { Stat } from "./section-vitals";

function fastDuration(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const eatingMin = endMin >= startMin ? endMin - startMin : 1440 - startMin + endMin;
  const fastMin = 1440 - eatingMin;
  const h = Math.floor(fastMin / 60);
  const m = fastMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function SectionFasting({ data }: { data: FastingRow | null }) {
  const duration = data ? fastDuration(data.window_start, data.window_end) : null;
  return (
    <SectionCard title="Fasting" accent="#eab308" empty={!data}>
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Protocol" value={data.protocol} />
          <Stat
            label="Compliant"
            value={data.compliant != null ? (data.compliant ? "Yes" : "No") : null}
          />
          {duration && <Stat label="Fast Duration" value={duration} />}
          <Stat label="Window Start" value={data.window_start} />
          <Stat label="Window End" value={data.window_end} />
        </div>
      )}
    </SectionCard>
  );
}
