
-- 1) device_telemetry: remove user write policies; server-only writes
DROP POLICY IF EXISTS "Users update own telemetry" ON public.device_telemetry;
DROP POLICY IF EXISTS "Users insert own telemetry" ON public.device_telemetry;
DROP POLICY IF EXISTS "Users upsert own telemetry" ON public.device_telemetry;
REVOKE INSERT, UPDATE, DELETE ON public.device_telemetry FROM authenticated;

-- 2) phone_otp_challenges: drop SELECT policy so hashes are unreadable
DROP POLICY IF EXISTS "Users read own otp challenges" ON public.phone_otp_challenges;
REVOKE SELECT ON public.phone_otp_challenges FROM authenticated;

-- 3) profiles: restrict SELECT to own row
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4) user_stats: column-level revoke on sensitive economic columns
REVOKE UPDATE ON public.user_stats FROM authenticated;
GRANT UPDATE (user_id) ON public.user_stats TO authenticated;
