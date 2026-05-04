## Goals

1. Replace the current free-tier IP intelligence (ipwho.is + ipapi.co) with **Abstract API IP Intelligence** as the primary VPN/proxy/datacenter detector, keeping ipwho.is as a fallback.
2. Optionally use **Abstract API Geolocation** for reverse-geocoding country (replacing geocode.maps.co).
3. Fix the Vault explainer card: re-center the medallion/quote block, restore the "Experience + Time-Coins" wording, tweak two tagline strings, and **move** the `Ads → … ↺` flow line out of the Vault card and into the "Stake your Stablecoins Safely" CTA card with new wording.

## 1. Abstract API integration (VPN detection)

The user shared an API key in chat. Storing API keys in source is unsafe even when the endpoint is "public" — Abstract counts requests against that key and it would be visible in the bundled JS. We'll store it as a Lovable Cloud secret and call Abstract from a tiny edge function that the browser hits.

**New edge function**: `supabase/functions/ip-intelligence/index.ts`

- Reads `ABSTRACT_IP_API_KEY` (and optional `ABSTRACT_GEO_API_KEY`) from env.
- Accepts `GET /ip-intelligence` (no body) and optionally `?lat=&lng=` for the geolocation lookup.
- Calls `https://ip-intelligence.abstractapi.com/v1/?api_key=…` using the caller's IP (read from `x-forwarded-for`, falling back to letting Abstract auto-detect when called server-side without an IP param).
- Normalises the response into the existing `IpInfo` shape:
  - `vpn_suspected` = `security.is_vpn || security.is_proxy || security.is_tor || security.is_hosting || security.is_relay`
  - `reason` = first matching flag, e.g. `"VPN flag from Abstract"` / `"Hosting / datacenter IP"`
  - `org` = `company.name`, `asn` = `asn.asn`, `country_code` = `location.country_code`
- CORS enabled, `verify_jwt = false` (called before login on the consent slide and by VpnGuard).
- Add it to `supabase/config.toml` with `verify_jwt = false`.

**Secret**: prompt the user to paste `ABSTRACT_IP_API_KEY` (and optionally `ABSTRACT_GEO_API_KEY`) via the secrets tool. The key shared in chat will be discarded — please re-enter it in the secret prompt so it's not stored in source/history.

`**src/lib/vpnDetection.ts` rewrite**:

- `fetchIpInfo()` now calls the edge function first (`supabase.functions.invoke('ip-intelligence')`).
- Falls back to the existing ipwho.is path on network/edge failure (offline-friendly: still returns `null`, which `evaluateBlock` treats as "do not block").
- Keep `VPN_HOSTS` / `GENERIC_TOKENS` as a secondary check layered on top of Abstract's flags so a generic "datacenter" string still trips the gate even if Abstract misses.
- `reverseGeocodeCountry()` updated to optionally call the edge function with `?lat=&lng=` if `ABSTRACT_GEO_API_KEY` is present, otherwise keep the geocode.maps.co fallback.

No changes needed to `VpnGuard.tsx` or `GeoConsentSlide.tsx` — they consume `fetchIpInfo()` / `evaluateBlock()` and stay as-is.

[The Main Objective Here is Denying the Access to Users with Open VPN on their Mobile or Desktop:

 If VPN detected→Block Access to Site→Leave a Friendly Message Suggesting Deactivate VPN and Reload.]

## 2. Vault page copy + layout (`src/pages/Earnings.tsx`)

**Top tagline** under the "Vault & Earnings" heading — change to:

> AddLogic doesn't pay per click or per ad watched — it rewards you for your **Time & Experience**.

**Vault explainer paragraph** — restore the dual-track (Experience + Time-Coins) wording and update the withdraw sentence:

> Ad revenue across all tiers is pooled and redistributed by tier importance into **Time-Coins** *and* **Experience** — your in-app tokenised balance and progression earned for the time you spend researching. **Withdraw at any Time** by redeeming **Time-Coins & Experience** for Stablecoins via **MiniPay**, or convert to local currency via **Google Wallet.** 

**Remove** the `<pre>Ads → Time-Coins → Stake → Yield → Stablecoin ↺</pre>` block from this card.

**Center the medallion + Franklin quote block**: the wrapper currently uses `flex flex-col items-center` but its parent `flex items-start gap-3` row gives it a left icon column that throws off optical centering. Move the medallion block out of the inner flex row (make it a sibling of the inner `flex items-start gap-3` div) so it spans the full card width and centers cleanly.

**"Stake your Stablecoins Safely" CTA card** — add the flow line as a third row above/below the existing copy:

```text
Research Your Interests → Earn Time-Coins → In-Vault Staking → Yield Stablecoin ↺
```

Render it as the same `<pre>` styling that previously lived in the Vault card (monospace, secondary background, rounded), so the visual signature follows the concept to its new home.

## 3. Files touched

- New: `supabase/functions/ip-intelligence/index.ts`
- Edit: `supabase/config.toml` (add `[functions.ip-intelligence] verify_jwt = false`)
- Edit: `src/lib/vpnDetection.ts` (Abstract-first lookup, edge function call, reverse-geocode update)
- Edit: `src/pages/Earnings.tsx` (copy changes, layout centering, move flow line to CTA card)
- Memory: update `mem://` to record Abstract API as the primary IP-intel source

## Risks / notes

- Abstract free tier is ~1 req/sec; `VpnGuard`'s 60-second polling + focus re-check will stay well under that for a single user. If quota becomes an issue we can raise the polling interval.
- If the edge function or Abstract is down, we fall back to ipwho.is so the app still works (and still blocks obvious datacenter ASNs via the local list).
  [Now is not Doing it so we would need to Remove [IPwho.is](http://IPwho.is) or Checking its functions because you'd didn't achieved nothing in the last sessions]
- The API key shared in chat should be considered burned — please re-enter it via the secret prompt and rotate it in the Abstract dashboard at your convenience.