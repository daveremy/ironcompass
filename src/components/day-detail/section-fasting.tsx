import type { FastingRow } from "@/lib/types";
import SectionCard from "./section-card";
import { Stat } from "./section-vitals";

export default function SectionFasting({ data }: { data: FastingRow | null }) {
  return (
    <SectionCard title="Fasting" accent="#eab308" empty={!data}>
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Protocol" value={data.protocol} />
          <Stat
            label="Compliant"
            value={data.compliant != null ? (data.compliant ? "Yes" : "No") : null}
          />
          <Stat label="Window Start" value={data.window_start} />
          <Stat label="Window End" value={data.window_end} />
        </div>
      )}
    </SectionCard>
  );
}
