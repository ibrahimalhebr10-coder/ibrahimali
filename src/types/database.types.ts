export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          national_id: string | null
          total_invested: number
          total_returns: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          national_id?: string | null
          total_invested?: number
          total_returns?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          national_id?: string | null
          total_invested?: number
          total_returns?: number
          created_at?: string
          updated_at?: string
        }
      }
      farm_categories: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          icon: string
          description_ar: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          icon: string
          description_ar?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          icon?: string
          description_ar?: string | null
          active?: boolean
          created_at?: string
        }
      }
      farms: {
        Row: {
          id: string
          category_id: string | null
          name_ar: string
          name_en: string
          description_ar: string
          image_url: string
          annual_return_rate: number
          min_investment: number
          max_investment: number
          total_capacity: number
          current_invested: number
          start_date: string
          end_date: string
          status: 'active' | 'upcoming' | 'completed' | 'closed'
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name_ar: string
          name_en: string
          description_ar: string
          image_url: string
          annual_return_rate: number
          min_investment?: number
          max_investment?: number
          total_capacity: number
          current_invested?: number
          start_date: string
          end_date: string
          status?: 'active' | 'upcoming' | 'completed' | 'closed'
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name_ar?: string
          name_en?: string
          description_ar?: string
          image_url?: string
          annual_return_rate?: number
          min_investment?: number
          max_investment?: number
          total_capacity?: number
          current_invested?: number
          start_date?: string
          end_date?: string
          status?: 'active' | 'upcoming' | 'completed' | 'closed'
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          farm_id: string
          amount: number
          shares: number
          expected_return: number
          actual_return: number
          status: 'active' | 'completed' | 'cancelled'
          invested_at: string
          maturity_date: string
        }
        Insert: {
          id?: string
          user_id: string
          farm_id: string
          amount: number
          shares?: number
          expected_return: number
          actual_return?: number
          status?: 'active' | 'completed' | 'cancelled'
          invested_at?: string
          maturity_date: string
        }
        Update: {
          id?: string
          user_id?: string
          farm_id?: string
          amount?: number
          shares?: number
          expected_return?: number
          actual_return?: number
          status?: 'active' | 'completed' | 'cancelled'
          invested_at?: string
          maturity_date?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          investment_id: string | null
          type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee'
          amount: number
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          reference_number: string | null
          description_ar: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          investment_id?: string | null
          type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee'
          amount: number
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          reference_number?: string | null
          description_ar?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          investment_id?: string | null
          type?: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee'
          amount?: number
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          reference_number?: string | null
          description_ar?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      monthly_reports: {
        Row: {
          id: string
          farm_id: string
          report_month: string
          title_ar: string
          content_ar: string
          harvest_amount: number | null
          revenue: number | null
          distributed_returns: number | null
          created_at: string
        }
        Insert: {
          id?: string
          farm_id: string
          report_month: string
          title_ar: string
          content_ar: string
          harvest_amount?: number | null
          revenue?: number | null
          distributed_returns?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          farm_id?: string
          report_month?: string
          title_ar?: string
          content_ar?: string
          harvest_amount?: number | null
          revenue?: number | null
          distributed_returns?: number | null
          created_at?: string
        }
      }
      user_notifications: {
        Row: {
          id: string
          user_id: string
          title_ar: string
          message_ar: string
          type: 'investment' | 'return' | 'report' | 'system'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title_ar: string
          message_ar: string
          type: 'investment' | 'return' | 'report' | 'system'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title_ar?: string
          message_ar?: string
          type?: 'investment' | 'return' | 'report' | 'system'
          read?: boolean
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          farm_id: number
          farm_name: string
          total_trees: number
          total_price: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          farm_id: number
          farm_name: string
          total_trees: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          farm_id?: number
          farm_name?: string
          total_trees?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      reservation_items: {
        Row: {
          id: string
          reservation_id: string
          variety_name: string
          type_name: string
          quantity: number
          price_per_tree: number
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          variety_name: string
          type_name: string
          quantity: number
          price_per_tree: number
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          variety_name?: string
          type_name?: string
          quantity?: number
          price_per_tree?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type FarmWithCategory = Database['public']['Tables']['farms']['Row'] & {
  category: Database['public']['Tables']['farm_categories']['Row'] | null
}

export type InvestmentWithFarm = Database['public']['Tables']['investments']['Row'] & {
  farm: Database['public']['Tables']['farms']['Row']
}

export type UserPortfolio = {
  total_invested: number
  total_expected_return: number
  total_actual_return: number
  active_investments_count: number
  investments: InvestmentWithFarm[]
}

export type MonthlyReportWithFarm = Database['public']['Tables']['monthly_reports']['Row'] & {
  farm: Database['public']['Tables']['farms']['Row']
}

export type ReservationWithItems = Database['public']['Tables']['reservations']['Row'] & {
  items: Database['public']['Tables']['reservation_items']['Row'][]
}
