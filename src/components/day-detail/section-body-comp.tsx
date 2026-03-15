import type { BodyCompositionRow } from "@/lib/types";
import SectionCard from "./section-card";
import { Stat } from "./section-vitals";

export default function SectionBodyComp({
  data,
  weight,
  prKeys,
}: {
  data: BodyCompositionRow | null;
  weight?: number | null;
  prKeys?: Set<string>;
}) {
  const hasData = data || weight != null;
  return (
    <SectionCard title="Body Composition" accent="#ec4899" empty={!hasData}>
      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {weight != null && (
            <Stat
              label="Weight"
              value={weight}
              unit="lbs"
              indicator={prKeys?.has("weight_low") ? "pr" : undefined}
            />
          )}
          {data && (
            <>
              <Stat
                label="Body Fat"
                value={data.body_fat_pct}
                unit="%"
                indicator={prKeys?.has("body_fat_low") ? "pr" : undefined}
              />
              <Stat label="Muscle Mass" value={data.muscle_mass_lbs} unit="lbs" />
              <Stat label="Bone Mass" value={data.bone_mass_lbs} unit="lbs" />
              <Stat label="Body Water" value={data.body_water_pct} unit="%" />
              <Stat label="Visceral Fat" value={data.visceral_fat} />
              <Stat label="BMR" value={data.bmr} unit="cal" />
              {data.notes && (
                <div className="col-span-full">
                  <Stat label="Notes" value={data.notes} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
}
