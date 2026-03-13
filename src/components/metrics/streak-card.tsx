import SectionCard from "@/components/day-detail/section-card";

interface StreakCardProps {
  title: string;
  accent: string;
  streak: number | null;
  startDate: string | null;
  label: string;
  longestStreak?: number | null;
  longestStreakStart?: string | null;
}

export default function StreakCard({ title, accent, streak, startDate, label, longestStreak, longestStreakStart }: StreakCardProps) {
  const isBest = longestStreak != null && longestStreak > 0 && streak != null && streak >= longestStreak;
  const showLongest = longestStreak != null && longestStreak > 0 && streak != null && longestStreak > streak;

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
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono text-foreground">{label}</p>
              {isBest && (
                <span data-testid="streak-best-badge" className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  BEST
                </span>
              )}
            </div>
            {startDate && (
              <p className="text-[10px] font-mono text-muted mt-0.5">Since {startDate}</p>
            )}
            {showLongest && longestStreakStart && (
              <p data-testid="streak-longest" className="text-[10px] font-mono text-muted/60 mt-0.5">
                Best: {longestStreak} days ({longestStreakStart})
              </p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
