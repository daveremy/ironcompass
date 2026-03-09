export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_metrics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metric_name: string
          notes: string | null
          unit: string | null
          updated_at: string | null
          value: number
        }
      }
      blood_pressure: {
        Row: {
          created_at: string | null
          date: string
          diastolic: number
          id: string
          systolic: number
          time: string | null
          updated_at: string | null
        }
      }
      body_composition: {
        Row: {
          bmr: number | null
          body_fat_pct: number | null
          body_water_pct: number | null
          bone_mass_lbs: number | null
          created_at: string | null
          date: string
          muscle_mass_lbs: number | null
          notes: string | null
          updated_at: string | null
          visceral_fat: number | null
        }
      }
      daily_entries: {
        Row: {
          alcohol: boolean | null
          created_at: string | null
          date: string
          energy: number | null
          notes: string | null
          updated_at: string | null
          weight: number | null
        }
      }
      fasting: {
        Row: {
          compliant: boolean | null
          created_at: string | null
          date: string
          protocol: string | null
          updated_at: string | null
          window_end: string | null
          window_start: string | null
        }
      }
      meals: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          date: string
          description: string | null
          fat_g: number | null
          id: string
          name: string | null
          notes: string | null
          protein_g: number | null
          time: string | null
          updated_at: string | null
        }
      }
      pullups: {
        Row: {
          created_at: string | null
          date: string
          sets: number[] | null
          total_count: number
          updated_at: string | null
        }
      }
      sleep: {
        Row: {
          apple_score: number | null
          avg_hr_sleep: number | null
          avg_hrv: number | null
          cpap: boolean | null
          created_at: string | null
          date: string
          hours: number | null
          mouth_tape: boolean | null
          notes: string | null
          oura_readiness: number | null
          oura_score: number | null
          updated_at: string | null
        }
      }
      supplements: {
        Row: {
          created_at: string | null
          date: string
          supplements: string[]
          updated_at: string | null
        }
      }
      workout_types: {
        Row: {
          name: string
          display_name: string
          color: string
        }
      }
      workouts: {
        Row: {
          avg_hr: number | null
          calories: number | null
          completed: boolean | null
          created_at: string | null
          date: string
          details: Record<string, unknown> | null
          distance_mi: number | null
          duration_min: number | null
          elevation_ft: number | null
          end_time: string | null
          id: string
          notes: string | null
          planned: boolean | null
          source: string | null
          start_time: string | null
          type: string
          updated_at: string | null
        }
      }
    }
  }
}

export type ViewType = "calendar" | "daily" | "metrics" | "weekly";

export interface WeekSummary {
  workoutCount: number;
  avgSleepHours: number | null;
  weightDelta: number | null;
  fastingCompliant: number;
  fastingTotal: number;
}

export interface DaySummary {
  date: string;
  weight: number | null;
  energy: number | null;
  alcohol: boolean | null;
  sleepHours: number | null;
  ouraScore: number | null;
  appleScore: number | null;
  workouts: WorkoutRow[];
  totalProtein: number | null;
  totalCalories: number | null;
  fastingCompliant: boolean | null;
  pullups: number | null;
}

export interface WeekData {
  start: string;
  end: string;
  days: DaySummary[];
  summary: {
    daysLogged: number;
    weight: { first: number | null; last: number | null; delta: number | null };
    sleep: { avgHours: number | null; avgOura: number | null; avgApple: number | null };
    workouts: { total: number; types: string[] };
    meals: { avgDailyProtein: number | null; avgDailyCalories: number | null };
    fasting: { compliantDays: number; totalDays: number };
    alcohol: { daysWith: number; daysWithout: number };
    pullups: { total: number; days: number };
  };
}

export type CustomMetricRow = Database["public"]["Tables"]["custom_metrics"]["Row"];
export type BloodPressureRow = Database["public"]["Tables"]["blood_pressure"]["Row"];
export type BodyCompositionRow = Database["public"]["Tables"]["body_composition"]["Row"];
export type DailyEntryRow = Database["public"]["Tables"]["daily_entries"]["Row"];
export type FastingRow = Database["public"]["Tables"]["fasting"]["Row"];
export type MealRow = Database["public"]["Tables"]["meals"]["Row"];
export type PullupsRow = Database["public"]["Tables"]["pullups"]["Row"];
export type SleepRow = Database["public"]["Tables"]["sleep"]["Row"];
export type SupplementsRow = Database["public"]["Tables"]["supplements"]["Row"];
export type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"]
