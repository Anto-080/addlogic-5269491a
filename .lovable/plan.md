## Goal

Get the existing FingerprintJS Pro integration working by replacing the two stored keys with the correct values, then verify the VPN/Proxy hard-block actually triggers.

No code changes, no DNS changes, no nameserver changes. The integration code (edge function, frontend agent, verdict pipeline) is already in place from the previous step — only the secrets were wrong.

## Steps

1. **Trigger the secrets-update form** for both keys at once:
   - `FINGERPRINT_PUBLIC_API_KEY` — the **Public API Key** from FingerprintJS Dashboard → App Settings → API Keys (the one labeled *Public*; safe to ship to the browser).
   - `FINGERPRINT_SECRET_API_KEY` — the **Secret API Key** from the same screen (labeled *Secret*; never leaves the edge function).
   
   You'll paste both into the secure form. Nothing else is needed.

2. **Confirm the FingerprintJS workspace region.** The edge function currently defaults to `eu` (`eu.api.fpjs.io`). If your FingerprintJS workspace was created in the US/Global or AP region, the lookup will return 404 and the gate will fall to "unverified". I'll ask you to check the region shown in your FP dashboard URL or settings; if it's not EU, I'll set the `FINGERPRINT_REGION` runtime secret to `us` or `ap`.

3. **Verify end-to-end:**
   - Call the `fingerprint-signals` edge function via curl (GET) to confirm `configured: true` and the right region is returned.
   - Tail the edge function logs while you reload the preview with VPN **off** → expect `verdict.status = "ok"`, no block screen.
   - Then with VPN **on** → expect the hard-block screen with reason "FingerprintJS: VPN detected" (or similar). I'll watch the logs to confirm the upstream call returned `vpn: true`.
   - If FP returns clean but the VPN is clearly active, I'll inspect the raw `products` payload from FP and adjust which signal flags we trust (e.g. add `suspectScore` threshold).

4. **Done.** No further work unless verification surfaces a real issue. The Cloudflare-subdomain integration stays out of scope (only relevant on a custom domain you own; `addlogic.lovable.app` cannot host CNAMEs).

## Out of scope

- DNS / nameserver changes
- Cloudflare ↔ FingerprintJS first-party subdomain
- Any UI / copy / business-logic change
- Re-enabling Abstract (stays paused on disk)

## What you'll be asked to do

- Paste the two FP API keys into the secure form when prompted (one prompt, both keys).
- Tell me the FP workspace region (EU / Global-US / AP).
- Toggle your VPN on/off once during verification.
