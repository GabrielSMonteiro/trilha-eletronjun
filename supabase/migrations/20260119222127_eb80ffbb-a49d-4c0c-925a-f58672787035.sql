-- Fix 1: Remove public SELECT policy on user_badges table
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Everyone can view all user badges" ON public.user_badges;

-- Keep only authenticated users viewing their own badges (policy already exists: "Users can view their own badges")
-- No new policy needed as "Users can view their own badges" already provides owner-scoped access

-- Fix 2: Add RLS to leaderboard_global view
-- First, we need to recreate the view with security_invoker to respect RLS
-- Get current view definition and recreate with security_invoker

-- Drop existing view
DROP VIEW IF EXISTS public.leaderboard_global;

-- Recreate the view with security_invoker
CREATE VIEW public.leaderboard_global
WITH (security_invoker = on)
AS
SELECT 
  ug.user_id,
  p.display_name,
  p.avatar_url,
  ug.total_xp,
  ug.current_level,
  ug.total_points,
  ug.current_streak,
  ug.longest_streak,
  (SELECT COUNT(*) FROM public.user_progress up WHERE up.user_id = ug.user_id AND up.completed_at IS NOT NULL) as lessons_completed,
  (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = ug.user_id) as badges_earned,
  ROW_NUMBER() OVER (ORDER BY ug.total_xp DESC) as rank
FROM public.user_gamification ug
LEFT JOIN public.profiles p ON p.user_id = ug.user_id;

-- Grant select to authenticated users only
GRANT SELECT ON public.leaderboard_global TO authenticated;
REVOKE SELECT ON public.leaderboard_global FROM anon;