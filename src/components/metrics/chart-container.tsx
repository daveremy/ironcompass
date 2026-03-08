import { computeYRange } from "./sparkline";
import { formatShortDate } from "@/lib/format";

interface ChartContainerProps {
  points: Array<{ date: string; value: number }>;
  goalLine?: number;
  yLabels?: boolean;
  formatY?: (v: number) => string;
  children: React.ReactNode;
}

export default function ChartContainer({
  points,
  goalLine,
  yLabels = false,
  formatY = (v) => v.toFixed(1),
  children,
}: ChartContainerProps) {
  if (points.length === 0) return <>{children}</>;

  const showXLabels = points.length >= 2;
  const firstDate = points[0].date;
  const lastDate = points[points.length - 1].date;

  let yMinLabel: string | undefined;
  let yMaxLabel: string | undefined;
  if (yLabels) {
    const values = points.map((p) => p.value);
    if (goalLine != null) values.push(goalLine);
    const { yMin, yMax } = computeYRange(values);
    yMinLabel = formatY(yMin);
    yMaxLabel = formatY(yMax);
  }

  return (
    <div className="mb-3">
      <div className="flex">
        {yLabels && (
          <div className="flex flex-col justify-between w-8 shrink-0 pr-1">
            <span className="text-[9px] font-mono text-muted/60 text-right leading-none">{yMaxLabel}</span>
            <span className="text-[9px] font-mono text-muted/60 text-right leading-none">{yMinLabel}</span>
          </div>
        )}
        <div className="h-20 flex-1">{children}</div>
      </div>
      {showXLabels && (
        <div className={`flex justify-between mt-0.5 ${yLabels ? "ml-8" : ""}`}>
          <span className="text-[9px] font-mono text-muted/60">{formatShortDate(firstDate)}</span>
          <span className="text-[9px] font-mono text-muted/60">{formatShortDate(lastDate)}</span>
        </div>
      )}
    </div>
  );
}
