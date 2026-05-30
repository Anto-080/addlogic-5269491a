## Goal

The VPN/proxy block must only ever happen on the **Approximate (IP) location** branch of the entrance card. Picking **Precise GPS** must never call Fingerprint and never show the "VPN or proxy detected" card. Today the app-wide `ConnectionGate` runs first and triggers the block regardless of the user's choice.

## Root cause

`src/App.tsx` wraps every protected route as `<ConnectionGate><PostLoginGate>…</PostLoginGate></ConnectionGate>`. `ConnectionGate` immediately fires a Fingerprint event + IP verdict on mount, so the block card can appear before the user ever sees the entrance card. That's why the screenshot keeps showing "VPN or proxy detected" even though the rule should only trigger from the Approximate branch.

## Changes

1. **`src/App.tsx`** — remove `ConnectionGate` from `ProtectedRoute`. The only gate left is `PostLoginGate` → `GeoConsentSlide`. (We will keep `ConnectionGate.tsx` on disk for now but unused, so nothing else accidentally imports it.)

2. **`src/components/GeoConsentSlide.tsx`** — make the entrance card the single decision point:
   - Remove the eager `getVisitorId()` and `fetchIpInfo()` calls in the open effect (they currently warm up Fingerprint before the user clicks anything).
   - `tryGps()` (Precise GPS) stays as today: **no Fingerprint call, no IP verdict**, finalize and unlock.
   - `tryIp()` (Approximate) is the **only** path that calls Fingerprint:
     - Force a fresh Fingerprint event (`clearVisitorEventCache()` then `getVisitorEvent()`).
     - Evaluate with `evaluateFingerprint`: block only on Public VPN=true, Tor=true, or Proxy=true with `proxyType ∈ {datacenter, hosting, server, cloud}`. Residential / mobile / ISP proxies, Privacy Relay, and `vpn=false` → allow.
     - On block: show the existing in-card red strip ("VPN/Proxy traffic detected…") and switch the IP button to "Re-check (after disabling VPN)" — exactly as already wired.
     - On allow: finalize, seed `setApprovedSession({ visitorId, ip })`, unlock.

3. **`src/lib/vpnDetection.ts`** — keep `evaluateFingerprint` as-is (block list = Tor + datacenter/hosting/server/cloud proxy + explicit `vpn=true`). Update `verifyIpForApproximateLocation()` to include `vpn=true` in the block set so the Approximate branch enforces the rule the user asked for:
   - Block: Public VPN OR Tor OR (Proxy with datacenter/hosting type).
   - Allow: residential / mobile / ISP proxy, Privacy Relay alone, no signals.
   - This function is only called from `tryIp()`, so GPS users still bypass it.

4. **`src/components/PostLoginGate.tsx`** — no longer needs to call `fetchIpInfo()` to re-validate the satisfied flag (that call was effectively a stealth IP lookup). Replace with: if `sessionStorage` has the satisfied marker for this user, trust it for the session; if `getApprovedSession` has a cached `{visitorId, ip}` and the visitorId hasn't changed, keep trusting it. No Fingerprint call here — drift is handled by the session watcher *after* entry.

5. **Session watcher (`src/lib/sessionWatcher.ts` + watcher loop)** — move the 60s + focus drift loop out of `ConnectionGate` (which we're removing from the tree) and into `PostLoginGate`, but only arm it for users who entered via the **Approximate** branch (i.e. only when `getApprovedSession` was seeded by `tryIp`). GPS users never get a watcher and never get a block card. Rules unchanged:
   - IP same / IP-only changed → silent, no Fingerprint call.
   - visitorId changed (or both changed) → fresh Fingerprint event + re-evaluate; on block, surface the same in-card block UI by reopening `GeoConsentSlide` in its blocked state.

6. **`src/pages/Dashboard.tsx`** — remove the second `GeoConsentSlide` instance (`geoSlideOpen`). There must be exactly one entrance card, owned by `PostLoginGate`.

7. **`mem://index.md`** — update the Core rule to reflect: "VPN/Fingerprint check runs **only** on the Approximate branch of the entrance card. Precise GPS bypasses Fingerprint entirely and never triggers the block card."

## Out of scope

- No backend / edge-function changes. The `fingerprint-signals` function already returns the granular `proxyType` we need.
- No "mobile location spoofing" signal added (Fingerprint's current payload to this project doesn't expose a dedicated one; you confirmed: block only on explicit signals).
- No UI restyle of the block card; only its placement and trigger conditions change.

## Verification

- Reload as a residential/mobile user → entrance card shows, GPS unlocks instantly, no Fingerprint network call in DevTools.
- Reload behind a real VPN, pick Approximate → Fingerprint POST fires, block strip appears in the entrance card with the "Re-check" button. Disable VPN, click Re-check → unlocks.
- Reload behind a residential proxy / Privacy Relay, pick Approximate → unlocks.
- After entry, rotate the mobile IP → no block, no Fingerprint call. Switch to a real VPN mid-session → device changes → watcher re-evaluates and reopens the entrance card in blocked state.
