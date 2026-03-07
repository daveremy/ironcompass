import type { BloodPressureRow } from "@/lib/types";
import SectionCard from "./section-card";

export default function SectionBP({ data }: { data: BloodPressureRow[] }) {
  return (
    <SectionCard title="Blood Pressure" accent="#ef4444" empty={data.length === 0}>
      {data.length > 0 && (
        <div className="space-y-2">
          {data.map((bp) => (
            <div key={bp.id} className="flex items-baseline gap-3">
              <span className="text-sm font-mono font-semibold text-foreground">
                {bp.systolic}/{bp.diastolic}
              </span>
              <span className="text-[10px] font-mono text-muted">mmHg</span>
              {bp.time && (
                <span className="text-[10px] font-mono text-muted">{bp.time}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
