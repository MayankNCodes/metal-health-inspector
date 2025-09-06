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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          calculation_run_id: string | null
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          sample_id: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          calculation_run_id?: string | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          sample_id?: string | null
          severity: string
        }
        Update: {
          alert_type?: string
          calculation_run_id?: string | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sample_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_calculation_run_id_fkey"
            columns: ["calculation_run_id"]
            isOneToOne: false
            referencedRelation: "calculation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "water_samples"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      calculation_runs: {
        Row: {
          calculated_at: string | null
          calculated_by: string | null
          id: string
          indices_calculated: string[]
          intermediate_values: Json | null
          metal_standard_version: Json
          quality_classification: string | null
          results: Json
          sample_id: string
          threshold_violations: string[] | null
          weighting_scheme_id: string | null
        }
        Insert: {
          calculated_at?: string | null
          calculated_by?: string | null
          id?: string
          indices_calculated: string[]
          intermediate_values?: Json | null
          metal_standard_version: Json
          quality_classification?: string | null
          results: Json
          sample_id: string
          threshold_violations?: string[] | null
          weighting_scheme_id?: string | null
        }
        Update: {
          calculated_at?: string | null
          calculated_by?: string | null
          id?: string
          indices_calculated?: string[]
          intermediate_values?: Json | null
          metal_standard_version?: Json
          quality_classification?: string | null
          results?: Json
          sample_id?: string
          threshold_violations?: string[] | null
          weighting_scheme_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculation_runs_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "water_samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculation_runs_weighting_scheme_id_fkey"
            columns: ["weighting_scheme_id"]
            isOneToOne: false
            referencedRelation: "weighting_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          expires_at: string | null
          export_date: string | null
          export_type: string
          exported_by: string | null
          file_path: string | null
          file_size_bytes: number | null
          filters_applied: Json | null
          id: string
        }
        Insert: {
          expires_at?: string | null
          export_date?: string | null
          export_type: string
          exported_by?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          filters_applied?: Json | null
          id?: string
        }
        Update: {
          expires_at?: string | null
          export_date?: string | null
          export_type?: string
          exported_by?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          filters_applied?: Json | null
          id?: string
        }
        Relationships: []
      }
      metal_standards: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          metal_name: string
          permissible_limit: number
          standard_type: string
          symbol: string
          unit: string
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metal_name: string
          permissible_limit: number
          standard_type?: string
          symbol: string
          unit?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metal_name?: string
          permissible_limit?: number
          standard_type?: string
          symbol?: string
          unit?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          organization: string | null
          role: string
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      water_samples: {
        Row: {
          collected_by: string | null
          collection_method: string | null
          created_at: string | null
          depth_meters: number | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          metal_concentrations: Json
          notes: string | null
          ph_value: number | null
          sample_name: string
          sampling_date: string | null
          temperature_celsius: number | null
          updated_at: string | null
        }
        Insert: {
          collected_by?: string | null
          collection_method?: string | null
          created_at?: string | null
          depth_meters?: number | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metal_concentrations: Json
          notes?: string | null
          ph_value?: number | null
          sample_name: string
          sampling_date?: string | null
          temperature_celsius?: number | null
          updated_at?: string | null
        }
        Update: {
          collected_by?: string | null
          collection_method?: string | null
          created_at?: string | null
          depth_meters?: number | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metal_concentrations?: Json
          notes?: string | null
          ph_value?: number | null
          sample_name?: string
          sampling_date?: string | null
          temperature_celsius?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weighting_schemes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          weights: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          weights: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          weights?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
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
