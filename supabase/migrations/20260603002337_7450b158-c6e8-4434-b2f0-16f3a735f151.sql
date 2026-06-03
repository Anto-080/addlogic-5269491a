
-- 1) user_stats: revoke UPDATE on sensitive economic columns from authenticated
REVOKE UPDATE (xp, level, earnings_today, earnings_week, earnings_all_time, current_multiplier, active_streak)
  ON public.user_stats FROM authenticated;
-- Keep allowed user-writable columns explicit
GRANT UPDATE (locked_query, locked_until, updated_at) ON public.user_stats TO authenticated;

-- 2) tier_progress: revoke UPDATE on multiplier_bonus from authenticated; also block INSERT of non-default
REVOKE UPDATE (multiplier_bonus) ON public.tier_progress FROM authenticated;
REVOKE INSERT (multiplier_bonus) ON public.tier_progress FROM authenticated;
GRANT UPDATE (seconds_active, fingerprint, tier_id, updated_at) ON public.tier_progress TO authenticated;
GRANT INSERT (user_id, tier_id, seconds_active, fingerprint, updated_at) ON public.tier_progress TO authenticated;

-- 3) device_telemetry: revoke UPDATE/INSERT on sensitive verdict columns from authenticated
REVOKE UPDATE (vpn_suspected, fingerprint, asn, ip_country, gps_country)
  ON public.device_telemetry FROM authenticated;
REVOKE INSERT (vpn_suspected, asn, ip_country, gps_country)
  ON public.device_telemetry FROM authenticated;
GRANT UPDATE (lat, lng, accuracy_m, profile, updated_at) ON public.device_telemetry TO authenticated;
GRANT INSERT (user_id, lat, lng, accuracy_m, profile, fingerprint, updated_at) ON public.device_telemetry TO authenticated;

-- 4) weekly_earnings: add admin DELETE policy
CREATE POLICY "Admins delete weekly"
ON public.weekly_earnings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
