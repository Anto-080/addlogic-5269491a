-- 1) Restrict sponsors table access: only admins may read full row (incl. bid_amount, impressions, ctr).
--    Public read is replaced with a safe view exposing only non-sensitive columns.
DROP POLICY IF EXISTS "Sponsors public read" ON public.sponsors;

CREATE POLICY "Admins read sponsors"
ON public.sponsors
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.sponsors_public
WITH (security_invoker = true) AS
SELECT id, company, tier_id, rating
FROM public.sponsors;

GRANT SELECT ON public.sponsors_public TO anon, authenticated;

-- 2) Restrict user_stats UPDATE so users can NOT self-edit earnings/xp/level/multiplier.
--    Replace permissive UPDATE policy with a column-restricted one via trigger guard.
DROP POLICY IF EXISTS "Users update own stats" ON public.user_stats;

CREATE OR REPLACE FUNCTION public.prevent_user_stats_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.xp IS DISTINCT FROM OLD.xp
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.earnings_today IS DISTINCT FROM OLD.earnings_today
     OR NEW.earnings_week IS DISTINCT FROM OLD.earnings_week
     OR NEW.earnings_all_time IS DISTINCT FROM OLD.earnings_all_time
     OR NEW.current_multiplier IS DISTINCT FROM OLD.current_multiplier
     OR NEW.active_streak IS DISTINCT FROM OLD.active_streak
  THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Sensitive stat columns can only be modified by admins or server-side functions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_stats_guard_sensitive_update
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_stats_sensitive_update();

CREATE POLICY "Users update own stats"
ON public.user_stats
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);