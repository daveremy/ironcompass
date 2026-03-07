export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metric_name: string
          notes?: string | null
          unit?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metric_name?: string
          notes?: string | null
          unit?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_metrics_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
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
        Insert: {
          created_at?: string | null
          date: string
          diastolic: number
          id?: string
          systolic: number
          time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          diastolic?: number
          id?: string
          systolic?: number
          time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_pressure_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
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
        Insert: {
          bmr?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass_lbs?: number | null
          created_at?: string | null
          date: string
          muscle_mass_lbs?: number | null
          notes?: string | null
          updated_at?: string | null
          visceral_fat?: number | null
        }
        Update: {
          bmr?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass_lbs?: number | null
          created_at?: string | null
          date?: string
          muscle_mass_lbs?: number | null
          notes?: string | null
          updated_at?: string | null
          visceral_fat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_composition_date_fkey"
            columns: ["date"]
            isOneToOne: true
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
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
        Insert: {
          alcohol?: boolean | null
          created_at?: string | null
          date: string
          energy?: number | null
          notes?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          alcohol?: boolean | null
          created_at?: string | null
          date?: string
          energy?: number | null
          notes?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
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
        Insert: {
          compliant?: boolean | null
          created_at?: string | null
          date: string
          protocol?: string | null
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          compliant?: boolean | null
          created_at?: string | null
          date?: string
          protocol?: string | null
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fasting_date_fkey"
            columns: ["date"]
            isOneToOne: true
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
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
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          fat_g?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          protein_g?: number | null
          time?: string | null
          updated_at?: string | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          fat_g?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          protein_g?: number | null
          time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
      }
      pullups: {
        Row: {
          created_at: string | null
          date: string
          sets: number[] | null
          total_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          sets?: number[] | null
          total_count: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          sets?: number[] | null
          total_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pullups_date_fkey"
            columns: ["date"]
            isOneToOne: true
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
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
        Insert: {
          apple_score?: number | null
          avg_hr_sleep?: number | null
          avg_hrv?: number | null
          cpap?: boolean | null
          created_at?: string | null
          date: string
          hours?: number | null
          mouth_tape?: boolean | null
          notes?: string | null
          oura_readiness?: number | null
          oura_score?: number | null
          updated_at?: string | null
        }
        Update: {
          apple_score?: number | null
          avg_hr_sleep?: number | null
          avg_hrv?: number | null
          cpap?: boolean | null
          created_at?: string | null
          date?: string
          hours?: number | null
          mouth_tape?: boolean | null
          notes?: string | null
          oura_readiness?: number | null
          oura_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sleep_date_fkey"
            columns: ["date"]
            isOneToOne: true
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
      }
      supplements: {
        Row: {
          created_at: string | null
          date: string
          supplements: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          supplements: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          supplements?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplements_date_fkey"
            columns: ["date"]
            isOneToOne: true
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
      }
      workouts: {
        Row: {
          avg_hr: number | null
          calories: number | null
          completed: boolean | null
          created_at: string | null
          date: string
          distance_mi: number | null
          duration_min: number | null
          elevation_ft: number | null
          id: string
          notes: string | null
          planned: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          avg_hr?: number | null
          calories?: number | null
          completed?: boolean | null
          created_at?: string | null
          date: string
          distance_mi?: number | null
          duration_min?: number | null
          elevation_ft?: number | null
          id?: string
          notes?: string | null
          planned?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          avg_hr?: number | null
          calories?: number | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          distance_mi?: number | null
          duration_min?: number | null
          elevation_ft?: number | null
          id?: string
          notes?: string | null
          planned?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["date"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
