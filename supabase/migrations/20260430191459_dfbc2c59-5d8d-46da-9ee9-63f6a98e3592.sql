
-- 1. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Revoke EXECUTE on SECURITY DEFINER functions from anon & public.
-- handle_new_user and prevent_user_stats_sensitive_update are trigger functions
-- (triggers run regardless of EXECUTE grants), so we can safely revoke from API roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_user_stats_sensitive_update() FROM anon, authenticated, public;

-- has_role is used inside RLS policies; SECURITY DEFINER means it runs as owner,
-- but we still revoke direct API EXECUTE from anon (RLS-internal calls are unaffected).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
-- Keep authenticated able to call it (used by client-side admin checks)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
