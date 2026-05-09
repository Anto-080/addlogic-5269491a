## Why the gate isn't blocking right now

The current Cloudflare-only check is returning a clean verdict even when a VPN is on:

```
{"ip":"…","org":"Tiscali Italia S.P.A.","vpn_suspected":false,"reason":null}
```

Two real problems:

1. **Cloudflare Radar is not a VPN classifier.** Its `result.ip.type` field rarely returns `vpn`/`proxy`/`anonymizer` for consumer VPNs (NordVPN, Mullvad, Proton, etc.). It mostly says `hosting` for datacenter ranges and `business`/`isp` for almost everything else. So our verdict only catches obvious datacenter IPs — most real VPN exit nodes slip through as "ok".
2. **FingerprintJS is loaded but its security signals are unused.** `src/lib/fingerprint.ts` only calls the OSS agent (`visitorId` only). The OSS build does not expose `vpn`, `proxy`, `tor`, or `incognito` signals — those require the Pro/Smart Signals API. Even if we asked the OSS agent for them, it would return nothing.

Net effect: the only thing that can flip the verdict to "blocked" today is the local ASN substring list, which doesn't cover most consumer VPN exits.

## What we'll change

Add a real second source (FingerprintJS Smart Signals) and OR it with Cloudflare. Either source flagging VPN/proxy/Tor/relay = hard block, full site, regardless of GPS toggle. Abstract stays paused on disk as emergency fallback only.

### 1. New edge function: `fingerprint-signals`

- `verify_jwt = false` (called pre-auth from `VpnGuard`).
- Accepts `{ requestId }` from the client (returned by FP Pro `agent.get()`).
- Server-side calls `https://eu.api.fpjs.io/events/{requestId}` (or `api.fpjs.io` for US region) with `Auth-API-Key: ${FINGERPRINT_SECRET_API_KEY}`.
- Reads `products.vpn.data.result`, `products.proxy.data.result`, `products.tor.data.result`, `products.relay.data.result`, `products.incognito.data.result`.
- Returns a normalized payload: `{ vpn: bool, proxy: bool, tor: bool, relay: bool, incognito: bool, confidence: string, error?: string }`.
- Caches per `requestId` for the event lifetime; on upstream error returns `{ error, fallback: true }` with status 200 (never crashes the gate).
- Will need a new runtime secret `FINGERPRINT_SECRET_API_KEY` (added via the secrets tool — we'll request it before deploying).

### 2. Frontend FingerprintJS upgrade

- Swap `@fingerprintjs/fingerprintjs` for `@fingerprintjs/fingerprintjs-pro` in `src/lib/fingerprint.ts`.
- New helper `getVisitorEvent()` → `{ visitorId, requestId }`. The Pro agent is initialized with the public `FINGERPRINT_PUBLIC_API_KEY` (publishable, OK to live in code/env).
- Keep `getVisitorId()` API-stable for existing callers.

### 3. New verdict pipeline in `src/lib/vpnDetection.ts`

```text
fetchIpVerdict()
  ├── callCloudflare()          (existing)
  ├── callFingerprint(requestId) (new — only if requestId obtained)
  └── merge:
        blocked  if  cloudflare.vpn_suspected
                  OR fingerprint.{vpn|proxy|tor|relay} === true
                  OR local ASN blocklist matches
        ok       if  both sources return clean
        unverified if  Cloudflare degraded AND Fingerprint degraded
```

The `info` returned to the UI includes the source of the block (`reason: "FingerprintJS: VPN detected"` etc.) so `VpnGuard` and `VpnConsentSlide` can show meaningful copy.

### 4. `VpnGuard` behavior (unchanged contract, stronger signal)

- Still mounted at App root, still re-checks every 60s + on focus.
- Hard-block screen now fires whenever either source flags. No "continue anyway" button.
- "Unverified" retry gate is preserved (per your answer): if both sources are degraded we show the existing retry UI rather than denying by default.

### 5. `AppLayout` GPS-bound mirror gate

- `useVpnDetector` continues to poll every 5s while the GPS toggle is on.
- Because the underlying verdict is now stronger, the in-layout `VpnConsentSlide` will also fire correctly when the user toggles GPS on while a VPN is up.

### 6. Abstract stays paused

- `supabase/functions/ip-intelligence/` is left on disk. No code path calls it. Documented in the file header as "emergency fallback only — re-enable by adding a `callAbstract()` branch in `vpnDetection.ts`".

### 7. Memory + docs

- Update `mem://index.md` Core line to: "VPN verdict source: Cloudflare Radar + FingerprintJS Pro Smart Signals (either flag → hard block). Abstract paused on disk as emergency fallback."

## What you need to provide

One secret: **`FINGERPRINT_SECRET_API_KEY`** — your FingerprintJS Pro Server API key (Dashboard → API Keys → Secret key). Region matters: tell me whether your workspace is **EU** or **Global/US** so the edge function hits the right base URL (`eu.api.fpjs.io` vs `api.fpjs.io`).

The public key (used by the browser agent) can be hardcoded as a publishable token; share that too or I'll read it from a `VITE_FINGERPRINT_PUBLIC_API_KEY` env var.

## Files touched

- `supabase/functions/fingerprint-signals/index.ts` — new
- `src/lib/fingerprint.ts` — Pro agent, exposes `getVisitorEvent()`
- `src/lib/vpnDetection.ts` — merge Cloudflare + Fingerprint signals
- `src/components/VpnGuard.tsx` — block-reason copy honors source
- `src/components/VpnConsentSlide.tsx` — same
- `package.json` — replace `@fingerprintjs/fingerprintjs` with `@fingerprintjs/fingerprintjs-pro`
- `mem://index.md` — updated Core line

## Out of scope (kept exactly as today)

- The "unverified → retry, never auto-pass" rule.
- GeoConsentSlide GPS↔IP country comparison.
- The ASN substring blocklist (still escalates "ok" → "blocked").
- All other site behavior.
