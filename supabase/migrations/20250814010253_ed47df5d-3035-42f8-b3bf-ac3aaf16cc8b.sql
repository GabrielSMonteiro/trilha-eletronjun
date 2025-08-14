-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Drop the problematic function 
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;

-- Create simple policies without any circular references
CREATE POLICY "Everyone can view profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Simple admin check using email directly from JWT
CREATE POLICY "Admin email access" ON public.profiles
FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@eletronjun.com.br'
);