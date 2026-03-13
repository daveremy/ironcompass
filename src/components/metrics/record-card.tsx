import SectionCard from "@/components/day-detail/section-card";

interface RecordCardProps {
  label: string;
  value: number;
  unit: string;
  date: string;
}

export default function RecordCard({ label, value, unit, date }: RecordCardProps) {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <SectionCard title={label} accent="#eab308">
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-mono font-bold tabular-nums text-amber-400"
          style={{ textShadow: "0 0 16px #eab30844" }}
        >
          {formatted}
        </span>
        <span className="text-xs font-mono text-muted">{unit}</span>
      </div>
      <p className="text-[10px] font-mono text-muted/60 mt-1">{date}</p>
    </SectionCard>
  );
}
