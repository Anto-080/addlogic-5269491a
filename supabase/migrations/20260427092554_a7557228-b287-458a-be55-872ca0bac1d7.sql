
-- 1) Restrict offers table: drop public read, allow admins only
DROP POLICY IF EXISTS "Offers public read" ON public.offers;

CREATE POLICY "Admins read offers"
ON public.offers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public-safe view excluding cpa_payout
CREATE OR REPLACE VIEW public.offers_public
WITH (security_invoker = true)
AS
SELECT id, merchant, tier_id, title, original_price, sale_price, discount, created_at
FROM public.offers;

GRANT SELECT ON public.offers_public TO anon, authenticated;

-- 2) Harden user_roles: explicit restrictive policy preventing non-admin writes
-- Existing "Admins manage roles" (FOR ALL) already restricts, but add a
-- restrictive policy as defense-in-depth so any future permissive policy
-- cannot accidentally allow self-insert.
CREATE POLICY "Only admins can write roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
