export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          icon: string
          id: string
          points: number
          progress: number
          requirements: Json
          title: string
          unlocked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty: string
          icon: string
          id?: string
          points?: number
          progress?: number
          requirements?: Json
          title: string
          unlocked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          icon?: string
          id?: string
          points?: number
          progress?: number
          requirements?: Json
          title?: string
          unlocked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      achievementsv2: {
        Row: {
          created_at: string
          id: string
          meta_achievement_id: string
          progress: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          meta_achievement_id: string
          progress?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_achievement_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievementsv2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievementv2: {
        Row: {
          created_at: string
          id: number
          meta_achievement_id: string
          progress: number | null
          userId: string
        }
        Insert: {
          created_at?: string
          id?: number
          meta_achievement_id: string
          progress?: number | null
          userId: string
        }
        Update: {
          created_at?: string
          id?: number
          meta_achievement_id?: string
          progress?: number | null
          userId?: string
        }
        Relationships: []
      }
      canvas_credentials: {
        Row: {
          created_at: string
          domain: string
          id: string
          last_sync_date: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          last_sync_date?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          last_sync_date?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_files: {
        Row: {
          id: string
          user_id: string | null
          course_id: string | null
          canvas_id: string | null
          display_name: string | null
          content_type: string | null
          size: number | null
          url: string | null
          etag: string | null
          updated_at: string | null
          status: string | null
          storage_path: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          course_id?: string | null
          canvas_id?: string | null
          display_name?: string | null
          content_type?: string | null
          size?: number | null
          url?: string | null
          etag?: string | null
          updated_at?: string | null
          status?: string | null
          storage_path?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          course_id?: string | null
          canvas_id?: string | null
          display_name?: string | null
          content_type?: string | null
          size?: number | null
          url?: string | null
          etag?: string | null
          updated_at?: string | null
          status?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          canvas_id: string | null
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          grade: number | null
          id: string
          progress: number | null
          start_date: string | null
          term: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          grade?: number | null
          id?: string
          progress?: number | null
          start_date?: string | null
          term: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          grade?: number | null
          id?: string
          progress?: number | null
          start_date?: string | null
          term?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_scores: {
        Row: {
          assignments_completed: number
          assignments_due: number
          average_course_percentage: number
          calculated_at: string
          created_at: string
          id: string
          score: number
          time_period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignments_completed?: number
          assignments_due?: number
          average_course_percentage?: number
          calculated_at?: string
          created_at?: string
          id?: string
          score?: number
          time_period: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignments_completed?: number
          assignments_due?: number
          average_course_percentage?: number
          calculated_at?: string
          created_at?: string
          id?: string
          score?: number
          time_period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      pipeline_jobs: {
        Row: {
          id: string
          user_id: string
          type: string
          status: string
          file_count: number
          processed_count: number
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          status?: string
          file_count?: number
          processed_count?: number
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          status?: string
          file_count?: number
          processed_count?: number
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          canvas_id: string | null
          completed_date: string | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          grade: number | null
          id: string
          points_possible: number | null
          progress: number | null
          status: string
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          canvas_id?: string | null
          completed_date?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade?: number | null
          id?: string
          points_possible?: number | null
          progress?: number | null
          status: string
          title: string
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          canvas_id?: string | null
          completed_date?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade?: number | null
          id?: string
          points_possible?: number | null
          progress?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          points: number
          referred_by: string | null
          plan: string | null
          subscription_status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          points?: number
          referred_by?: string | null
          plan?: string | null
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          points?: number
          referred_by?: string | null
          plan?: string | null
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      user_canvas_sync: {
        Row: {
          created_at: string
          id: string
          last_sync: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          daily_login_streak: number | null
          weekly_completion_streak: number | null
          last_login_date: string | null
          last_weekly_completion_date: string | null
          streak_start_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          daily_login_streak?: number | null
          weekly_completion_streak?: number | null
          last_login_date?: string | null
          last_weekly_completion_date?: string | null
          streak_start_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          daily_login_streak?: number | null
          weekly_completion_streak?: number | null
          last_login_date?: string | null
          last_weekly_completion_date?: string | null
          streak_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gambles: {
        Row: {
          id: string
          user_id: string
          course_id: string
          title: string
          amount: number
          multiplier: number
          milestone_id: string
          base_score: number
          resolved: boolean
          resolved_at: string | null
          won: boolean | null
          points_awarded: number | null
          actual_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          title: string
          amount: number
          multiplier: number
          milestone_id: string
          base_score: number
          resolved?: boolean
          resolved_at?: string | null
          won?: boolean | null
          points_awarded?: number | null
          actual_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          title?: string
          amount?: number
          multiplier?: number
          milestone_id?: string
          base_score?: number
          resolved?: boolean
          resolved_at?: string | null
          won?: boolean | null
          points_awarded?: number | null
          actual_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gambles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gambles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gambles_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_leaderboard_score: {
        Args: { user_id_param: string; time_period_param: string }
        Returns: number
      }
      get_last_sync: {
        Args: { user_id_param: string }
        Returns: {
          user_id: string
          last_sync: string
        }[]
      }
      get_top_leaderboard_users: {
        Args: { time_period_param: string; limit_param?: number }
        Returns: {
          user_id: string
          full_name: string
          avatar_url: string
          score: number
          rank: number
        }[]
      }
      update_last_sync: {
        Args: { user_id_param: string; sync_time_param?: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
