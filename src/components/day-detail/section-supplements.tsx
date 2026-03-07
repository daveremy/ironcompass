import type { SupplementsRow } from "@/lib/types";
import SectionCard from "./section-card";
import Badge from "./badge";

export default function SectionSupplements({ data }: { data: SupplementsRow | null }) {
  return (
    <SectionCard title="Supplements" accent="#a855f7" empty={!data}>
      {data && (
        <div className="flex flex-wrap gap-1.5">
          {data.supplements.map((s) => (
            <Badge key={s} label={s.replace(/-/g, " ")} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
