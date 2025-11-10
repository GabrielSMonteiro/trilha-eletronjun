-- Drop existing views
DROP VIEW IF EXISTS public.leaderboard_by_category;
DROP VIEW IF EXISTS public.leaderboard_global;

-- Recreate views without security definer (they will use invoker security by default)
CREATE VIEW public.leaderboard_by_category 
WITH (security_invoker = true) AS
SELECT 
  ug.user_id,
  p.display_name,
  p.avatar_url,
  ug.total_xp,
  ug.current_level,
  ug.total_points,
  c.id as category_id,
  c.name as category_name,
  COUNT(DISTINCT up.lesson_id) as lessons_completed,
  RANK() OVER (PARTITION BY c.id ORDER BY ug.total_xp DESC) as rank
FROM public.user_gamification ug
JOIN public.profiles p ON p.user_id = ug.user_id
CROSS JOIN public.categories c
LEFT JOIN public.user_progress up ON up.user_id = ug.user_id 
  AND up.completed_at IS NOT NULL
LEFT JOIN public.lessons l ON l.id = up.lesson_id AND l.category_id = c.id
GROUP BY ug.user_id, p.display_name, p.avatar_url, ug.total_xp, ug.current_level, ug.total_points, c.id, c.name;

CREATE VIEW public.leaderboard_global 
WITH (security_invoker = true) AS
SELECT 
  ug.user_id,
  p.display_name,
  p.avatar_url,
  ug.total_xp,
  ug.current_level,
  ug.total_points,
  ug.current_streak,
  ug.longest_streak,
  COUNT(DISTINCT up.lesson_id) as lessons_completed,
  COUNT(DISTINCT ub.badge_id) as badges_earned,
  RANK() OVER (ORDER BY ug.total_xp DESC) as rank
FROM public.user_gamification ug
JOIN public.profiles p ON p.user_id = ug.user_id
LEFT JOIN public.user_progress up ON up.user_id = ug.user_id AND up.completed_at IS NOT NULL
LEFT JOIN public.user_badges ub ON ub.user_id = ug.user_id
GROUP BY ug.user_id, p.display_name, p.avatar_url, ug.total_xp, ug.current_level, ug.total_points, ug.current_streak, ug.longest_streak;

-- Update functions to have proper search_path
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.xp_for_next_level(current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN POWER(current_level, 2) * 100;
END;
$$;