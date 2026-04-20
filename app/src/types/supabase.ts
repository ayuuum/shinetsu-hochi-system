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
    PostgrestVersion: "14.4"
  }
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
      alcohol_checks: {
        Row: {
          check_datetime: string | null
          check_type: string | null
          checker_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string | null
          id: string
          is_abnormal: boolean | null
          location: string | null
          measured_value: number | null
          notes: string | null
        }
        Insert: {
          check_datetime?: string | null
          check_type?: string | null
          checker_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          id?: string
          is_abnormal?: boolean | null
          location?: string | null
          measured_value?: number | null
          notes?: string | null
        }
        Update: {
          check_datetime?: string | null
          check_type?: string | null
          checker_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          id?: string
          is_abnormal?: boolean | null
          location?: string | null
          measured_value?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alcohol_checks_checker_id_fkey"
            columns: ["checker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alcohol_checks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_images: {
        Row: {
          id: string
          qualification_id: string
          storage_path: string
          mime_type: string | null
          caption: string | null
          sort_order: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          qualification_id: string
          storage_path: string
          mime_type?: string | null
          caption?: string | null
          sort_order?: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          qualification_id?: string
          storage_path?: string
          mime_type?: string | null
          caption?: string | null
          sort_order?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_images_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_logs: {
        Row: {
          alert_level: string | null
          category: string
          created_at: string | null
          employee_id: string | null
          expiry_date: string | null
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          target_id: string
          target_name: string | null
        }
        Insert: {
          alert_level?: string | null
          category: string
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          target_id: string
          target_name?: string | null
        }
        Update: {
          alert_level?: string | null
          category?: string
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          target_id?: string
          target_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          summary?: string | null
        }
        Relationships: []
      }
      construction_records: {
        Row: {
          category: string | null
          client_name: string | null
          construction_date: string
          construction_name: string
          contract_amount: number | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string | null
          end_date: string | null
          equipment_types: string[] | null
          id: string
          location: string | null
          notes: string | null
          role: string | null
          work_type: string | null
        }
        Insert: {
          category?: string | null
          client_name?: string | null
          construction_date: string
          construction_name: string
          contract_amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          end_date?: string | null
          equipment_types?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          role?: string | null
          work_type?: string | null
        }
        Update: {
          category?: string | null
          client_name?: string | null
          construction_date?: string
          construction_name?: string
          contract_amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          end_date?: string | null
          equipment_types?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          role?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_damage_insurances: {
        Row: {
          agency: string | null
          coverage_details: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          insurance_company: string
          insurance_name: string
          insurance_type: string
          notes: string | null
          renewal_date: string
          updated_at: string | null
        }
        Insert: {
          agency?: string | null
          coverage_details?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          insurance_company: string
          insurance_name: string
          insurance_type: string
          notes?: string | null
          renewal_date: string
          updated_at?: string | null
        }
        Update: {
          agency?: string | null
          coverage_details?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          insurance_company?: string
          insurance_name?: string
          insurance_type?: string
          notes?: string | null
          renewal_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_damage_insurances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_family: {
        Row: {
          address: string | null
          birth_date: string | null
          blood_type: string | null
          created_at: string | null
          employee_id: string | null
          has_disability: boolean | null
          id: string
          is_dependent: boolean | null
          is_emergency_contact: boolean | null
          name: string
          phone_number: string | null
          relationship: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          blood_type?: string | null
          created_at?: string | null
          employee_id?: string | null
          has_disability?: boolean | null
          id?: string
          is_dependent?: boolean | null
          is_emergency_contact?: boolean | null
          name: string
          phone_number?: string | null
          relationship?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          blood_type?: string | null
          created_at?: string | null
          employee_id?: string | null
          has_disability?: boolean | null
          id?: string
          is_dependent?: boolean | null
          is_emergency_contact?: boolean | null
          name?: string
          phone_number?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_family_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_it_accounts: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          login_id: string | null
          notes: string | null
          service_name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          login_id?: string | null
          notes?: string | null
          service_name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          login_id?: string | null
          notes?: string | null
          service_name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_it_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_life_insurances: {
        Row: {
          agency: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          insurance_company: string
          insurance_name: string
          maturity_date: string
          notes: string | null
          payout_ratio: number | null
          peak_date: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          agency?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          insurance_company: string
          insurance_name: string
          maturity_date: string
          notes?: string | null
          payout_ratio?: number | null
          peak_date?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          agency?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          insurance_company?: string
          insurance_name?: string
          maturity_date?: string
          notes?: string | null
          payout_ratio?: number | null
          peak_date?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_life_insurances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_qualifications: {
        Row: {
          acquired_date: string | null
          acquisition_type: string | null
          certificate_number: string | null
          certificate_url: string | null
          created_at: string | null
          employee_id: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          issuing_authority: string | null
          notes: string | null
          photo_renewal_date: string | null
          qualification_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acquired_date?: string | null
          acquisition_type?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          issuing_authority?: string | null
          notes?: string | null
          photo_renewal_date?: string | null
          qualification_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acquired_date?: string | null
          acquisition_type?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          issuing_authority?: string | null
          notes?: string | null
          photo_renewal_date?: string | null
          qualification_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_qualifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_qualifications_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualification_master"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          branch: string | null
          category: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          management_number: string
          name: string
          notes: string | null
          purchase_amount: number | null
          purchase_date: string | null
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          management_number: string
          name: string
          notes?: string | null
          purchase_amount?: number | null
          purchase_date?: string | null
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          management_number?: string
          name?: string
          notes?: string | null
          purchase_amount?: number | null
          purchase_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          allowances: string | null
          birth_date: string
          blood_pressure_monitoring: boolean | null
          blood_type: string | null
          branch: string | null
          commute_distance: number | null
          commute_time: number | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          emp_insurance_no: string | null
          employee_number: string
          employment_type: string | null
          gender: string | null
          health_insurance_no: string | null
          health_insurance_type: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          medication_notes: string | null
          mutual_aid_no: string | null
          name: string
          name_kana: string
          pension_no: string | null
          pension_type: string | null
          phone_number: string | null
          photo_url: string | null
          position: string | null
          salary_increase_notes: string | null
          termination_date: string | null
          updated_at: string | null
          wage_type: string | null
          work_time_detail: string | null
        }
        Insert: {
          address?: string | null
          allowances?: string | null
          birth_date: string
          blood_pressure_monitoring?: boolean | null
          blood_type?: string | null
          branch?: string | null
          commute_distance?: number | null
          commute_time?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          emp_insurance_no?: string | null
          employee_number: string
          employment_type?: string | null
          gender?: string | null
          health_insurance_no?: string | null
          health_insurance_type?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          medication_notes?: string | null
          mutual_aid_no?: string | null
          name: string
          name_kana: string
          pension_no?: string | null
          pension_type?: string | null
          phone_number?: string | null
          photo_url?: string | null
          position?: string | null
          salary_increase_notes?: string | null
          termination_date?: string | null
          updated_at?: string | null
          wage_type?: string | null
          work_time_detail?: string | null
        }
        Update: {
          address?: string | null
          allowances?: string | null
          birth_date?: string
          blood_pressure_monitoring?: boolean | null
          blood_type?: string | null
          branch?: string | null
          commute_distance?: number | null
          commute_time?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          emp_insurance_no?: string | null
          employee_number?: string
          employment_type?: string | null
          gender?: string | null
          health_insurance_no?: string | null
          health_insurance_type?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          medication_notes?: string | null
          mutual_aid_no?: string | null
          name?: string
          name_kana?: string
          pension_no?: string | null
          pension_type?: string | null
          phone_number?: string | null
          photo_url?: string | null
          position?: string | null
          salary_increase_notes?: string | null
          termination_date?: string | null
          updated_at?: string | null
          wage_type?: string | null
          work_time_detail?: string | null
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          check_date: string
          check_type: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string | null
          height: number | null
          hospital_name: string | null
          id: string
          is_normal: boolean | null
          notes: string | null
          weight: number | null
        }
        Insert: {
          check_date: string
          check_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          height?: number | null
          hospital_name?: string | null
          id?: string
          is_normal?: boolean | null
          notes?: string | null
          weight?: number | null
        }
        Update: {
          check_date?: string
          check_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          height?: number | null
          hospital_name?: string | null
          id?: string
          is_normal?: boolean | null
          notes?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_checks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      import_runs: {
        Row: {
          created_at: string
          error_rows: Json
          failed_rows: number
          finished_at: string | null
          id: string
          import_kind: string
          initiated_by: string | null
          initiated_email: string | null
          inserted_rows: number
          skipped_rows: number
          source_file_name: string | null
          status: string
          summary: string | null
          total_rows: number
          valid_rows: number
        }
        Insert: {
          created_at?: string
          error_rows?: Json
          failed_rows?: number
          finished_at?: string | null
          id?: string
          import_kind: string
          initiated_by?: string | null
          initiated_email?: string | null
          inserted_rows?: number
          skipped_rows?: number
          source_file_name?: string | null
          status: string
          summary?: string | null
          total_rows?: number
          valid_rows?: number
        }
        Update: {
          created_at?: string
          error_rows?: Json
          failed_rows?: number
          finished_at?: string | null
          id?: string
          import_kind?: string
          initiated_by?: string | null
          initiated_email?: string | null
          inserted_rows?: number
          skipped_rows?: number
          source_file_name?: string | null
          status?: string
          summary?: string | null
          total_rows?: number
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_runs_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          job_key: string
          job_label: string
          metrics: Json
          processed_items: number
          started_at: string
          status: string
          total_items: number
          trigger_type: string
          triggered_by: string | null
          triggered_email: string | null
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_key: string
          job_label: string
          metrics?: Json
          processed_items?: number
          started_at?: string
          status: string
          total_items?: number
          trigger_type: string
          triggered_by?: string | null
          triggered_email?: string | null
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_key?: string
          job_label?: string
          metrics?: Json
          processed_items?: number
          started_at?: string
          status?: string
          total_items?: number
          trigger_type?: string
          triggered_by?: string | null
          triggered_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_master: {
        Row: {
          category: string | null
          created_at: string | null
          has_expiry: boolean | null
          id: string
          name: string
          renewal_rule: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          has_expiry?: boolean | null
          id?: string
          name: string
          renewal_rule?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          has_expiry?: boolean | null
          id?: string
          name?: string
          renewal_rule?: string | null
        }
        Relationships: []
      }
      training_history: {
        Row: {
          certificate_number: string | null
          created_at: string | null
          employee_qualification_id: string
          id: string
          next_due_date: string | null
          notes: string | null
          provider: string | null
          training_date: string
          training_type: string
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string | null
          employee_qualification_id: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          provider?: string | null
          training_date: string
          training_type?: string
        }
        Update: {
          certificate_number?: string | null
          created_at?: string | null
          employee_qualification_id?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          provider?: string | null
          training_date?: string
          training_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_history_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id: string
          role: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          inspection_expiry: string | null
          liability_insurance_expiry: string | null
          plate_number: string
          primary_user_id: string | null
          vehicle_name: string | null
          voluntary_insurance_expiry: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          inspection_expiry?: string | null
          liability_insurance_expiry?: string | null
          plate_number: string
          primary_user_id?: string | null
          vehicle_name?: string | null
          voluntary_insurance_expiry?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          inspection_expiry?: string | null
          liability_insurance_expiry?: string | null
          plate_number?: string
          primary_user_id?: string | null
          vehicle_name?: string | null
          voluntary_insurance_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_primary_user_id_fkey"
            columns: ["primary_user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
      soft_delete_employee: {
        Args: { p_deleted_by: string; p_employee_id: string }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
