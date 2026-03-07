import type { PullupsRow } from "@/lib/types";
import SectionCard from "./section-card";
import { Stat } from "./section-vitals";

export default function SectionPullups({ data }: { data: PullupsRow | null }) {
  return (
    <SectionCard title="Pullups" accent="#06b6d4" empty={!data}>
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total" value={data.total_count} />
          <Stat label="Sets" value={data.sets ? data.sets.join(", ") : null} />
        </div>
      )}
    </SectionCard>
  );
}
