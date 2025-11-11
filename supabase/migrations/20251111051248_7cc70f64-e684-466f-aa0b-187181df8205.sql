-- Create analytics tables for dashboard
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all study sessions"
  ON public.study_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create view for user analytics
CREATE OR REPLACE VIEW public.user_analytics AS
SELECT 
  u.id as user_id,
  p.display_name,
  COUNT(DISTINCT up.lesson_id) as lessons_completed,
  COALESCE(SUM(ss.duration_minutes), 0) as total_study_minutes,
  ROUND(AVG(up.score), 2) as avg_score,
  COUNT(DISTINCT ss.id) as total_sessions,
  ug.current_streak,
  ug.current_level,
  ug.total_xp
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_progress up ON u.id = up.user_id AND up.completed_at IS NOT NULL
LEFT JOIN public.study_sessions ss ON u.id = ss.user_id AND ss.completed = true
LEFT JOIN public.user_gamification ug ON u.id = ug.user_id
GROUP BY u.id, p.display_name, ug.current_streak, ug.current_level, ug.total_xp;

-- Create view for category analytics
CREATE OR REPLACE VIEW public.category_analytics AS
SELECT 
  c.id as category_id,
  c.display_name as category_name,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT up.user_id) as unique_students,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.id END) as total_completions,
  ROUND(AVG(CASE WHEN up.score IS NOT NULL THEN up.score END), 2) as avg_score,
  COALESCE(SUM(ss.duration_minutes), 0) as total_study_minutes
FROM public.categories c
LEFT JOIN public.lessons l ON c.id = l.category_id
LEFT JOIN public.user_progress up ON l.id = up.lesson_id
LEFT JOIN public.study_sessions ss ON c.id = ss.category_id AND ss.completed = true
GROUP BY c.id, c.display_name;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_lesson_id ON public.study_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_category_id ON public.study_sessions(category_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON public.study_sessions(created_at);