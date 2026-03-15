"use client";

import { useId } from "react";

export const STRAVA_ORANGE = "#FC4C02";

/** Decode a Google-encoded polyline string into [lat, lng] pairs. */
function decodePolyline(str: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    let shift = 1, result = 0, byte: number;
    do { byte = str.charCodeAt(index++) - 63; result += (byte & 0x1f) * shift; shift *= 32; } while (byte >= 0x20);
    lat += (result & 1) ? ((-result - 1) / 2) : (result / 2);
    shift = 1; result = 0;
    do { byte = str.charCodeAt(index++) - 63; result += (byte & 0x1f) * shift; shift *= 32; } while (byte >= 0x20);
    lng += (result & 1) ? ((-result - 1) / 2) : (result / 2);
    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

function RouteSvg({ encoded }: { encoded: string }) {
  const filterId = useId();
  let points: [number, number][];
  try {
    points = decodePolyline(encoded);
  } catch {
    return null;
  }

  if (points.length === 0) return null;

  // Compute bounds in a single pass (avoids Math.min/max spread stack overflow on large polylines)
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const spanLat = maxLat - minLat || 0.001;
  const spanLng = maxLng - minLng || 0.001;

  // Add 10% padding
  const pad = 0.1;
  const padLat = spanLat * pad;
  const padLng = spanLng * pad;

  const width = 400;
  // Clamp aspect ratio to prevent extremely tall/flat SVGs on linear routes
  const rawRatio = (spanLat + 2 * padLat) / (spanLng + 2 * padLng);
  const height = 400 * Math.min(Math.max(rawRatio, 0.3), 2);

  // Single point: render a dot
  if (points.length === 1) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-md bg-background/80" preserveAspectRatio="xMidYMid meet">
        <circle cx={width / 2} cy={height / 2} r={4} fill={STRAVA_ORANGE} />
      </svg>
    );
  }

  // Normalize to SVG coordinates
  const svgPoints = points
    .map((p) => {
      const x = ((p[1] - minLng + padLng) / (spanLng + 2 * padLng)) * width;
      // Flip Y axis (lat increases upward, SVG Y increases downward)
      const y = ((maxLat - p[0] + padLat) / (spanLat + 2 * padLat)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-md bg-background/80" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={svgPoints}
        fill="none"
        stroke={STRAVA_ORANGE}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}

export default function StravaActivity({
  strava_id,
  summary_polyline,
}: {
  strava_id?: string | number;
  summary_polyline?: string;
}) {
  const hasMap = typeof summary_polyline === "string" && summary_polyline.length > 0;
  const hasLink = strava_id != null;

  if (!hasMap && !hasLink) return null;

  return (
    <div className="space-y-2">
      {hasMap && <RouteSvg encoded={summary_polyline} />}
      {hasLink && (
        <a
          href={`https://www.strava.com/activities/${strava_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-mono hover:underline"
          style={{ color: STRAVA_ORANGE }}
        >
          View on Strava ↗
        </a>
      )}
    </div>
  );
}
