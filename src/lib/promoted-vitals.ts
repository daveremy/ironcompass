export const PROMOTED_VITALS: Record<string, { label: string; aggregate: "sum" | "latest" }> = {
  water:      { label: "Water",      aggregate: "sum" },
  coffee:     { label: "Coffee",     aggregate: "sum" },
  steps:      { label: "Steps",      aggregate: "sum" },
  resting_hr: { label: "Resting HR", aggregate: "latest" },
  hrv:        { label: "HRV",        aggregate: "latest" },
};
