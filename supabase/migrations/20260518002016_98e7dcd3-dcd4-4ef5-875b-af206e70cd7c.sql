REVOKE EXECUTE ON FUNCTION public.prevent_user_stats_sensitive_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_milestone_user_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_weekly_earnings_user_write() FROM PUBLIC, anon, authenticated;