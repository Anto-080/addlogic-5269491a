-- Admin-only feature flags (per-user overrides, restricted to admins)
CREATE TABLE public.admin_feature_flags (
  user_id UUID NOT NULL PRIMARY KEY,
  force_opera_search BOOLEAN NOT NULL DEFAULT false,
  force_investment_l50 BOOLEAN NOT NULL DEFAULT false,
  force_circular_l100 BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read own flags"
ON public.admin_feature_flags FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert own flags"
ON public.admin_feature_flags FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update own flags"
ON public.admin_feature_flags FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_admin_feature_flags_updated_at
BEFORE UPDATE ON public.admin_feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Non-PII device telemetry (per-user, owner only)
CREATE TABLE public.device_telemetry (
  user_id UUID NOT NULL PRIMARY KEY,
  lat NUMERIC,
  lng NUMERIC,
  accuracy_m NUMERIC,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own telemetry"
ON public.device_telemetry FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own telemetry"
ON public.device_telemetry FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own telemetry"
ON public.device_telemetry FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_device_telemetry_updated_at
BEFORE UPDATE ON public.device_telemetry
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();