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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      contraceptive_history: {
        Row: {
          contraceptive_brand: string | null
          contraceptive_type: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          contraceptive_brand?: string | null
          contraceptive_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          user_id: string
        }
        Update: {
          contraceptive_brand?: string | null
          contraceptive_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          cycle_phase: Database["public"]["Enums"]["cycle_phase"] | null
          energy: number | null
          id: string
          log_date: string
          mood: number | null
          notes: string | null
          stress: number | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          cycle_phase?: Database["public"]["Enums"]["cycle_phase"] | null
          energy?: number | null
          id?: string
          log_date?: string
          mood?: number | null
          notes?: string | null
          stress?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          cycle_phase?: Database["public"]["Enums"]["cycle_phase"] | null
          energy?: number | null
          id?: string
          log_date?: string
          mood?: number | null
          notes?: string | null
          stress?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      intimacy_logs: {
        Row: {
          activity_type: string | null
          created_at: string
          fluid_type: string | null
          id: string
          is_protected: boolean | null
          libido: number | null
          log_date: string
          pleasure_rating: number | null
          sensation_emotional: string[] | null
          sensation_physical: string[] | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          fluid_type?: string | null
          id?: string
          is_protected?: boolean | null
          libido?: number | null
          log_date?: string
          pleasure_rating?: number | null
          sensation_emotional?: string[] | null
          sensation_physical?: string[] | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          fluid_type?: string | null
          id?: string
          is_protected?: boolean | null
          libido?: number | null
          log_date?: string
          pleasure_rating?: number | null
          sensation_emotional?: string[] | null
          sensation_physical?: string[] | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_streaks: {
        Row: {
          created_at: string
          id: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          user_id?: string
        }
        Relationships: []
      }
      menstruation_logs: {
        Row: {
          created_at: string
          emergency_contraception: boolean | null
          id: string
          is_menstruating: boolean
          log_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_contraception?: boolean | null
          id?: string
          is_menstruating?: boolean
          log_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_contraception?: boolean | null
          id?: string
          is_menstruating?: boolean
          log_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_intake: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          id: string
          intake_date: string
          meal_name: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          intake_date?: string
          meal_name?: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          intake_date?: string
          meal_name?: string | null
          meal_type?: Database["public"]["Enums"]["meal_type"]
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      pill_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          skipped: boolean | null
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          skipped?: boolean | null
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          skipped?: boolean | null
          taken_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contraceptive_brand: string | null
          contraceptive_details: Json | null
          contraceptive_start_date: string | null
          contraceptive_type: string | null
          created_at: string
          cycle_length: number | null
          date_of_birth: string | null
          diet_type: string | null
          fitness_level: string | null
          full_name: string | null
          goal: string | null
          id: string
          is_trying_to_conceive: boolean | null
          last_period_start: string | null
          life_phase: string | null
          macro_calories_goal: number | null
          macro_carbs_goal: number | null
          macro_fat_goal: number | null
          macro_protein_goal: number | null
          medication_frequency_days: number | null
          medication_last_taken: string | null
          medication_name: string | null
          medication_type: string | null
          onboarding_completed: boolean
          period_duration: number | null
          pill_reminder_time: string | null
          pregnancy_start_date: string | null
          trial_end_date: string | null
          trial_reminder_sent: boolean | null
          tutorial_progress: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          contraceptive_brand?: string | null
          contraceptive_details?: Json | null
          contraceptive_start_date?: string | null
          contraceptive_type?: string | null
          created_at?: string
          cycle_length?: number | null
          date_of_birth?: string | null
          diet_type?: string | null
          fitness_level?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          is_trying_to_conceive?: boolean | null
          last_period_start?: string | null
          life_phase?: string | null
          macro_calories_goal?: number | null
          macro_carbs_goal?: number | null
          macro_fat_goal?: number | null
          macro_protein_goal?: number | null
          medication_frequency_days?: number | null
          medication_last_taken?: string | null
          medication_name?: string | null
          medication_type?: string | null
          onboarding_completed?: boolean
          period_duration?: number | null
          pill_reminder_time?: string | null
          pregnancy_start_date?: string | null
          trial_end_date?: string | null
          trial_reminder_sent?: boolean | null
          tutorial_progress?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          contraceptive_brand?: string | null
          contraceptive_details?: Json | null
          contraceptive_start_date?: string | null
          contraceptive_type?: string | null
          created_at?: string
          cycle_length?: number | null
          date_of_birth?: string | null
          diet_type?: string | null
          fitness_level?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          is_trying_to_conceive?: boolean | null
          last_period_start?: string | null
          life_phase?: string | null
          macro_calories_goal?: number | null
          macro_carbs_goal?: number | null
          macro_fat_goal?: number | null
          macro_protein_goal?: number | null
          medication_frequency_days?: number | null
          medication_last_taken?: string | null
          medication_name?: string | null
          medication_type?: string | null
          onboarding_completed?: boolean
          period_duration?: number | null
          pill_reminder_time?: string | null
          pregnancy_start_date?: string | null
          trial_end_date?: string | null
          trial_reminder_sent?: boolean | null
          tutorial_progress?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_history: {
        Row: {
          created_at: string
          cycle_phase: string | null
          diet_type: string | null
          hormonal_benefit: string | null
          id: string
          ingredients: string[]
          instructions: string[]
          is_favorite: boolean | null
          recipe_description: string | null
          recipe_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_phase?: string | null
          diet_type?: string | null
          hormonal_benefit?: string | null
          id?: string
          ingredients: string[]
          instructions: string[]
          is_favorite?: boolean | null
          recipe_description?: string | null
          recipe_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_phase?: string | null
          diet_type?: string | null
          hormonal_benefit?: string | null
          id?: string
          ingredients?: string[]
          instructions?: string[]
          is_favorite?: boolean | null
          recipe_description?: string | null
          recipe_name?: string
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          completed: boolean | null
          created_at: string
          duration_minutes: number | null
          exercises: Json | null
          id: string
          user_id: string
          workout_date: string
          workout_name: string
          workout_type: Database["public"]["Enums"]["workout_type"]
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          exercises?: Json | null
          id?: string
          user_id: string
          workout_date?: string
          workout_name: string
          workout_type: Database["public"]["Enums"]["workout_type"]
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          exercises?: Json | null
          id?: string
          user_id?: string
          workout_date?: string
          workout_name?: string
          workout_type?: Database["public"]["Enums"]["workout_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_tutorial: { Args: { tutorial_key: string }; Returns: undefined }
    }
    Enums: {
      cycle_phase: "menstrual" | "folicular" | "ovulatoria" | "lutea"
      meal_type: "cafe" | "almoco" | "jantar" | "lanche"
      workout_type: "hiit" | "forca" | "yoga" | "mobilidade" | "cardio"
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
    Enums: {
      cycle_phase: ["menstrual", "folicular", "ovulatoria", "lutea"],
      meal_type: ["cafe", "almoco", "jantar", "lanche"],
      workout_type: ["hiit", "forca", "yoga", "mobilidade", "cardio"],
    },
  },
} as const
