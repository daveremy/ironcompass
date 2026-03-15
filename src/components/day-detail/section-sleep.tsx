import type { SleepRow, MetricRow } from "@/lib/types";
import SectionCard from "./section-card";
import Badge from "./badge";
import { Stat } from "./section-vitals";

export default function SectionSleep({
  data,
  sleepTags = [],
  prKeys,
}: {
  data: SleepRow | null;
  sleepTags?: MetricRow[];
  prKeys?: Set<string>;
}) {
  return (
    <SectionCard title="Sleep" accent="#8b5cf6" empty={!data && sleepTags.length === 0}>
      {(data || sleepTags.length > 0) && (
        <div className="space-y-3">
          {data && (
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Apple Score" value={data.apple_score} />
              <Stat
                label="Oura Score"
                value={data.oura_score}
                indicator={prKeys?.has("sleep_oura") ? "pr" : undefined}
              />
              <Stat
                label="Hours"
                value={data.hours}
                indicator={prKeys?.has("sleep_hours") ? "pr" : undefined}
              />
              <Stat label="Oura Readiness" value={data.oura_readiness} />
              <Stat label="Avg HRV" value={data.avg_hrv} unit="ms" />
              <Stat label="Avg HR (Sleep)" value={data.avg_hr_sleep} unit="bpm" />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {data?.cpap != null && <Badge label="CPAP" active={data.cpap} />}
            {data?.mouth_tape != null && <Badge label="Mouth Tape" active={data.mouth_tape} />}
            {sleepTags.map((tag) => (
              <Badge key={tag.id} label={tag.metric_name.replace(/-/g, " ")} />
            ))}
          </div>
          {data?.notes && (
            <p className="text-sm text-foreground/80">{data.notes}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
