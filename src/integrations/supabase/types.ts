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
      cars: {
        Row: {
          battery_health: number | null
          car_type: Database["public"]["Enums"]["car_type"]
          created_at: string
          current_charge_percent: number | null
          fuel_level: number | null
          health_score: number | null
          id: string
          last_oil_change_mileage: number | null
          mileage: number
          model: string
          oil_change_mileage: number | null
          plate_number: string
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          year: number
        }
        Insert: {
          battery_health?: number | null
          car_type?: Database["public"]["Enums"]["car_type"]
          created_at?: string
          current_charge_percent?: number | null
          fuel_level?: number | null
          health_score?: number | null
          id?: string
          last_oil_change_mileage?: number | null
          mileage?: number
          model: string
          oil_change_mileage?: number | null
          plate_number: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          year: number
        }
        Update: {
          battery_health?: number | null
          car_type?: Database["public"]["Enums"]["car_type"]
          created_at?: string
          current_charge_percent?: number | null
          fuel_level?: number | null
          health_score?: number | null
          id?: string
          last_oil_change_mileage?: number | null
          mileage?: number
          model?: string
          oil_change_mileage?: number | null
          plate_number?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          email: string | null
          hours_driven_today: number
          id: string
          license_uploaded: boolean
          name: string
          permit_uploaded: boolean
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          hours_driven_today?: number
          id?: string
          license_uploaded?: boolean
          name: string
          permit_uploaded?: boolean
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          hours_driven_today?: number
          id?: string
          license_uploaded?: boolean
          name?: string
          permit_uploaded?: boolean
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      energy_logs: {
        Row: {
          amount: number
          car_id: string
          cost: number
          created_at: string
          id: string
          kwh: number | null
          location: string | null
          log_type: string
          price_per_unit: number | null
        }
        Insert: {
          amount: number
          car_id: string
          cost: number
          created_at?: string
          id?: string
          kwh?: number | null
          location?: string | null
          log_type: string
          price_per_unit?: number | null
        }
        Update: {
          amount?: number
          car_id?: string
          cost?: number
          created_at?: string
          id?: string
          kwh?: number | null
          location?: string | null
          log_type?: string
          price_per_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_logs_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          amount: number
          car_id: string | null
          category: Database["public"]["Enums"]["expense_category"] | null
          created_at: string
          description: string | null
          driver_id: string | null
          entry_type: string
          id: string
          trip_id: string | null
        }
        Insert: {
          amount: number
          car_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          entry_type: string
          id?: string
          trip_id?: string | null
        }
        Update: {
          amount?: number
          car_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          entry_type?: string
          id?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          car_id: string
          cost: number
          created_at: string
          description: string | null
          id: string
          maintenance_type: string
          mileage_at_service: number | null
        }
        Insert: {
          car_id: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          maintenance_type: string
          mileage_at_service?: number | null
        }
        Update: {
          car_id?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          maintenance_type?: string
          mileage_at_service?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      preorders: {
        Row: {
          assigned_car_id: string | null
          assigned_driver_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          route_id: string | null
          scheduled_date: string
          scheduled_time: string
          status: string
        }
        Insert: {
          assigned_car_id?: string | null
          assigned_driver_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          route_id?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string
        }
        Update: {
          assigned_car_id?: string | null
          assigned_driver_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          route_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorders_assigned_car_id_fkey"
            columns: ["assigned_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorders_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          base_price: number
          created_at: string
          destination: string
          distance_km: number
          estimated_tolls: number
          id: string
          name: string
          origin: string
        }
        Insert: {
          base_price: number
          created_at?: string
          destination: string
          distance_km: number
          estimated_tolls?: number
          id?: string
          name: string
          origin: string
        }
        Update: {
          base_price?: number
          created_at?: string
          destination?: string
          distance_km?: number
          estimated_tolls?: number
          id?: string
          name?: string
          origin?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          car_id: string
          completed_at: string | null
          created_at: string
          driver_id: string | null
          id: string
          preorder_id: string | null
          route_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["trip_status"]
          total_fare: number | null
        }
        Insert: {
          car_id: string
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          preorder_id?: string | null
          route_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["trip_status"]
          total_fare?: number | null
        }
        Update: {
          car_id?: string
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          preorder_id?: string | null
          route_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["trip_status"]
          total_fare?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_preorder_id_fkey"
            columns: ["preorder_id"]
            isOneToOne: false
            referencedRelation: "preorders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver"
      car_type: "electric" | "gas"
      expense_category:
        | "fuel"
        | "charging"
        | "toll"
        | "commission"
        | "repair"
        | "maintenance"
        | "other"
      trip_status:
        | "idle"
        | "heading_to_pickup"
        | "on_highway"
        | "rest_stop"
        | "completed"
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
      app_role: ["admin", "driver"],
      car_type: ["electric", "gas"],
      expense_category: [
        "fuel",
        "charging",
        "toll",
        "commission",
        "repair",
        "maintenance",
        "other",
      ],
      trip_status: [
        "idle",
        "heading_to_pickup",
        "on_highway",
        "rest_stop",
        "completed",
      ],
    },
  },
} as const
