import { memo } from "react";

export function computeYRange(values: number[]): { yMin: number; yMax: number } {
  if (values.length === 0) return { yMin: 0, yMax: 1 };
  let yMin = Math.min(...values);
  let yMax = Math.max(...values);
  const yRange = yMax - yMin || 1;
  return { yMin: yMin - yRange * 0.1, yMax: yMax + yRange * 0.1 };
}

interface SparklinePoint {
  date: string;
  value: number;
}

interface SparklineProps {
  points: SparklinePoint[];
  color: string;
  width?: number;
  height?: number;
  goalLine?: number;
  goalColor?: string;
  fill?: boolean;
}

function SparklineInner({
  points,
  color,
  width = 300,
  height = 80,
  goalLine,
  goalColor = "#ffffff33",
  fill = true,
}: SparklineProps) {
  if (points.length === 0) return null;

  const pad = { top: 8, bottom: 8, left: 4, right: 4 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Compute y range including goal line
  const values = points.map((p) => p.value);
  if (goalLine != null) values.push(goalLine);
  const { yMin, yMax } = computeYRange(values);

  // Map dates to x positions proportional to actual time gaps
  const times = points.map((p) => new Date(p.date + "T00:00:00").getTime());
  const tMin = times[0];
  const tMax = times[times.length - 1];
  const tRange = tMax - tMin || 1;

  function toX(t: number) {
    return pad.left + ((t - tMin) / tRange) * plotW;
  }

  function toY(v: number) {
    return pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  }

  const svgPoints = points.map((p, i) => ({
    x: points.length === 1 ? pad.left + plotW / 2 : toX(times[i]),
    y: toY(p.value),
  }));

  const lineD = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const gradientId = `sparkfill-${color.replace("#", "")}`;

  // Fill path: line + close along bottom
  const fillD = points.length > 1
    ? `${lineD} L${svgPoints[svgPoints.length - 1].x},${pad.top + plotH} L${svgPoints[0].x},${pad.top + plotH} Z`
    : "";

  const lastPt = svgPoints[svgPoints.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      role="img"
      aria-label="Sparkline chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      {fill && fillD && (
        <path d={fillD} fill={`url(#${gradientId})`} />
      )}

      {/* Goal line */}
      {goalLine != null && (
        <line
          x1={pad.left}
          y1={toY(goalLine)}
          x2={pad.left + plotW}
          y2={toY(goalLine)}
          stroke={goalColor}
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      )}

      {/* Line */}
      {points.length > 1 && (
        <path d={lineD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      )}

      {/* Last point dot */}
      <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={color} />
    </svg>
  );
}

const Sparkline = memo(SparklineInner);
export default Sparkline;
