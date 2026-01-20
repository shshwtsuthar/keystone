export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      employees: {
        Row: {
          classification: string | null
          created_at: string
          default_location_id: string | null
          full_name: string
          id: string
          is_active: boolean
          member_number: string | null
          organization_id: string
          pay_rate: number | null
          pin_hash: string
          saturday_sunday_rate: number | null
          super_fund_name: string | null
          updated_at: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          default_location_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          member_number?: string | null
          organization_id: string
          pay_rate?: number | null
          pin_hash: string
          saturday_sunday_rate?: number | null
          super_fund_name?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          default_location_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          member_number?: string | null
          organization_id?: string
          pay_rate?: number | null
          pin_hash?: string
          saturday_sunday_rate?: number | null
          super_fund_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          abn: string | null
          company_logo_url: string | null
          created_at: string
          employer_business_name: string | null
          id: string
          name: string
          superannuation_default_rate: number | null
          updated_at: string
        }
        Insert: {
          abn?: string | null
          company_logo_url?: string | null
          created_at?: string
          employer_business_name?: string | null
          id?: string
          name: string
          superannuation_default_rate?: number | null
          updated_at?: string
        }
        Update: {
          abn?: string | null
          company_logo_url?: string | null
          created_at?: string
          employer_business_name?: string | null
          id?: string
          name?: string
          superannuation_default_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pay_run_deductions: {
        Row: {
          created_at: string
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          pay_run_id: string
          superannuation: number
          tax_withheld: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          gross_pay: number
          id?: string
          net_pay: number
          pay_run_id: string
          superannuation?: number
          tax_withheld?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          pay_run_id?: string
          superannuation?: number
          tax_withheld?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_run_deductions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_run_deductions_pay_run_id_fkey"
            columns: ["pay_run_id"]
            isOneToOne: false
            referencedRelation: "pay_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_run_earnings: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          hours: number
          id: string
          pay_run_id: string
          rate: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          hours: number
          id?: string
          pay_run_id: string
          rate: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          hours?: number
          id?: string
          pay_run_id?: string
          rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_run_earnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_run_earnings_pay_run_id_fkey"
            columns: ["pay_run_id"]
            isOneToOne: false
            referencedRelation: "pay_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_runs: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date: string
          status: Database["public"]["Enums"]["pay_run_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date: string
          status?: Database["public"]["Enums"]["pay_run_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string
          status?: Database["public"]["Enums"]["pay_run_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_onboarded: boolean
          master_pin_hash: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_onboarded?: boolean
          master_pin_hash?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_onboarded?: boolean
          master_pin_hash?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          employee_id: string
          id: string
          location_id: string
          organization_id: string
          status: Database["public"]["Enums"]["timesheet_status"]
          updated_at: string
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          location_id: string
          organization_id: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          updated_at?: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
    }
    Enums: {
      pay_run_status: "draft" | "finalized"
      timesheet_status: "working" | "completed"
      user_role: "owner" | "manager"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      pay_run_status: ["draft", "finalized"],
      timesheet_status: ["working", "completed"],
      user_role: ["owner", "manager"],
    },
  },
} as const

