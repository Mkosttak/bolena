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
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_name: string
          content_en: string | null
          content_tr: string
          cover_image_url: string | null
          created_at: string
          excerpt_en: string | null
          excerpt_tr: string | null
          focus_keywords: string[]
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          slug: string
          tags: string[]
          title_en: string | null
          title_tr: string
          updated_at: string
        }
        Insert: {
          author_name: string
          content_en?: string | null
          content_tr?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_tr?: string | null
          focus_keywords?: string[]
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          tags?: string[]
          title_en?: string | null
          title_tr: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content_en?: string | null
          content_tr?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_tr?: string | null
          focus_keywords?: string[]
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug?: string
          tags?: string[]
          title_en?: string | null
          title_tr?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_tr: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_tr: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_tr?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      extra_groups: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          max_bir_secim: boolean
          name_en: string
          name_tr: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_bir_secim?: boolean
          name_en: string
          name_tr: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_bir_secim?: boolean
          name_en?: string
          name_tr?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_options: {
        Row: {
          group_id: string
          id: string
          is_active: boolean
          max_selections: number
          name_en: string
          name_tr: string
          price: number
          sort_order: number
        }
        Insert: {
          group_id: string
          id?: string
          is_active?: boolean
          max_selections?: number
          name_en: string
          name_tr: string
          price?: number
          sort_order?: number
        }
        Update: {
          group_id?: string
          id?: string
          is_active?: boolean
          max_selections?: number
          name_en?: string
          name_tr?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "extra_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "extra_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_campaigns: {
        Row: {
          active_days: number[]
          applies_to_category_ids: string[] | null
          applies_to_product_ids: string[] | null
          created_at: string
          description_en: string | null
          description_tr: string | null
          discount_percent: number
          end_date: string
          end_time: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          name_en: string
          name_tr: string
          notes: string | null
          price_basis: string
          priority: number
          start_date: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          active_days?: number[]
          applies_to_category_ids?: string[] | null
          applies_to_product_ids?: string[] | null
          created_at?: string
          description_en?: string | null
          description_tr?: string | null
          discount_percent: number
          end_date: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          name_en: string
          name_tr: string
          notes?: string | null
          price_basis?: string
          priority?: number
          start_date: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          active_days?: number[]
          applies_to_category_ids?: string[] | null
          applies_to_product_ids?: string[] | null
          created_at?: string
          description_en?: string | null
          description_tr?: string | null
          discount_percent?: number
          end_date?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          name_en?: string
          name_tr?: string
          notes?: string | null
          price_basis?: string
          priority?: number
          start_date?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      module_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          module_name: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_name: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          is_complimentary: boolean
          kds_status: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name_en: string
          product_name_tr: string
          quantity: number
          removed_ingredients: Json | null
          selected_extras: Json | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_complimentary?: boolean
          kds_status?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name_en: string
          product_name_tr: string
          quantity?: number
          removed_ingredients?: Json | null
          selected_extras?: Json | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          is_complimentary?: boolean
          kds_status?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name_en?: string
          product_name_tr?: string
          quantity?: number
          removed_ingredients?: Json | null
          selected_extras?: Json | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          discount_type: string | null
          id: string
          notes: string | null
          payment_status: string
          platform: string | null
          session_token: string | null
          status: string
          subtotal: number
          table_id: string | null
          total_amount: number
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_type?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          platform?: string | null
          session_token?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          total_amount?: number
          type: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_type?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          platform?: string | null
          session_token?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          total_amount?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          note: string | null
          order_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          note?: string | null
          order_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          id: string
          is_removable: boolean
          name_en: string
          name_tr: string
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_removable?: boolean
          name_en: string
          name_tr: string
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_removable?: boolean
          name_en?: string
          name_tr?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens_en: string | null
          allergens_tr: string | null
          campaign_end_date: string | null
          campaign_price: number | null
          category_id: string
          created_at: string
          description_en: string | null
          description_tr: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          is_visible: boolean
          name_en: string
          name_tr: string
          price: number
          sort_order: number
          stock_count: number | null
          track_stock: boolean
          updated_at: string
        }
        Insert: {
          allergens_en?: string | null
          allergens_tr?: string | null
          campaign_end_date?: string | null
          campaign_price?: number | null
          category_id: string
          created_at?: string
          description_en?: string | null
          description_tr?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          is_visible?: boolean
          name_en: string
          name_tr: string
          price: number
          sort_order?: number
          stock_count?: number | null
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          allergens_en?: string | null
          allergens_tr?: string | null
          campaign_end_date?: string | null
          campaign_price?: number | null
          category_id?: string
          created_at?: string
          description_en?: string | null
          description_tr?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          is_visible?: boolean
          name_en?: string
          name_tr?: string
          price?: number
          sort_order?: number
          stock_count?: number | null
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          order_id: string | null
          party_size: number | null
          reservation_date: string | null
          reservation_time: string | null
          status: string
          table_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          order_id?: string | null
          party_size?: number | null
          reservation_date?: string | null
          reservation_time?: string | null
          status?: string
          table_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          party_size?: number | null
          reservation_date?: string | null
          reservation_time?: string | null
          status?: string
          table_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      table_categories: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tables: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          qr_enabled: boolean
          qr_token: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          qr_enabled?: boolean
          qr_token?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          qr_enabled?: boolean
          qr_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "table_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          close_time: string | null
          day_of_week: number
          id: string
          is_open: boolean
          note_en: string | null
          note_tr: string | null
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean
          note_en?: string | null
          note_tr?: string | null
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean
          note_en?: string | null
          note_tr?: string | null
          open_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      working_hours_exceptions: {
        Row: {
          close_time: string | null
          created_at: string
          date: string
          description_en: string | null
          description_tr: string | null
          id: string
          is_open: boolean
          open_time: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          date: string
          description_en?: string | null
          description_tr?: string | null
          id?: string
          is_open: boolean
          open_time?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string
          date?: string
          description_en?: string | null
          description_tr?: string | null
          id?: string
          is_open?: boolean
          open_time?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_order_item_atomic: {
        Args: {
          p_notes: string
          p_order_id: string
          p_product_id: string
          p_product_name_en: string
          p_product_name_tr: string
          p_quantity: number
          p_removed_ingredients: Json
          p_selected_extras: Json
          p_total_price: number
          p_track_stock: boolean
          p_unit_price: number
        }
        Returns: undefined
      }
      add_order_item_via_qr:
        | {
            Args: {
              p_notes: string
              p_order_id: string
              p_product_id: string
              p_product_name_en: string
              p_product_name_tr: string
              p_qr_token: string
              p_quantity: number
              p_removed_ingredients: Json
              p_selected_extras: Json
              p_total_price: number
              p_track_stock: boolean
              p_unit_price: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_notes: string
              p_order_id: string
              p_product_id: string
              p_product_name_en: string
              p_product_name_tr: string
              p_qr_token: string
              p_quantity: number
              p_removed_ingredients: Json
              p_selected_extras: Json
              p_session_token: string
              p_total_price: number
              p_track_stock: boolean
              p_unit_price: number
            }
            Returns: undefined
          }
      create_reservation_with_order_atomic: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_notes: string
          p_party_size: number
          p_reservation_date: string
          p_reservation_time: string
          p_type: string
        }
        Returns: {
          order_id: string
          reservation_id: string
        }[]
      }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      get_my_role: { Args: never; Returns: string }
      get_or_create_session_for_table: {
        Args: { p_qr_token: string }
        Returns: {
          order_id: string
          session_token: string
        }[]
      }
      get_or_create_table_order_atomic: {
        Args: { p_table_id: string }
        Returns: string
      }
      get_or_create_table_order_by_qr: {
        Args: { p_qr_token: string }
        Returns: string
      }
      get_order_by_session_token: {
        Args: { p_session_token: string }
        Returns: {
          order_id: string
          order_status: string
          qr_enabled: boolean
          qr_token: string
          table_id: string
          table_name: string
        }[]
      }
      get_table_by_qr_token: {
        Args: { p_qr_token: string }
        Returns: {
          id: string
          name: string
          qr_enabled: boolean
        }[]
      }
      increment_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      is_valid_qr_token: { Args: { p_token: string }; Returns: boolean }
      recalculate_order_totals: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      regenerate_qr_token: { Args: { p_table_id: string }; Returns: string }
      remove_order_item_atomic: {
        Args: { p_item_id: string; p_order_id: string }
        Returns: undefined
      }
      transfer_table_order_atomic: {
        Args: { p_source_table_id: string; p_target_table_id: string }
        Returns: undefined
      }
      update_order_item_atomic: {
        Args: {
          p_item_id: string
          p_notes: string
          p_order_id: string
          p_product_id: string
          p_quantity: number
          p_removed_ingredients: Json
          p_selected_extras: Json
          p_total_price: number
          p_track_stock: boolean
        }
        Returns: undefined
      }
      update_order_item_quantity_atomic: {
        Args: {
          p_item_id: string
          p_new_quantity: number
          p_order_id: string
          p_product_id: string
          p_track_stock: boolean
        }
        Returns: undefined
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
