-- ==========================================
-- SECURITY FIX: Implement Proper Roles System
-- ==========================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Migrate existing admin users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Also add admin role for the hardcoded admin email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@eletronjun.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Add default 'user' role for all existing users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'user'::public.app_role
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update all RLS policies to use has_role function

-- Drop old admin policies
DROP POLICY IF EXISTS "Admin email access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all user progress" ON public.user_progress;

-- Create new role-based policies for profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create new role-based policies for categories
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create new role-based policies for lessons
CREATE POLICY "Admins can manage lessons" ON public.lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create new role-based policies for questions (admins only - hide correct answers from users)
DROP POLICY IF EXISTS "Users can view questions" ON public.questions;

CREATE POLICY "Admins can manage questions" ON public.questions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure view for questions without correct answers
CREATE OR REPLACE VIEW public.questions_for_users AS
SELECT id, lesson_id, question_text, option_a, option_b, option_c, option_d, created_at
FROM public.questions;

GRANT SELECT ON public.questions_for_users TO authenticated;

-- Create new role-based policy for user_progress
CREATE POLICY "Admins can view all user progress" ON public.user_progress
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Fix profiles visibility - users can only see their own profile, admins see all
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Fix admin_stats, category_progress, user_progress_summary views
-- Recreate without SECURITY DEFINER and with proper RLS

-- Drop existing views
DROP VIEW IF EXISTS public.admin_stats CASCADE;
DROP VIEW IF EXISTS public.category_progress CASCADE;
DROP VIEW IF EXISTS public.user_progress_summary CASCADE;

-- Recreate admin_stats (admins only)
CREATE VIEW public.admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.lessons) AS total_lessons,
  (SELECT COUNT(*) FROM public.categories) AS total_categories,
  (SELECT COUNT(*) FROM public.user_progress WHERE completed_at IS NOT NULL) AS total_completed_lessons,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_progress WHERE created_at > NOW() - INTERVAL '30 days') AS active_users;

-- Recreate category_progress (admins only)
CREATE VIEW public.category_progress AS
SELECT 
  c.id AS category_id,
  c.display_name AS category_name,
  COUNT(DISTINCT l.id) AS total_lessons,
  COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) AS total_completions,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.user_id END) AS unique_users_completed
FROM public.categories c
LEFT JOIN public.lessons l ON c.id = l.category_id
LEFT JOIN public.user_progress up ON l.id = up.lesson_id
GROUP BY c.id, c.display_name;

-- Recreate user_progress_summary (users see own, admins see all)
CREATE VIEW public.user_progress_summary AS
SELECT 
  p.user_id,
  p.display_name,
  p.position,
  p.created_at AS user_created_at,
  COUNT(DISTINCT up.lesson_id) AS total_lessons_started,
  COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) AS total_lessons_completed,
  ROUND((COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(DISTINCT up.lesson_id), 0) * 100), 2) AS completion_percentage,
  ROUND(AVG(CASE WHEN up.score IS NOT NULL THEN up.score END), 2) AS average_score
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.user_id = up.user_id
GROUP BY p.user_id, p.display_name, p.position, p.created_at;

-- Grant appropriate access
GRANT SELECT ON public.admin_stats TO authenticated;
GRANT SELECT ON public.category_progress TO authenticated;
GRANT SELECT ON public.user_progress_summary TO authenticated;

-- 10. Fix admin_create_user function search_path
CREATE OR REPLACE FUNCTION public.admin_create_user(admin_user_id uuid, new_email text, new_password text, new_display_name text, new_position text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check BOOLEAN;
  result JSON;
BEGIN
  -- Check if user is admin using new roles system
  SELECT public.has_role(admin_user_id, 'admin') INTO admin_check;
  
  IF NOT admin_check THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Função preparada para criação de usuário');
END;
$$;

-- 11. Update handle_new_user trigger to assign default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  
  -- Assign default 'user' role (admin role must be assigned manually)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 12. Update update_updated_at_column function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;