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
      articles: {
        Row: {
          created_at: string
          dual_use_warning: boolean
          earnings: number
          id: string
          is_daily_desk: boolean
          read_time: string | null
          source: string
          tier_id: number
          title: string
          url: string | null
          warning_text: string | null
        }
        Insert: {
          created_at?: string
          dual_use_warning?: boolean
          earnings?: number
          id?: string
          is_daily_desk?: boolean
          read_time?: string | null
          source: string
          tier_id: number
          title: string
          url?: string | null
          warning_text?: string | null
        }
        Update: {
          created_at?: string
          dual_use_warning?: boolean
          earnings?: number
          id?: string
          is_daily_desk?: boolean
          read_time?: string | null
          source?: string
          tier_id?: number
          title?: string
          url?: string | null
          warning_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          earned: number
          id: string
          occurred_at: string
          tier_id: number | null
          title: string
          user_id: string
          xp_gained: number
        }
        Insert: {
          earned?: number
          id?: string
          occurred_at?: string
          tier_id?: number | null
          title: string
          user_id: string
          xp_gained?: number
        }
        Update: {
          earned?: number
          id?: string
          occurred_at?: string
          tier_id?: number | null
          title?: string
          user_id?: string
          xp_gained?: number
        }
        Relationships: [
          {
            foreignKeyName: "milestones_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          cpa_payout: number
          created_at: string
          discount: number
          id: string
          merchant: string
          original_price: number
          sale_price: number
          tier_id: number
          title: string
        }
        Insert: {
          cpa_payout?: number
          created_at?: string
          discount?: number
          id?: string
          merchant: string
          original_price: number
          sale_price: number
          tier_id: number
          title: string
        }
        Update: {
          cpa_payout?: number
          created_at?: string
          discount?: number
          id?: string
          merchant?: string
          original_price?: number
          sale_price?: number
          tier_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          bid_amount: number
          company: string
          ctr: string | null
          id: string
          impressions: string | null
          rating: number
          tier_id: number
        }
        Insert: {
          bid_amount: number
          company: string
          ctr?: string | null
          id?: string
          impressions?: string | null
          rating?: number
          tier_id: number
        }
        Update: {
          bid_amount?: number
          company?: string
          ctr?: string | null
          id?: string
          impressions?: string | null
          rating?: number
          tier_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          avg_earning: number
          color: string
          display_order: number
          icon: string
          id: number
          locked: boolean
          multiplier: number
          name: string
          researchers: number
          subcategories: string[]
        }
        Insert: {
          avg_earning?: number
          color: string
          display_order?: number
          icon: string
          id: number
          locked?: boolean
          multiplier: number
          name: string
          researchers?: number
          subcategories?: string[]
        }
        Update: {
          avg_earning?: number
          color?: string
          display_order?: number
          icon?: string
          id?: number
          locked?: boolean
          multiplier?: number
          name?: string
          researchers?: number
          subcategories?: string[]
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
      user_stats: {
        Row: {
          active_streak: number
          current_multiplier: number
          earnings_all_time: number
          earnings_today: number
          earnings_week: number
          level: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          active_streak?: number
          current_multiplier?: number
          earnings_all_time?: number
          earnings_today?: number
          earnings_week?: number
          level?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          active_streak?: number
          current_multiplier?: number
          earnings_all_time?: number
          earnings_today?: number
          earnings_week?: number
          level?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      weekly_earnings: {
        Row: {
          amount: number
          day: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          day: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          day?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
