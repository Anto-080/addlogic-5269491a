# Plan — Entrance-card VPN gating + minor visuals

## 1. Remove the always-on site-wide VPN hard gate

- `src/App.tsx`: stop wrapping the app in `<VpnGuard>`. The current Cloudflare/FingerprintJS hard block runs on every page (including `/login`) and is the main reason VPN control "doesn't work" while also burning quota.
- Keep `src/components/VpnGuard.tsx` on disk for now (unused) — easy to re-enable, no behavior cost.
- Remove the in-layout `VpnConsentSlide` from `AppLayout.tsx` (and the `useVpnDetector` polling tied to the GPS toggle). VPN gating now happens once, in the entrance card.

## 2. Promote the GPS card to a post-login entrance gate

`GeoConsentSlide` becomes the single chokepoint right after authentication. It blocks the app behind a full-screen card with two outcomes:

- **Use precise location (GPS)** — calls the existing phone GPS fetcher. If GPS is off / denied, it keeps returning negative just like today. Success → user is trusted, app unlocks, **no IP/VPN check is ever called for them**. Sales pitch on the card: more precise + better-paid ads, regional offers.
- **Use approximate location (IP)** — only this branch triggers a fraud check. We call MaxMind minFraud (when the key exists) **plus** FingerprintJS Pro Smart Signals (already wired) to decide vpn/proxy/datacenter. Pass → unlock. Fail → user is told to disable VPN and retry; no app access.

Mounting:

- Move the slide out of `Dashboard.tsx` and into a new `PostLoginGate` wrapper used by `ProtectedRoute` (so it shows on every protected page until satisfied for the session).
- "Satisfied" is stored per-session (sessionStorage keyed by user id) so the gate doesn't re-prompt on every navigation, but re-shows on a fresh login and at Each Refresh Control the Approximate IP is the Same as the Last Session.

Card content (kept from current `GeoConsentSlide`, copy tightened):

- Headline + short paragraph summarising: "Activate GPS for more precise, better-paid ads and regional offers, **or** share approximate location so we can verify you're not on a VPN/proxy used by bot farms to drain the regional reward pool."
- Keep the **collapsible "Show anti-fraud details"** block (fingerprint id + IP/ASN readout).
- Keep the two buttons exactly as they are.
- Remove "Cancel and turn GPS toggle off" since now is a Choice based upon Network Safety.

## 3. MaxMind minFraud edge function (stub-ready)

- New edge function `maxmind-minfraud/index.ts`:
  - Reads `MAXMIND_ACCOUNT_ID` + `MAXMIND_LICENSE_KEY` from secrets.
  - If either missing → returns `{ configured: false }` and the client falls back to **FingerprintJS Pro Smart Signals only** (already implemented in `vpnDetection.ts`).
  - When configured → POSTs the caller's IP to `https://minfraud.maxmind.com/minfraud/v2.0/score`, returns `{ riskScore, ipRisk, isVpn, isHostingProvider }`.
- Client logic in the IP branch of the entrance card:
  1. Call `maxmind-minfraud`. If `configured && (isVpn || isHostingProvider || riskScore > threshold)` → block.
  2. Else call FingerprintJS Pro signals. If vpn/proxy/tor/relay → block.
  3. Else → pass.
- Don't ask for the MaxMind secret yet (user said "I don't own it but eventually"). The function is shipped disabled and will start working the moment `secrets--add_secret` is run.

## 4. Slim `vpnDetection.ts` accordingly

- Delete the `VpnGuard`-driven Cloudflare polling loop call sites.
- Keep `fetchIpInfo()` (used by the card to display ASN/country) but stop the 60s background re-checks.
- The local datacenter ASN substring blocklist stays as an escalation signal in the IP branch.

## 5. Minor visual changes

- **Sidebar collapsed logo** (`src/components/AppSidebar.tsx` line 30): replace the 🔬 emoji with a circular crop of `user-uploads://Emerald_Anarchy.jpg` representing the "A" of AddLogic.
  - Copy upload to `src/assets/addlogic-mark.jpg`, render as `<img class="h-7 w-7 rounded-full object-cover" />` centered on the anarchy "A".
- **Tiers page** (`src/pages/Tiers.tsx` line 223): remove the 🧠 emoji from "🧠 AI-derived sub-interests (from your searches):" → "AI-derived sub-interests (from your searches):".
- **PLOS card** (`src/components/PlosCard.tsx`):
  - Make the logo smaller — change `p-4` to e.g. `max-w-[180px] mx-auto p-3`.
  - Change the Background of the Logo in Ivory token: add `--ivory: 60 29% 94%;` 

## 6. Memory update

Update `mem://index.md` Core to reflect: "VPN/proxy gating happens once at the post-login entrance card; precise GPS bypasses the IP fraud check, IP-approximate path goes through MaxMind minFraud (when configured) + FingerprintJS Pro signals." Remove the old "VpnGuard at the App root hard-blocks everything" line.

## Files touched

- `src/App.tsx` — drop `<VpnGuard>`.
- `src/components/AppLayout.tsx` — drop `VpnConsentSlide` + `useVpnDetector`.
- New `src/components/PostLoginGate.tsx` — wraps protected routes, mounts `GeoConsentSlide`.
- `src/components/GeoConsentSlide.tsx` — copy tweaks, IP branch calls MaxMind first then FingerprintJS, blocks on fail.
- `src/lib/vpnDetection.ts` — add `verifyIpForApproximateLocation()` helper.
- New `supabase/functions/maxmind-minfraud/index.ts` (graceful no-op until secrets exist).
- `src/components/AppSidebar.tsx` — emoji → image.
- `src/assets/addlogic-mark.jpg` (copied from upload).
- `src/pages/Tiers.tsx` — drop 🧠.
- `src/components/PlosCard.tsx` — smaller logo + ivory PLOS overlay.
- `src/index.css` — add `--ivory` token.
- `mem://index.md` — update Core.

## Open question

When the IP branch fails verification, should the user be **fully locked out** (must disable VPN, no app access), or **allowed in low-trust mode** (no rewards multiplier, like today's GPS↔IP mismatch)? Default in this plan: **fully locked out**, since you said "reduce fraud risk to approximately zero". Tell me if you'd rather keep low-trust as a soft fallback.

**Zero** Trust, user just need to Deactivate VPN.