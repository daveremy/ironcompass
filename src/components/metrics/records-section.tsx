import type { PersonalRecord } from "@/lib/queries";
import RecordCard from "./record-card";

interface RecordsSectionProps {
  records: PersonalRecord[];
}

const CATEGORY_ORDER = ["fitness", "sleep", "nutrition", "body"];

export default function RecordsSection({ records }: RecordsSectionProps) {
  if (records.length === 0) return null;

  const sorted = [...records].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="mt-8 animate-slide-in">
      <h2 className="font-mono text-sm font-bold tracking-[0.15em] uppercase text-foreground mb-4">
        Personal Records
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((r) => (
          <RecordCard
            key={r.key}
            label={r.label}
            value={r.value}
            unit={r.unit}
            date={r.date}
          />
        ))}
      </div>
    </div>
  );
}
