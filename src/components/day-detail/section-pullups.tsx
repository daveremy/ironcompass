import type { PullupsRow } from "@/lib/types";
import SectionCard from "./section-card";
import { Stat } from "./section-vitals";

export default function SectionPullups({
  data,
  prKeys,
}: {
  data: PullupsRow | null;
  prKeys?: Set<string>;
}) {
  return (
    <SectionCard title="Pullups" accent="#06b6d4" empty={!data}>
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Total"
            value={data.total_count}
            indicator={prKeys?.has("pullups_max") ? "pr" : undefined}
          />
          <Stat label="Sets" value={data.sets ? data.sets.join(", ") : null} />
        </div>
      )}
    </SectionCard>
  );
}
