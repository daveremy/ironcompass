import type { DailyEntryRow } from "@/lib/types";
import SectionCard from "./section-card";

function Stat({ label, value, unit }: { label: string; value: string | number | null | undefined; unit?: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">{label}</p>
      <p className="text-sm font-mono text-foreground">
        {value != null ? <>{value}{unit && <span className="text-muted ml-0.5">{unit}</span>}</> : "--"}
      </p>
    </div>
  );
}

export { Stat };

export default function SectionVitals({ data }: { data: DailyEntryRow | null }) {
  return (
    <SectionCard title="Vitals" accent="#22c55e" empty={!data}>
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Weight" value={data.weight} unit="lbs" />
          <Stat label="Energy" value={data.energy != null ? `${data.energy}/5` : null} />
          <Stat
            label="Alcohol"
            value={data.alcohol != null ? (data.alcohol ? "Yes" : "No") : null}
          />
          {data.notes && (
            <div className="col-span-2">
              <Stat label="Notes" value={data.notes} />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
