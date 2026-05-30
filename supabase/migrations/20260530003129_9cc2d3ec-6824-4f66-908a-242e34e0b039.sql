REVOKE EXECUTE ON FUNCTION public.prevent_tier_progress_multiplier_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_user_stats_sensitive_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_user_stats_sensitive_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_milestone_user_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_weekly_earnings_user_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.anonymize_outbound_visits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.anonymize_outbound_visits() TO authenticated;