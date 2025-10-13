-- Drop the legacy is_admin column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Recreate views WITHOUT security definer to prevent RLS bypass
DROP VIEW IF EXISTS public.admin_stats CASCADE;
DROP VIEW IF EXISTS public.category_progress CASCADE;
DROP VIEW IF EXISTS public.user_progress_summary CASCADE;
DROP VIEW IF EXISTS public.questions_for_users CASCADE;

-- Recreate admin_stats view (no SECURITY DEFINER)
CREATE VIEW public.admin_stats 
WITH (security_invoker = on)
AS
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.lessons) as total_lessons,
  (SELECT COUNT(*) FROM public.categories) as total_categories,
  (SELECT COUNT(*) FROM public.user_progress WHERE completed_at IS NOT NULL) as total_completed_lessons,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_progress WHERE completed_at > NOW() - INTERVAL '7 days') as active_users;

-- Recreate category_progress view (no SECURITY DEFINER)
CREATE VIEW public.category_progress
WITH (security_invoker = on)
AS
SELECT 
  c.id as category_id,
  c.name as category_name,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(up.id) as total_completions,
  COUNT(DISTINCT up.user_id) as unique_users_completed
FROM public.categories c
LEFT JOIN public.lessons l ON l.category_id = c.id
LEFT JOIN public.user_progress up ON up.lesson_id = l.id AND up.completed_at IS NOT NULL
GROUP BY c.id, c.name;

-- Recreate user_progress_summary view (no SECURITY DEFINER)
CREATE VIEW public.user_progress_summary
WITH (security_invoker = on)
AS
SELECT 
  p.user_id,
  p.display_name,
  p.position,
  u.created_at as user_created_at,
  COUNT(DISTINCT up.lesson_id) as total_lessons_started,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.lesson_id END) as total_lessons_completed,
  ROUND(
    (COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.lesson_id END)::numeric / 
     NULLIF(COUNT(DISTINCT up.lesson_id), 0)) * 100, 
    2
  ) as completion_percentage,
  ROUND(AVG(up.score), 2) as average_score
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
LEFT JOIN public.user_progress up ON up.user_id = p.user_id
GROUP BY p.user_id, p.display_name, p.position, u.created_at;

-- Recreate questions_for_users view (no SECURITY DEFINER, excludes correct_answer)
CREATE VIEW public.questions_for_users
WITH (security_invoker = on)
AS
SELECT 
  id,
  lesson_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  created_at
FROM public.questions;

-- Add RLS policies to views
ALTER VIEW public.admin_stats SET (security_invoker = on);
ALTER VIEW public.category_progress SET (security_invoker = on);
ALTER VIEW public.user_progress_summary SET (security_invoker = on);
ALTER VIEW public.questions_for_users SET (security_invoker = on);

-- Grant appropriate access
GRANT SELECT ON public.admin_stats TO authenticated;
GRANT SELECT ON public.category_progress TO authenticated;
GRANT SELECT ON public.user_progress_summary TO authenticated;
GRANT SELECT ON public.questions_for_users TO authenticated;