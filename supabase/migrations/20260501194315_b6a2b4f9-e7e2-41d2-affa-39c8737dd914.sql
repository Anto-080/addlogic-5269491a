
-- Add anti-fraud / fingerprint columns to device_telemetry
ALTER TABLE public.device_telemetry
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS ip_country text,
  ADD COLUMN IF NOT EXISTS gps_country text,
  ADD COLUMN IF NOT EXISTS vpn_suspected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asn text;

-- Cookie audit (proves the toggle did something)
CREATE TABLE IF NOT EXISTS public.cookie_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  host text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL, -- 'first' | 'third' | 'zero'
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cookie_audit_user_idx ON public.cookie_audit (user_id, observed_at DESC);
ALTER TABLE public.cookie_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own cookie_audit"
  ON public.cookie_audit FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cookie_audit"
  ON public.cookie_audit FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own cookie_audit"
  ON public.cookie_audit FOR DELETE
  USING (auth.uid() = user_id);

-- Tier keywords (HuggingFace-derived subcategories)
CREATE TABLE IF NOT EXISTS public.tier_keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tier_id integer NOT NULL,
  keyword text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tier_id, keyword)
);
CREATE INDEX IF NOT EXISTS tier_keywords_lookup ON public.tier_keywords (user_id, tier_id, last_seen DESC);
ALTER TABLE public.tier_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tier_keywords"
  ON public.tier_keywords FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tier_keywords"
  ON public.tier_keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tier_keywords"
  ON public.tier_keywords FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
