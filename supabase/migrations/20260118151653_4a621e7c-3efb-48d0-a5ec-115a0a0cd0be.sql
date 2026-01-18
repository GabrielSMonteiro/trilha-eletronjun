-- Fix analytics views security by creating secure replacements with RLS

-- Drop old views and recreate with proper security
DROP VIEW IF EXISTS public.user_analytics;
DROP VIEW IF EXISTS public.category_analytics;
DROP VIEW IF EXISTS public.admin_stats;

-- Create secure user_analytics view with RLS enforcement
-- Users can only see their own data, admins can see all
CREATE VIEW public.user_analytics
WITH (security_invoker = on)
AS
SELECT 
  p.user_id,
  p.display_name,
  COALESCE(progress_data.lessons_completed, 0) AS lessons_completed,
  COALESCE(session_data.total_study_minutes, 0) AS total_study_minutes,
  COALESCE(progress_data.avg_score, 0) AS avg_score,
  COALESCE(session_data.total_sessions, 0) AS total_sessions,
  COALESCE(g.current_streak, 0) AS current_streak,
  COALESCE(g.current_level, 1) AS current_level,
  COALESCE(g.total_xp, 0) AS total_xp
FROM profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS lessons_completed,
    ROUND(AVG(score) FILTER (WHERE completed_at IS NOT NULL), 1) AS avg_score
  FROM user_progress
  GROUP BY user_id
) progress_data ON p.user_id = progress_data.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COALESCE(SUM(duration_minutes), 0) AS total_study_minutes,
    COUNT(*) AS total_sessions
  FROM study_sessions
  GROUP BY user_id
) session_data ON p.user_id = session_data.user_id
LEFT JOIN user_gamification g ON p.user_id = g.user_id
WHERE p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role);

-- Create secure category_analytics view (aggregated data only, accessible to admins)
CREATE VIEW public.category_analytics
WITH (security_invoker = on)
AS
SELECT 
  c.id AS category_id,
  c.display_name AS category_name,
  COUNT(DISTINCT l.id) AS total_lessons,
  COUNT(DISTINCT up.id) FILTER (WHERE up.completed_at IS NOT NULL) AS total_completions,
  COUNT(DISTINCT up.user_id) FILTER (WHERE up.completed_at IS NOT NULL) AS unique_students,
  ROUND(AVG(up.score) FILTER (WHERE up.completed_at IS NOT NULL), 1) AS avg_score,
  COALESCE(SUM(ss.duration_minutes), 0) AS total_study_minutes
FROM categories c
LEFT JOIN lessons l ON l.category_id = c.id
LEFT JOIN user_progress up ON up.lesson_id = l.id
LEFT JOIN study_sessions ss ON ss.category_id = c.id
WHERE has_role(auth.uid(), 'admin'::app_role)
GROUP BY c.id, c.display_name;

-- Create secure admin_stats view (admin only)
CREATE VIEW public.admin_stats
WITH (security_invoker = on)
AS
SELECT 
  (SELECT COUNT(*) FROM categories) AS total_categories,
  (SELECT COUNT(*) FROM lessons) AS total_lessons,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(DISTINCT user_id) FROM user_progress WHERE created_at > NOW() - INTERVAL '30 days') AS active_users,
  (SELECT COUNT(*) FROM user_progress WHERE completed_at IS NOT NULL) AS total_completed_lessons
WHERE has_role(auth.uid(), 'admin'::app_role);