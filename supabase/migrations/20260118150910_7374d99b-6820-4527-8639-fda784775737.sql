-- Fix shared_links: Create a view that hides user_id and restrict base table access
-- First, create a public view for shared_links that excludes user_id
CREATE OR REPLACE VIEW public.shared_links_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    title,
    url,
    description,
    link_type,
    created_at,
    updated_at
  FROM public.shared_links;

-- Drop the old public SELECT policy for shared_links
DROP POLICY IF EXISTS "Shared links are viewable by everyone" ON public.shared_links;

-- Create new restricted policy - only owners and admins can see full shared_links
CREATE POLICY "Users can view their own shared links"
  ON public.shared_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all shared links"
  ON public.shared_links FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: admin_stats is a VIEW, not a table, so we need to check if it has proper access controls
-- Views with security_invoker inherit RLS from underlying tables
-- However, we should also create an explicit policy pattern

-- Create a secure function to get admin stats that requires admin role
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_categories bigint,
  total_lessons bigint,
  total_users bigint,
  active_users bigint,
  total_completed_lessons bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.admin_stats;
END;
$$;