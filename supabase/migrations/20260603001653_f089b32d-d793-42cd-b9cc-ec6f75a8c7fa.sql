-- 1. Add phone column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- 2. OTP challenges table
CREATE TABLE IF NOT EXISTS public.phone_otp_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_user ON public.phone_otp_challenges(user_id);

-- Grants (auth-only table; all policies scope to auth.uid())
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_otp_challenges TO authenticated;
GRANT ALL ON public.phone_otp_challenges TO service_role;

-- RLS
ALTER TABLE public.phone_otp_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own otp challenges"
  ON public.phone_otp_challenges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own otp challenges"
  ON public.phone_otp_challenges
  FOR DELETE
  USING (auth.uid() = user_id);
