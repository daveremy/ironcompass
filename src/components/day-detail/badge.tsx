export default function Badge({
  label,
  active = true,
  color,
}: {
  label: string;
  active?: boolean;
  color?: string;
}) {
  if (active && color) {
    return (
      <span
        className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
        style={{
          color,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
        active
          ? "bg-accent/10 text-accent border border-accent/30"
          : "bg-muted/10 text-muted border border-muted/20"
      }`}
    >
      {label}
    </span>
  );
}
