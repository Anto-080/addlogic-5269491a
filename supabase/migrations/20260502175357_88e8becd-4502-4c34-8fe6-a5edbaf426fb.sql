-- Anonymous, aggregated research analytics (non-PII).
CREATE TABLE public.anonymous_research_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id integer,
  host text,
  visit_count integer NOT NULL DEFAULT 0,
  total_dwell_seconds integer NOT NULL DEFAULT 0,
  bucket_week date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX anon_research_tier_week_idx
  ON public.anonymous_research_analytics (tier_id, bucket_week);

ALTER TABLE public.anonymous_research_analytics ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for authenticated users.
-- Only service_role (which bypasses RLS) and the security-definer RPC below can write.

-- Allow users to delete their own outbound_visits (needed by the RPC and by direct erase).
CREATE POLICY "Users delete own outbound_visits"
  ON public.outbound_visits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Security-definer RPC: aggregate the caller's outbound_visits into the
-- anonymous table, then delete their personal rows. Returns the number of
-- visits archived.
CREATE OR REPLACE FUNCTION public.anonymize_outbound_visits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  archived integer := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH agg AS (
    SELECT
      tier_id,
      host,
      date_trunc('week', opened_at)::date AS bucket_week,
      COUNT(*)::int AS visit_count,
      COALESCE(SUM(dwell_seconds), 0)::int AS total_dwell_seconds
    FROM public.outbound_visits
    WHERE user_id = uid
    GROUP BY tier_id, host, date_trunc('week', opened_at)::date
  )
  INSERT INTO public.anonymous_research_analytics
    (tier_id, host, visit_count, total_dwell_seconds, bucket_week)
  SELECT tier_id, host, visit_count, total_dwell_seconds, bucket_week
  FROM agg;

  WITH deleted AS (
    DELETE FROM public.outbound_visits WHERE user_id = uid RETURNING 1
  )
  SELECT COUNT(*)::int INTO archived FROM deleted;

  RETURN archived;
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_outbound_visits() FROM public;
GRANT EXECUTE ON FUNCTION public.anonymize_outbound_visits() TO authenticated;