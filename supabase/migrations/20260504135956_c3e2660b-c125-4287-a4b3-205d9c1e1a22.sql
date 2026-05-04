-- =========================================
-- MILESTONES: lock down client writes
-- =========================================
DROP POLICY IF EXISTS "Users insert own milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users delete own milestones" ON public.milestones;

-- Admin-only writes (server-side / service role bypasses RLS regardless)
CREATE POLICY "Admins insert milestones"
  ON public.milestones
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete milestones"
  ON public.milestones
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Defense-in-depth trigger: block non-admin writes of financial fields
CREATE OR REPLACE FUNCTION public.prevent_milestone_user_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Milestones can only be written by admins or server-side functions';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_milestone_user_write_trg ON public.milestones;
CREATE TRIGGER prevent_milestone_user_write_trg
  BEFORE INSERT OR UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_milestone_user_write();

-- =========================================
-- WEEKLY_EARNINGS: lock down client writes
-- =========================================
DROP POLICY IF EXISTS "Users insert own weekly" ON public.weekly_earnings;
DROP POLICY IF EXISTS "Users update own weekly" ON public.weekly_earnings;

CREATE POLICY "Admins insert weekly"
  ON public.weekly_earnings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update weekly"
  ON public.weekly_earnings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.prevent_weekly_earnings_user_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'weekly_earnings can only be written by admins or server-side functions';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_weekly_earnings_user_write_trg ON public.weekly_earnings;
CREATE TRIGGER prevent_weekly_earnings_user_write_trg
  BEFORE INSERT OR UPDATE ON public.weekly_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_weekly_earnings_user_write();