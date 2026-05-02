
-- 1) Add RLS policies for anonymous_research_analytics
-- Aggregated, non-PII data. Allow public read (it's truly anonymous), block all client writes.
-- Writes happen only via SECURITY DEFINER function anonymize_outbound_visits().
CREATE POLICY "Anonymous analytics public read"
ON public.anonymous_research_analytics
FOR SELECT
USING (true);

-- Explicitly no INSERT/UPDATE/DELETE policies => clients cannot write directly.

-- 2) Validate weekly_earnings.amount with a CHECK constraint
ALTER TABLE public.weekly_earnings
  ADD CONSTRAINT weekly_earnings_amount_check
  CHECK (amount >= 0 AND amount <= 10000);

-- 3) Defense-in-depth: revoke column-level UPDATE on sensitive user_stats columns from authenticated role.
-- The trigger prevent_user_stats_sensitive_update remains, but this adds Postgres-level column ACL.
REVOKE UPDATE (xp, level, earnings_today, earnings_week, earnings_all_time, current_multiplier, active_streak)
  ON public.user_stats FROM authenticated, anon, public;
-- Allow updating only the non-sensitive column (updated_at handled by triggers/defaults)
GRANT UPDATE (updated_at) ON public.user_stats TO authenticated;

-- 4) Lock down anonymize_outbound_visits: only authenticated users may execute.
REVOKE EXECUTE ON FUNCTION public.anonymize_outbound_visits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.anonymize_outbound_visits() TO authenticated;
