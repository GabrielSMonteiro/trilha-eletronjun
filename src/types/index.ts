export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  position?: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  display_name: string;
  description: string;
  created_at?: string;
}

export interface Question {
  id: string;
  lesson_id: string;
  question_text: string;
  options: string[] | unknown; 
  correct_option_index: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  external_link?: string;
  order_index: number;
  category_id?: string;
  categories?: { name: string };
  
  status?: "locked" | "available" | "completed";
  questions?: Question[];
}

export interface UserProgress {
  id?: string;
  user_id?: string;
  lesson_id: string;
  completed_at?: string;
  score?: number;
}

export interface GamificationData {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges?: Badge;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}
