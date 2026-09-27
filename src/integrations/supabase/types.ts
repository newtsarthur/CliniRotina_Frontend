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
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string | null
          created_at: string | null
          doctor_id: string
          doctor_name: string | null
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          start_time: string
          status: string | null
          type: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time?: string | null
          created_at?: string | null
          doctor_id: string
          doctor_name?: string | null
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          start_time: string
          status?: string | null
          type?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string | null
          created_at?: string | null
          doctor_id?: string
          doctor_name?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          start_time?: string
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_catalog: {
        Row: {
          category: string
          created_at: string | null
          dosage_unit: string | null
          id: string
          is_custom: boolean | null
          item_type: string | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          dosage_unit?: string | null
          id?: string
          is_custom?: boolean | null
          item_type?: string | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          dosage_unit?: string | null
          id?: string
          is_custom?: boolean | null
          item_type?: string | null
          name?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string | null
          id: string
          mood: string
          updated_at: string | null
          user_id: string
          water_completed: boolean | null
        }
        Insert: {
          checkin_date: string
          created_at?: string | null
          id?: string
          mood: string
          updated_at?: string | null
          user_id: string
          water_completed?: boolean | null
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          id?: string
          mood?: string
          updated_at?: string | null
          user_id?: string
          water_completed?: boolean | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          file_path: string
          file_type: string
          id: string
          patient_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_path: string
          file_type: string
          id?: string
          patient_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_path?: string
          file_type?: string
          id?: string
          patient_id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_admins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          crm: string
          email: string
          expires_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          token_hash: string
          uf: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          crm: string
          email: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          token_hash: string
          uf: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          crm?: string
          email?: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          token_hash?: string
          uf?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_invitations_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          doctor_id: string | null
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          patient_id: string | null
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          doctor_id?: string | null
          event_type: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          patient_id?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          doctor_id?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          patient_id?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_daily_actions: {
        Row: {
          action_date: string | null
          action_type: string
          created_at: string | null
          id: string
          medication_id: string | null
          patient_id: string | null
          value: string | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          medication_id?: string | null
          patient_id?: string | null
          value?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          medication_id?: string | null
          patient_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_daily_actions_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_daily_actions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_logs: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string | null
          patient_id: string | null
          prescription_id: string | null
          status: string | null
          taken_at: string | null
          taken_date: string | null
          type: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id?: string | null
          patient_id?: string | null
          prescription_id?: string | null
          status?: string | null
          taken_at?: string | null
          taken_date?: string | null
          type: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string | null
          patient_id?: string | null
          prescription_id?: string | null
          status?: string | null
          taken_at?: string | null
          taken_date?: string | null
          type?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_logs_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_protocol_progress: {
        Row: {
          completed_at: string | null
          id: string
          patient_id: string | null
          protocol_item_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          patient_id?: string | null
          protocol_item_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          patient_id?: string | null
          protocol_item_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_protocol_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_protocol_progress_protocol_item_id_fkey"
            columns: ["protocol_item_id"]
            isOneToOne: false
            referencedRelation: "protocol_items"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          dosage: string | null
          frequency: string | null
          id: string
          medication_name: string
          patient_id: string
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          dosage?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          patient_id: string
          start_date?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          dosage?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          patient_id?: string
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          crm: string | null
          current_protocol_id: string | null
          doctor_crm_reference: string | null
          doctor_id: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          id: string
          notifications_enabled: boolean | null
          phone: string | null
          state: string | null
          uf: string | null
          updated_at: string | null
          user_type: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          current_protocol_id?: string | null
          doctor_crm_reference?: string | null
          doctor_id?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id: string
          notifications_enabled?: boolean | null
          phone?: string | null
          state?: string | null
          uf?: string | null
          updated_at?: string | null
          user_type?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          current_protocol_id?: string | null
          doctor_crm_reference?: string | null
          doctor_id?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id?: string
          notifications_enabled?: boolean | null
          phone?: string | null
          state?: string | null
          uf?: string | null
          updated_at?: string | null
          user_type?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_protocol_id_fkey"
            columns: ["current_protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_items: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          patient_id: string
          protocol_id: string
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          patient_id: string
          protocol_id: string
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          patient_id?: string
          protocol_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_items_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          is_active: boolean | null
          message: string | null
          patient_id: string
          phase_name: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          is_active?: boolean | null
          message?: string | null
          patient_id: string
          phase_name?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_active?: boolean | null
          message?: string | null
          patient_id?: string
          phase_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocols_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_appointment_conflict: {
        Args: {
          p_doctor_id: string
          p_end_time: string
          p_exclude_id?: string
          p_start_time: string
        }
        Returns: boolean
      }
      complete_patient_registration: {
        Args: {
          p_cpf: string
          p_doctor_crm_reference: string
          p_full_name: string
          p_phone: string
        }
        Returns: undefined
      }
      complete_doctor_registration: {
        Args: {
          p_cpf: string
          p_crm: string
          p_full_name: string
          p_invite_token: string
          p_phone: string
          p_uf: string
        }
        Returns: undefined
      }
      create_doctor_invitation: {
        Args: {
          p_crm: string
          p_email: string
          p_expires_at?: string | null
          p_full_name?: string | null
          p_phone?: string | null
          p_uf: string
        }
        Returns: string
      }
      current_clinic_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      find_doctor_by_crm: {
        Args: {
          p_crm: string
          p_uf?: string | null
        }
        Returns: {
          crm: string | null
          full_name: string | null
          id: string
          uf: string | null
        }[]
      }
      get_my_patients: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          created_at: string | null
          cpf: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }[]
      }
      get_linked_patient: {
        Args: {
          p_patient_id: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string | null
          cpf: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }[]
      }
      get_my_doctor: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          crm: string | null
          full_name: string | null
          id: string
          uf: string | null
        }[]
      }
      is_clinic_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      record_medication_check: {
        Args: {
          p_prescription_id: string
          p_taken?: boolean
        }
        Returns: {
          action_date: string
          is_taken: boolean
          prescription_id: string
        }[]
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "rejected" | "cancelled"
      appointment_type: "Consulta" | "Exame" | "Retorno"
      user_type: "doctor" | "patient"
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
      appointment_status: ["pending", "confirmed", "rejected", "cancelled"],
      appointment_type: ["Consulta", "Exame", "Retorno"],
      user_type: ["doctor", "patient"],
    },
  },
} as const
