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
      admin_profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          deals: number
          id: string
          name: string
          rating: number
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          deals?: number
          id?: string
          name: string
          rating?: number
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          deals?: number
          id?: string
          name?: string
          rating?: number
          verified?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      escrow_deals: {
        Row: {
          admin_id: string
          buyer_whatsapp: string | null
          created_at: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          id: string
          listing_id: string
          price_usd: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          buyer_whatsapp?: string | null
          created_at?: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          id?: string
          listing_id: string
          price_usd: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          buyer_whatsapp?: string | null
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          id?: string
          listing_id?: string
          price_usd?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_deals_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          apps: number
          country: string
          created_at: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          id: string
          live: number
          play_url: string | null
          price_usd: number
          seller_id: string
          status: string
          suspended: number
          title: string
          updated_at: string
          verified_with_id: boolean
          whatsapp: string | null
          year: number
        }
        Insert: {
          apps?: number
          country: string
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          id?: string
          live?: number
          play_url?: string | null
          price_usd: number
          seller_id: string
          status?: string
          suspended?: number
          title?: string
          updated_at?: string
          verified_with_id?: boolean
          whatsapp?: string | null
          year: number
        }
        Update: {
          apps?: number
          country?: string
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          id?: string
          live?: number
          play_url?: string | null
          price_usd?: number
          seller_id?: string
          status?: string
          suspended?: number
          title?: string
          updated_at?: string
          verified_with_id?: boolean
          whatsapp?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id: string
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          from_ip: string | null
          id: string
          message: string | null
          target_id: string
          type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          from_ip?: string | null
          id?: string
          message?: string | null
          target_id: string
          type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          from_ip?: string | null
          id?: string
          message?: string | null
          target_id?: string
          type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: []
      }
      seller_codes: {
        Row: {
          claimed_at: string | null
          claimed_by_profile_id: string | null
          code_hash: string
          created_at: string
          id: string
          issued_to_profile_id: string | null
          revoked_at: string | null
          status: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_profile_id?: string | null
          code_hash: string
          created_at?: string
          id?: string
          issued_to_profile_id?: string | null
          revoked_at?: string | null
          status?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_profile_id?: string | null
          code_hash?: string
          created_at?: string
          id?: string
          issued_to_profile_id?: string | null
          revoked_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_codes_claimed_by_profile_id_fkey"
            columns: ["claimed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_codes_issued_to_profile_id_fkey"
            columns: ["issued_to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listing_cards: {
        Row: {
          apps: number | null
          country: string | null
          created_at: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          id: string | null
          images: Json | null
          live: number | null
          play_url: string | null
          price_usd: number | null
          seller: Json | null
          suspended: number | null
          title: string | null
          verified_with_id: boolean | null
          whatsapp: string | null
          year: number | null
        }
        Insert: {
          apps?: number | null
          country?: string | null
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          id?: string | null
          images?: never
          live?: number | null
          play_url?: string | null
          price_usd?: number | null
          seller?: never
          suspended?: number | null
          title?: string | null
          verified_with_id?: boolean | null
          whatsapp?: string | null
          year?: number | null
        }
        Update: {
          apps?: number | null
          country?: string | null
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          id?: string | null
          images?: never
          live?: number | null
          play_url?: string | null
          price_usd?: number | null
          seller?: never
          suspended?: number | null
          title?: string | null
          verified_with_id?: boolean | null
          whatsapp?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      deal_type: "instant" | "7day"
      report_target: "admin" | "listing"
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
      deal_type: ["instant", "7day"],
      report_target: ["admin", "listing"],
    },
  },
} as const
