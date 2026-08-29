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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          archived_at: string | null
          brand: Json
          created_at: string
          id: string
          is_demo: boolean
          name: string
          sector: string | null
          slug: string
          theme_tokens: Json
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          brand?: Json
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          sector?: string | null
          slug: string
          theme_tokens?: Json
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          brand?: Json
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          sector?: string | null
          slug?: string
          theme_tokens?: Json
          updated_at?: string
        }
        Relationships: []
      }
      collection_templates: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          published_at: string | null
          schema: Json
          updated_at: string
          version: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          schema?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          schema?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          client_id: string
          created_at: string
          email: string
          id: string
          is_primary: boolean
          name: string
          role_label: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean
          name: string
          role_label?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          name?: string
          role_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          client_id: string
          created_at: string
          id: string
          name: string
          period_label: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          name: string
          period_label?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          period_label?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write: { Args: never; Returns: boolean }
      can_write_client: { Args: { _client_id: string }; Returns: boolean }
      has_client_access: { Args: { _client_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: never; Returns: boolean }
      is_team_member: { Args: never; Returns: boolean }
    }
    Enums: {
      actor_type: "user" | "link" | "system"
      analysis_type: "constat" | "hypothese" | "recommandation" | "note"
      app_role: "owner" | "analyst" | "viewer"
      collection_status:
        | "draft"
        | "open"
        | "partially_submitted"
        | "submitted"
        | "closed"
      file_scan_status: "pending" | "clean" | "rejected"
      metric_provenance: "manual" | "csv" | "capture_ocr" | "derived"
      notification_status: "queued" | "sent" | "failed"
      recipient_status: "pending" | "opened" | "submitted" | "bounced"
      review_status:
        | "draft"
        | "in_review"
        | "approved"
        | "published"
        | "archived"
      secure_link_scope: "collection" | "review"
      submission_status: "working" | "submitted"
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
      actor_type: ["user", "link", "system"],
      analysis_type: ["constat", "hypothese", "recommandation", "note"],
      app_role: ["owner", "analyst", "viewer"],
      collection_status: [
        "draft",
        "open",
        "partially_submitted",
        "submitted",
        "closed",
      ],
      file_scan_status: ["pending", "clean", "rejected"],
      metric_provenance: ["manual", "csv", "capture_ocr", "derived"],
      notification_status: ["queued", "sent", "failed"],
      recipient_status: ["pending", "opened", "submitted", "bounced"],
      review_status: [
        "draft",
        "in_review",
        "approved",
        "published",
        "archived",
      ],
      secure_link_scope: ["collection", "review"],
      submission_status: ["working", "submitted"],
    },
  },
} as const
