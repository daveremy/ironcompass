import SectionCard from "@/components/day-detail/section-card";

interface StreakCardProps {
  title: string;
  accent: string;
  streak: number | null;
  startDate: string | null;
  label: string;
}

export default function StreakCard({ title, accent, streak, startDate, label }: StreakCardProps) {
  return (
    <SectionCard title={title} accent={accent} empty={streak === null}>
      {streak !== null && (
        <div className="flex items-center gap-4">
          <div
            className="text-4xl font-mono font-bold tabular-nums"
            style={{ color: accent, textShadow: `0 0 20px ${accent}44` }}
          >
            {streak}
          </div>
          <div>
            <p className="text-xs font-mono text-foreground">{label}</p>
            {startDate && (
              <p className="text-[10px] font-mono text-muted mt-0.5">Since {startDate}</p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
