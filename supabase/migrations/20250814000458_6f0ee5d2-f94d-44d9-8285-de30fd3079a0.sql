-- Fix infinite recursion in profiles policies by replacing conflicting policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create new non-recursive policies for profiles table
-- Allow users to view all profiles (for ranking and user display)
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can do everything (using a simpler check)
CREATE POLICY "Admin full access" ON public.profiles
FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);