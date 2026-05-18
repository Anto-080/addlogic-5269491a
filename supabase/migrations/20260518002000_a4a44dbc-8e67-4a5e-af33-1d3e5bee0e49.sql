DROP TRIGGER IF EXISTS user_stats_prevent_sensitive_update ON public.user_stats;
CREATE TRIGGER user_stats_prevent_sensitive_update
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_stats_sensitive_update();

DROP TRIGGER IF EXISTS milestones_prevent_user_write ON public.milestones;
CREATE TRIGGER milestones_prevent_user_write
BEFORE INSERT OR UPDATE OR DELETE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.prevent_milestone_user_write();

DROP TRIGGER IF EXISTS weekly_earnings_prevent_user_write ON public.weekly_earnings;
CREATE TRIGGER weekly_earnings_prevent_user_write
BEFORE INSERT OR UPDATE OR DELETE ON public.weekly_earnings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_weekly_earnings_user_write();