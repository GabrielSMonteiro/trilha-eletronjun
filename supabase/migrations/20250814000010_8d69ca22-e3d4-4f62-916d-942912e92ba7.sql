-- Fix Security Definer Views by recreating them without SECURITY DEFINER
-- and adding proper RLS policies instead

-- Drop existing views
DROP VIEW IF EXISTS public.admin_stats CASCADE;
DROP VIEW IF EXISTS public.user_progress_summary CASCADE;
DROP VIEW IF EXISTS public.category_progress CASCADE;

-- Recreate admin_stats view without SECURITY DEFINER
CREATE VIEW public.admin_stats AS
SELECT 
  (SELECT count(*) FROM profiles WHERE is_admin = false) AS total_users,
  (SELECT count(*) FROM lessons) AS total_lessons,
  (SELECT count(*) FROM categories) AS total_categories,
  (SELECT count(*) FROM user_progress WHERE completed_at IS NOT NULL) AS total_completed_lessons,
  (SELECT count(DISTINCT user_id) FROM user_progress WHERE completed_at IS NOT NULL) AS active_users;

-- Recreate user_progress_summary view without SECURITY DEFINER
CREATE VIEW public.user_progress_summary AS
SELECT 
  p.user_id,
  p.display_name,
  p.position,
  p.created_at AS user_created_at,
  count(up.id) AS total_lessons_started,
  count(up.completed_at) AS total_lessons_completed,
  round(COALESCE((count(up.completed_at)::numeric / NULLIF(count(up.id), 0)::numeric) * 100, 0), 2) AS completion_percentage,
  avg(up.score) AS average_score
FROM profiles p
LEFT JOIN user_progress up ON p.user_id = up.user_id
WHERE p.is_admin = false
GROUP BY p.user_id, p.display_name, p.position, p.created_at;

-- Recreate category_progress view without SECURITY DEFINER
CREATE VIEW public.category_progress AS
SELECT 
  c.id AS category_id,
  c.display_name AS category_name,
  count(l.id) AS total_lessons,
  count(up.completed_at) AS total_completions,
  count(DISTINCT up.user_id) AS unique_users_completed
FROM categories c
LEFT JOIN lessons l ON c.id = l.category_id
LEFT JOIN user_progress up ON l.id = up.lesson_id
GROUP BY c.id, c.display_name;

-- Enable RLS on the views
ALTER VIEW public.admin_stats ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.user_progress_summary ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.category_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_stats (only admins can view)
CREATE POLICY "Only admins can view admin stats" ON public.admin_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create RLS policies for user_progress_summary (admins can view all, users can view their own)
CREATE POLICY "Admins can view all user progress summary" ON public.user_progress_summary
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can view their own progress summary" ON public.user_progress_summary
FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for category_progress (everyone can view)
CREATE POLICY "Everyone can view category progress" ON public.category_progress
FOR SELECT USING (true);