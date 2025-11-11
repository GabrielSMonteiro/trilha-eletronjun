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
      badges: {
        Row: {
          badge_type: string
          category_id: string | null
          created_at: string
          description: string
          icon_name: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          badge_type: string
          category_id?: string | null
          created_at?: string
          description: string
          icon_name: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          badge_type?: string
          category_id?: string | null
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "badges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_analytics"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "badges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_progress"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "badges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_by_category"
            referencedColumns: ["category_id"]
          },
        ]
      }
      cafe_presets: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          preset_config: Json
          preset_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          preset_config: Json
          preset_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          preset_config?: Json
          preset_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cafe_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          points_earned: number | null
          preset_used: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          points_earned?: number | null
          preset_used?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          points_earned?: number | null
          preset_used?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      kanban_tasks: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lessons: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          external_link: string | null
          id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          external_link?: string | null
          id?: string
          order_index: number
          title: string
          video_url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          external_link?: string | null
          id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_analytics"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_progress"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_by_category"
            referencedColumns: ["category_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string
          id: string
          lesson_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          id?: string
          lesson_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          id?: string
          lesson_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          link_type: string
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          link_type: string
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          link_type?: string
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          category_id: string | null
          completed: boolean
          created_at: string
          duration_minutes: number
          ended_at: string | null
          id: string
          lesson_id: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_analytics"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "study_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_progress"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "study_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_by_category"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      todo_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_points: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_points?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_points?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          lesson_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lesson_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lesson_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_stats: {
        Row: {
          active_users: number | null
          total_categories: number | null
          total_completed_lessons: number | null
          total_lessons: number | null
          total_users: number | null
        }
        Relationships: []
      }
      category_analytics: {
        Row: {
          avg_score: number | null
          category_id: string | null
          category_name: string | null
          total_completions: number | null
          total_lessons: number | null
          total_study_minutes: number | null
          unique_students: number | null
        }
        Relationships: []
      }
      category_progress: {
        Row: {
          category_id: string | null
          category_name: string | null
          total_completions: number | null
          total_lessons: number | null
          unique_users_completed: number | null
        }
        Relationships: []
      }
      leaderboard_by_category: {
        Row: {
          avatar_url: string | null
          category_id: string | null
          category_name: string | null
          current_level: number | null
          display_name: string | null
          lessons_completed: number | null
          rank: number | null
          total_points: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      leaderboard_global: {
        Row: {
          avatar_url: string | null
          badges_earned: number | null
          current_level: number | null
          current_streak: number | null
          display_name: string | null
          lessons_completed: number | null
          longest_streak: number | null
          rank: number | null
          total_points: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      questions_for_users: {
        Row: {
          created_at: string | null
          id: string | null
          lesson_id: string | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          lesson_id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          lesson_id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          avg_score: number | null
          current_level: number | null
          current_streak: number | null
          display_name: string | null
          lessons_completed: number | null
          total_sessions: number | null
          total_study_minutes: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_progress_summary: {
        Row: {
          average_score: number | null
          completion_percentage: number | null
          display_name: string | null
          position: string | null
          total_lessons_completed: number | null
          total_lessons_started: number | null
          user_created_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      admin_create_user: {
        Args: {
          admin_user_id: string
          new_display_name: string
          new_email: string
          new_password: string
          new_position?: string
        }
        Returns: Json
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      xp_for_next_level: { Args: { current_level: number }; Returns: number }
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
