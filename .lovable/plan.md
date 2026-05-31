## Goal

Rebuild the VPN/proxy gate from a clean baseline so the site only blocks on the Fingerprint ruleset after the user chooses approximate location, while precise GPS always passes without any Fingerprint call.

## Plan

1. Remove legacy and unused runtime paths

- Delete the old app-wide gate code that can still influence behavior (`ConnectionGate` and any leftover helper paths tied to it).
- Remove unused legacy IP-intelligence/blocking paths from the active flow, including any stale Abstract/MaxMind/VPNGuard-style heuristics that can still shape a verdict.
- Remove the global Fingerprint preload wrapper from `main.tsx` so the browser is not fingerprinted before the GeoConsent choice.

2. Rebuild Fingerprint usage around the approximate-location button only

- Keep the official Fingerprint Pro SDK, but load it lazily only when the user clicks the approximate-location button.
- Update the backend function call so it fetches the Fingerprint event exactly from the clicked flow and supports your provided ruleset-driven event lookup.
- Make Cloudflare metadata-only: IP, ASN, and country can be shown/logged, but Cloudflare must never decide allow/block.

3. Simplify the allow/block policy to explicit Fingerprint signals only

- Remove confidence-style or heuristic deny logic from the client flow.
- Make the block decision come only from the Fingerprint event/ruleset path.
- Preserve your intended outcome: GPS branch always allows; approximate branch evaluates the Fingerprint result; after VPN is disabled the next re-check can pass immediately.

4. Rebuild the post-login watcher exactly around session drift

- Cache `{ visitorId/Device ID, ip }` after a successful approximate-location entry.
- Run the watcher every 30s and on focus.
- If only IP changes, silently refresh cache with no new Fingerprint event and no block.
- If device changes, or both device and IP change, clear the approved session, reopen the gate, and force a fresh Fingerprint event on the next approximate-location choice.

5. Deliver a deletion audit with the implementation

- After the reset, provide a concrete list of the files/lines removed and what replaced them, so you can verify that the old logic is truly gone.

## Technical details

- Likely touch points: `src/main.tsx`, `src/lib/fingerprint.ts`, `src/lib/vpnDetection.ts`, `src/components/GeoConsentSlide.tsx`, `src/components/PostLoginGate.tsx`, `src/lib/sessionWatcher.ts`, and the active backend function used for Fingerprint event lookup.
- Current contradictions already found in code:
  - `src/lib/vpnDetection.ts` still blocks on raw `vpn=true`.
  - Fingerprint is still initialized globally in `src/main.tsx`.
  - Legacy IP-intelligence functions still exist in the project and need to be removed from the active runtime path.
- I will keep the runtime centered on one source of truth for blocking and remove any parallel deny logic.

## Result

After implementation, the flow will be:

```text
Login
→ GeoConsentSlide opens
  → GPS chosen and succeeds: allow immediately, no Fingerprint call
  → Approximate chosen: create Fingerprint event, fetch ruleset result, allow or block
→ After entry, watcher only monitors drift
  → IP-only change: stay in
  → device change or both: gate reopens and re-check happens
[NO POST VPN DETECTION BLOCKING OF NON-VPN USERS]
```