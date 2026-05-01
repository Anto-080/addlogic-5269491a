ALTER TABLE public.tier_progress
  ADD CONSTRAINT tier_progress_seconds_active_check
    CHECK (seconds_active >= 0 AND seconds_active <= 31536000),
  ADD CONSTRAINT tier_progress_multiplier_bonus_check
    CHECK (multiplier_bonus >= 0 AND multiplier_bonus <= 100);