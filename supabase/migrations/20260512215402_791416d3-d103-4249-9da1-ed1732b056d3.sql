ALTER TABLE public.tier_keywords
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'keyword'
  CHECK (kind IN ('keyword','subcategory'));

CREATE INDEX IF NOT EXISTS tier_keywords_user_tier_kind_idx
  ON public.tier_keywords(user_id, tier_id, kind);