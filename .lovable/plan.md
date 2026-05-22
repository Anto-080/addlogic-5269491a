## Goal

Make the initial site-entry block actually deny access when FingerprintJS flags VPN/proxy traffic, and clean up the confusing `VpnGuard` naming.

## Plan

1. **Update the existing Fingerprint server secret**
  - Replace the current backend secret used by `fingerprint-signals` with the new Fingerprint server key.
  - Keep the existing secret name `FINGERPRINT_SECRET_API_KEY` because the deployed function already reads that exact variable.
  - Do not create a second differently named secret, otherwise the function will still read the old one.
2. **Verify the backend Fingerprint function is really authenticating**
  - Re-test `fingerprint-signals` after the secret update.
  - Confirm the current `403 TokenNotFound / secret key is not found` error is gone.
  - If the error persists, verify the configured Fingerprint region matches the workspace region used by the browser agent and event lookup.
3. **Tighten the entry gate behavior**
  - Audit the initial gate flow in `src/components/VpnGuard.tsx` and `src/lib/vpnDetection.ts`.
  - Ensure the app never becomes enterable when Fingerprint returns a VPN/proxy/Tor/relay signal.
  - Keep the hard-block behavior: if Fingerprint or the IP intelligence branch flags the user, access stays blocked.
4. **Clarify the naming in code**
  - Rename `VpnGuard` to a clearer name such as `ConnectionGate` or `NetworkAccessGate`.
  - Update imports/usages so the component name reflects its real job: an app-wide access gate that consumes Fingerprint/IP signals, not a standalone VPN detector.
5. **Validate the real blocking path**
  - Test the gate with a flagged connection scenario.
  - Confirm the user sees the block screen and cannot continue into the app until the connection verifies as allowed.

## Technical notes

- Right now the main blocker is not the React wrapper name; it is the backend Fingerprint lookup failing upstream.
- `VpnGuard` is only the **UI/component name** for the full-screen access gate in `src/App.tsx`.
- The actual detection sources live in `src/lib/vpnDetection.ts` and the backend `fingerprint-signals` function.
- Because the code already reads `FINGERPRINT_SECRET_API_KEY`, the correct action is to **update that existing secret**, not add a new custom secret label.

## Expected outcome

- FingerprintJS becomes part of the real first-entry block.
- Flagged VPN/proxy traffic is blocked from entering the site.
- The gate component name becomes clearer and less misleading. 

[Open Question: you're going to ask me the Server API Key? How I know you're working]