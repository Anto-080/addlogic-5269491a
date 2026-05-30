-- 1) tier_progress: block non-admin writes to multiplier_bonus on INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.prevent_tier_progress_multiplier_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      -- Force default; user cannot seed a non-zero multiplier_bonus.
      NEW.multiplier_bonus := 0;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.multiplier_bonus IS DISTINCT FROM OLD.multiplier_bonus THEN
      IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'multiplier_bonus on tier_progress can only be modified by admins or server-side functions';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_tier_progress_multiplier_write_trigger ON public.tier_progress;
CREATE TRIGGER prevent_tier_progress_multiplier_write_trigger
BEFORE INSERT OR UPDATE ON public.tier_progress
FOR EACH ROW
EXECUTE FUNCTION public.prevent_tier_progress_multiplier_write();

-- 2) user_stats: extend the sensitive-write guard to also cover INSERT
CREATE OR REPLACE FUNCTION public.prevent_user_stats_sensitive_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      -- Force defaults; a user cannot seed inflated economic columns.
      NEW.xp := 0;
      NEW.level := 1;
      NEW.earnings_today := 0;
      NEW.earnings_week := 0;
      NEW.earnings_all_time := 0;
      NEW.current_multiplier := 1.0;
      NEW.active_streak := 0;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.xp IS DISTINCT FROM OLD.xp
       OR NEW.level IS DISTINCT FROM OLD.level
       OR NEW.earnings_today IS DISTINCT FROM OLD.earnings_today
       OR NEW.earnings_week IS DISTINCT FROM OLD.earnings_week
       OR NEW.earnings_all_time IS DISTINCT FROM OLD.earnings_all_time
       OR NEW.current_multiplier IS DISTINCT FROM OLD.current_multiplier
       OR NEW.active_streak IS DISTINCT FROM OLD.active_streak
    THEN
      IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Sensitive stat columns can only be modified by admins or server-side functions';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Replace the old UPDATE-only trigger with the new INSERT+UPDATE one.
DROP TRIGGER IF EXISTS prevent_user_stats_sensitive_update_trigger ON public.user_stats;
DROP TRIGGER IF EXISTS prevent_user_stats_sensitive_update ON public.user_stats;
DROP TRIGGER IF EXISTS prevent_user_stats_sensitive_write_trigger ON public.user_stats;

CREATE TRIGGER prevent_user_stats_sensitive_write_trigger
BEFORE INSERT OR UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_stats_sensitive_write();