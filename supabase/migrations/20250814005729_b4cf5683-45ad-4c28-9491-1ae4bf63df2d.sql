-- Fix infinite recursion by using a different approach for admin check
-- Drop the problematic function and create a new one that doesn't reference profiles table

DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create simple policies without circular references
CREATE POLICY "Everyone can view profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- For admin functionality, use a simple email check directly
CREATE POLICY "Admin email can do everything" ON public.profiles
FOR ALL USING (
  (SELECT auth.jwt() ->> 'email') = 'admin@eletronjun.com.br'
);