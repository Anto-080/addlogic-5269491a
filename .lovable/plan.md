# Smarter VPN Block: Datacenter vs Residential + Session Watcher

## Goal

Stop blocking mobile/residential users. Only hard-block when FingerprintJS Pro indicates a truly risky network. After entry, keep the user in unless **both** their IP and their device fingerprint change at the same time.

## Block rule (new)

Block only when ANY of these are true from FingerprintJS Pro Smart Signals:

- Public VPN = true, OR
- Tor exit = true, OR
- Proxy = true AND proxy type = Datacenter (or Hosting)

Allow in all other cases, including:

- Proxy = true with type Residential / Mobile / ISP / Cellular
- Privacy Relay/Privacy Settings (iCloud Private Relay, etc.) on its own
- Fingerprint signals unavailable → `unverified` (retry UI, never an auto-block)

## Session watcher (new)

Once a user passes the entrance gate, we cache an "approved session":

- `visitorId` (FingerprintJS device ID)
- `ip` (from Cloudflare metadata lookup)

While the app is open we lightly re-check the current IP every 60s and on tab focus (no Fingerprint call required for this step):

```text
IP same                                 → allow, do nothing
IP changed, visitorId still cached same → allow, update cached IP silently
IP changed AND visitorId changed/missing → trigger full re-check:
    fresh Fingerprint event + new block-rule evaluation
    if blocked → show full-screen VPN block card
    if ok → refresh approved session
```

This makes dynamic mobile IPs a non-event, and only escalates when the device identity also shifts, which is the real signal of a fresh VPN/proxy hop.

## Files changed

- `supabase/functions/fingerprint-signals/index.ts`
  - Read additional fields from the FP Pro event: `proxy.data.type` (e.g. `datacenter` / `residential` / `mobile` / `isp`) and IP `ipInfo` country/ASN if present.
  - Return `{ vpn, tor, relay, incognito, proxy, proxyType, ipFromFp }` so the client has the type, not just a boolean.
- `src/lib/vpnDetection.ts`
  - New helper `evaluateFingerprint(signals)` implementing the rule above. Datacenter/Hosting + VPN + Tor → `blocked`. Residential/Mobile/ISP proxy → `ok`. Relay alone → `ok`.
  - `fetchIpVerdict` / `fetchIpVerdictWithFingerprintEvent`: replace current `fingerprintReason` with `evaluateFingerprint`; surface `proxyType` in the verdict info so the UI/telemetry can show it.
  - `verifyIpForApproximateLocation` uses the same evaluator.
  - Keep "never cache blocked" behavior. Continue to cache `ok` briefly.
- `src/lib/sessionWatcher.ts` (new, small)
  - `getApprovedSession()` / `setApprovedSession({ visitorId, ip })` backed by `sessionStorage` keyed per user id.
  - `checkSessionDrift()` — fetches lightweight IP info only (Cloudflare), compares to cached `{ip, visitorId}`. Returns one of `same` | `ip-changed` | `device-changed` | `both-changed` | `no-session`. Updates cache for the ip-only-changed case.
- `src/components/ConnectionGate.tsx`
  - On first pass: when verdict is `ok`, write the approved session (visitorId + ip).
  - Replace the unconditional 60s `runCheck` interval with `checkSessionDrift`:
    - `ip-changed` only → silently refresh cached ip, do not re-open the gate.
    - `device-changed` or `both-changed` → run a forced `runCheck(true)` (fresh Fingerprint event + fresh upstream lookup). If blocked, show the full-screen card again.
  - Keep "Re-check" button forcing a fresh event.
- `src/components/PostLoginGate.tsx`
  - Continue to gate first entry through `GeoConsentSlide`. Stop using stored `ip` alone as the re-validation key; the new session watcher in `ConnectionGate` owns mid-session drift detection. PostLoginGate only checks that the user has satisfied the entrance card at least once this session.
- `src/components/GeoConsentSlide.tsx`
  - On successful approximate-IP path, write the approved session too (so reloads don't immediately trigger a full re-check).
- `mem://index.md`
  - Update the core rule to: "Fingerprint Pro is the sole block authority; only Public VPN, Tor, or Datacenter-type proxy block. Residential/Mobile proxy and Privacy Relay are allowed. Session is keyed on (visitorId, ip): IP-only changes are silent; device+IP both changing triggers a fresh check."

## Technical notes

- Fingerprint Pro Events API exposes proxy type via `products.proxy.data.type` on workspaces where the Proxy product is enabled. If a workspace returns `proxy=true` with no `type`, treat as `unverified` rather than auto-blocking, so mobile users with bare booleans aren't kicked.
  [I have Settled Fingerprintjs Rules to Check if Proxy Detected are From Residential or Data Centers so this wouldn't Impact the Proxy Detection, only Relay from iCloud could get Unverified but the Continental Region and Country are Still Detected as Residential Requests]
- All session state lives in `sessionStorage` (cleared on tab close), never persisted long-term, never used as a block input — only to suppress unnecessary Fingerprint calls.
- No DB schema changes. `device_telemetry` writes remain unchanged.
- No new secrets required; uses existing `FINGERPRINT_SERVER_API_KEY` and Cloudflare lookup.

## Validation

- Public VPN on (datacenter) → full-screen block. Disable VPN, click Re-check → enters site.
- Mobile network Proxy with carrier-grade NAT / changing IP → enters site, stays in even as IP rotates.
- Residential proxy users (e.g. some corporate networks Fingerprint flags as proxy=residential) → enter site.
- Mid-session: turn on a datacenter VPN → next 60s tick (or tab focus) detects device-change-after-IP-change → fresh Fingerprint event → block card returns.