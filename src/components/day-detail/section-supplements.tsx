import type { MetricRow } from "@/lib/types";
import SectionCard from "./section-card";
import Badge from "./badge";

export default function SectionSupplements({ data }: { data: MetricRow[] }) {
  return (
    <SectionCard title="Supplements" accent="#a855f7" empty={data.length === 0}>
      {data.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.map((r) => (
            <Badge key={r.id} label={r.metric_name.replace(/-/g, " ")} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
