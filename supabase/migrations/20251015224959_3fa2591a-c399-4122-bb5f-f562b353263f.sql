-- Fix 1: Server-side email domain validation
-- Create a trigger function to validate email domain on user signup
CREATE OR REPLACE FUNCTION public.validate_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow @eletronjun.com.br emails
  IF NEW.email NOT LIKE '%@eletronjun.com.br' THEN
    RAISE EXCEPTION 'Only @eletronjun.com.br emails are allowed for registration';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users table to validate email domain
DROP TRIGGER IF EXISTS check_email_domain ON auth.users;
CREATE TRIGGER check_email_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email_domain();

-- Fix 2: Add RLS policies to database views
-- Note: PostgreSQL views don't support RLS policies directly, but we can control access
-- by setting security_invoker to true, which makes views inherit the caller's permissions

-- Set security_invoker for all views
ALTER VIEW public.questions_for_users SET (security_invoker = true);
ALTER VIEW public.admin_stats SET (security_invoker = true);
ALTER VIEW public.user_progress_summary SET (security_invoker = true);
ALTER VIEW public.category_progress SET (security_invoker = true);

-- Add comments to document the security model
COMMENT ON VIEW public.questions_for_users IS 'Public view - questions without answers, safe for all authenticated users';
COMMENT ON VIEW public.admin_stats IS 'Admin view - aggregated statistics, caller permissions inherited';
COMMENT ON VIEW public.user_progress_summary IS 'Admin view - user progress with PII, caller permissions inherited';
COMMENT ON VIEW public.category_progress IS 'Admin view - category statistics, caller permissions inherited';