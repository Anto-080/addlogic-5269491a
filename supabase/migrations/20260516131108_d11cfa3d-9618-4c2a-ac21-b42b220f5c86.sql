ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS locked_query text;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;