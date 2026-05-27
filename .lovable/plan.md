# Plan

1. Replace the current mixed block pipeline with a FingerprintJS-only verdict path.
  - Remove local ASN/org keyword blocklist, and MaxMind from access-control decisions.
  - Keep FingerprintJS Smart Signals as the single source that can return `blocked` for VPN/proxy/Tor/relay.
2. Update both gate flows so they use the same single source of truth.
  - `ConnectionGate` should only block on the latest FingerprintJS event result.
  - `GeoConsentSlide` approximate-location check should also use the same FingerprintJS-only verdict, so it cannot disagree with the main gate.
  - Preserve retry behavior, but ensure a fresh Fingerprint event is requested when the user re-checks after disabling a VPN.
3. Remove sticky false-positive behavior from client caching/session logic.
  - Shorten or eliminate any cached blocked verdict that can survive after the VPN is turned off.
  - Ensure “re-check” forces a fresh Fingerprint event and a fresh backend lookup instead of reusing a stale blocked result.
  - Review the post-login session gate so it doesn’t preserve an old deny state across refreshes.
4. Keep non-blocking network metadata only where still useful.
  - If IP/country/ASN info is still shown in UI details or telemetry, keep it informational only.
  - Do not let informational IP data trigger bans anymore.
5. Validate the end-to-end behavior.
  - Confirm the app allows entry when FingerprintJS no longer flags the user.
  - Confirm the app still hard-blocks when FingerprintJS explicitly flags VPN/proxy/Tor/relay.
  - Check for any unrelated auth noise (like stale refresh token recovery) that may confuse the experience, and isolate it from the gate behavior if needed.

## Technical details

- Primary file changes will likely be:
  - `src/lib/vpnDetection.ts`
  - `src/components/ConnectionGate.tsx`
  - `src/components/GeoConsentSlide.tsx`
  - possibly `src/components/PostLoginGate.tsx` if session re-validation needs tightening
- Expected result:
  - FingerprintJS controls access decisions.
  - Legacy MaxMind / local ASN rules no longer hard-block users.
  - Re-checking after disabling a VPN no longer leaves the user stuck behind an old ban.
  [Consideration: I checked the Cloudflare IP Check and even disabled it does not let me enter the site so leave Cloudflare for now]