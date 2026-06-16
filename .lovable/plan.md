## Goal
End the Fingerprint loop. Use your existing FingerprintJS Free keys (public + server) for stable visitor ID, consume the Cloudflare Worker verdict on `add-logic.com/*` for the VPN signal, and show a single full-screen block card when a VPN is detected. Bump Vite to 6.0.0 and refresh lockfiles so the Worker pipeline is happy.

## Important reality check
FingerprintJS Free does NOT expose Smart Signals (`vpn`, `proxy`, `tor`) on the Events API — that field set is Pro Plus only. We will still call the Events API with your server key for the visitor ID + IP, but VPN truth comes from:
1. The Cloudflare Worker verdict (primary), and
2. `ABSTRACT_IP_API_KEY` (already in your secrets) as a server-side fallback when the Worker header is absent (e.g. preview domain).

If the Worker is already deciding VPN, the app just trusts its verdict — no second guess.

## Plan

### 1) Confirm + refresh the two Fingerprint keys
- Trigger the secrets update form for `FINGERPRINT_PUBLIC_API_KEY` and `FINGERPRINT_SERVER_API_KEY`. You paste; I never see them.
- Delete the now-unused `FINGERPRINT_SECRET_API_KEY` alias to avoid drift.

### 2) Tell me how the Worker hands us its verdict
I need one detail before coding step 3. The Worker on `add-logic.com/*` is presumably injecting either:
- a response header (e.g. `x-vpn: 1`, `x-al-verdict: block`), or
- a cookie (e.g. `al_vpn=1`), or
- a small JSON endpoint (e.g. `GET /__al/verdict`).

I'll use the channel you tell me. Default assumption if unspecified: header `x-al-vpn` with values `block` | `allow`, plus `x-al-ip` echoing the exit IP.

### 3) Rebuild the Fingerprint + VPN pipeline
- `src/lib/fingerprint.ts` → switch back to the **standard browser agent** loaded from `https://fpjscdn.net/v3/<publicKey>` (Free tier, no `endpoint`, no Pro options). Returns `visitorId` only.
- `supabase/functions/fingerprint-signals/index.ts` → simplified:
  - `GET` returns `{ publicKey, configured }`.
  - `POST { requestId }` calls the Events API with `FINGERPRINT_SERVER_API_KEY`, returns `{ visitorId, ip, ipCountry }`. No `vpn/proxy/tor` parsing (Free tier doesn't supply them).
- New `supabase/functions/vpn-verdict/index.ts`:
  - Reads request headers forwarded by the client (`x-al-vpn`, `x-al-ip`) — that's the Worker verdict.
  - If absent, calls Abstract IP Intelligence with the IP from Fingerprint and returns `{ block: is_vpn || is_tor || is_proxy }`.
  - Returns `{ block: boolean, reason, source: "worker" | "abstract" | "none" }`.
- `src/lib/vpnDetection.ts` → thin client that:
  1. Forwards the Worker headers (read via `fetch('/', { method: 'HEAD' })` to capture them, or directly via `document` if the Worker also sets a cookie).
  2. Calls `vpn-verdict` with the IP from `fingerprint-signals`.
  3. Returns `{ ok, reason, visitorId, ip }`.
- `src/components/PostLoginGate.tsx` keeps its existing flow but now consumes the simplified verdict; block card unchanged, "Re-check" re-runs the verdict only (no Fingerprint reload needed unless device id drifts).

### 4) Drop the dead Pro code paths
- Remove `requestId`, `rulesetAction`, Smart Signals fields, and the ruleset query param.
- Remove `clearVisitorEventCache` callers that only existed for Pro re-checks; keep one simple `recheck()` exported for the block card.

### 5) Vite 6 + lockfile refresh
- `package.json` → pin `"vite": "6.0.0"` and bump `@vitejs/plugin-react-swc` to a 6-compatible version.
- Run `bun install` to regenerate `bun.lock` + `bun.lockb`. If a `package-lock.json` is present, delete it (project is bun-managed) so Cloudflare doesn't pick a stale npm lockfile.
- Sanity-check `vite.config.ts` for any v6 breaking changes (none expected here).

### 6) Verify
- Build runs clean (Lovable auto-build).
- Preview: open Dashboard, confirm no blank page when keys are present, confirm block card appears when `vpn-verdict` returns `block: true` (I'll force it once with a debug query flag for the smoke test, then remove the flag).
- Memory update: replace the "FingerprintJS Pro Smart Signals is the SOLE block authority" line with the new architecture (Worker verdict primary, Abstract fallback, Fingerprint = identity only).

## What I need from you to start build
1. Approve this plan.
2. Tell me the Worker's signal channel (header name / cookie name / endpoint). If you say "use the default", I'll wire `x-al-vpn` + `x-al-ip`.
3. Be ready to paste the two Fingerprint keys in the secrets form when it pops.
