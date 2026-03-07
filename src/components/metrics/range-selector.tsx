const RANGES = [7, 14, 30, 90] as const;

interface RangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
}

export default function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {RANGES.map((days) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded transition-colors ${
            value === days
              ? "font-medium text-accent border border-accent/30 bg-accent/5"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
