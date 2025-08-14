-- Fix infinite recursion by dropping everything with CASCADE and recreating properly

-- Drop the problematic function and all dependent policies
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;

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