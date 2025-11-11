-- Fix security issues with views by recreating them with security_invoker = true

-- Drop existing views
DROP VIEW IF EXISTS public.user_analytics;
DROP VIEW IF EXISTS public.category_analytics;

-- Recreate user_analytics view with security_invoker
CREATE VIEW public.user_analytics
WITH (security_invoker = true)
AS
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

-- Recreate category_analytics view with security_invoker
CREATE VIEW public.category_analytics
WITH (security_invoker = true)
AS
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