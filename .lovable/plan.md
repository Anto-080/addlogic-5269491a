# Two critical fixes: VPN hard-block & OpenAlex PDF opt-out

## 1. VPN / Proxy hard-block (app-wide, not just the GPS slide)

**Current behavior (broken):**
- VPN detection runs only inside `GeoConsentSlide`, which only opens when the user toggles GPS on.
- A detected VPN merely shows a yellow "low-trust mode" warning — the user keeps full access.
- Users on a VPN with the GPS toggle OFF are never even checked.

**New behavior:**
The VPN/proxy check becomes a **mandatory app-wide gate**, independent of GPS or cookie toggles. A user with a suspected VPN/datacenter ASN cannot use the app until they disconnect.

### What to build

**New file: `src/components/VpnGuard.tsx`** — a full-screen blocking overlay.
- On mount: call `fetchIpInfo()` and `getVisitorId()` in parallel.
- Decision:
  - `vpn_suspected === true` → show **block screen**.
  - Network/lookup error → soft warn but allow (avoid breaking offline users); retry button.
- Block screen UI (matches existing dark/amber theme):
  - `ShieldAlert` icon, title "Unusual traffic detected".
  - Body: "We've detected your connection is routed through a VPN, proxy, or datacenter network ({org/ASN}). To protect the reward pool from bot farms, ResearchRewards is unavailable on these connections. Please disable your VPN/proxy and reload."
  - Shows the detected ASN/org and visitor fingerprint (small mono).
  - Buttons: **"Re-check connection"** (re-runs `fetchIpInfo`, no caching) and **"Sign out"**.
  - No "continue anyway" / no dismiss.
- Persist the block event to `device_telemetry` (set `vpn_suspected = true`, `asn`, `fingerprint`) when the user is authenticated, so admins can see attempts.
- Cache the **passing** result in memory for the session (avoid hammering ipapi.co); never cache a fail (force re-check).

**Mount point: `src/components/AppLayout.tsx`** — wrap `<main>` content. The guard renders nothing when the IP is clean, so authenticated routes work as before. We mount it inside `AppLayout` so public auth pages remain reachable (a blocked user can still sign out).

**Strengthen `src/lib/vpnDetection.ts`:**
- Add a few more well-known VPN/proxy/hosting tokens currently missing (e.g. `cloudflare warp`, `mullvad`, `oracle cloud`, `ibm cloud`, `gcore`, `quadranet`, `colocrossing`, `worldstream`, `serverius`).
- Add a second free signal: treat `j.proxy === true`, `j.hosting === true`, or `j.security?.vpn === true` as suspect when ipapi.co returns them.
- Export an explicit `evaluateBlock(info: IpInfo | null): { block: boolean; reason: string | null }` so `VpnGuard` and `GeoConsentSlide` share one source of truth.

**Update `GeoConsentSlide`:**
- Remove the "low-trust mode, continue anyway" path for VPN cases — if `VpnGuard` is in front, the slide will never see a VPN user. Keep only the GPS↔IP country mismatch warning here (that one stays soft).

**Memory note:** add a project rule that VPN/proxy/datacenter IPs are blocked app-wide regardless of toggles.

## 2. OpenAlex PDF opt-out

**Current behavior (broken):** "Open paper" picks `open_access_url` first, which OpenAlex frequently returns as a direct `.pdf`. PDFs open in the device's native viewer (or Chrome's PDF handler), leaving our in-app browser and breaking the polling/chronology system.

**New behavior:** never serve a PDF link from OpenAlex. Always route users to an HTML landing page so the in-app outbound browser can track dwell time.

### What to change

**`src/hooks/useOpenAlex.ts`:**
- Add a small helper `isPdfLike(url)` — true if URL ends in `.pdf` (case-insensitive, ignoring query string) or contains `/pdf/` segment.
- When mapping each work, **drop** `open_access_url` if it's PDF-like; **drop** `landing_page_url` if it's PDF-like.
- New computed field `safe_url: string | null` = first non-PDF candidate among:
  1. `landing_page_url` (HTML)
  2. `open_access_url` (HTML)
  3. `https://doi.org/<doi>` (always HTML — DOI resolves to publisher's landing page)
  4. The OpenAlex work page itself: `https://openalex.org/<workId>` (guaranteed HTML fallback).
- Add OpenAlex API filters to reduce PDF results upstream: append `&filter=has_doi:true` to the query so works without a DOI (often pure PDF preprints) drop out.

**`src/components/OpenAlexFeed.tsx`:**
- Replace the inline URL-picking logic with `w.safe_url`.
- Disable the "Open paper" button only when `safe_url` is null (extremely rare now).
- Add a tiny info hint under the feed header: "Opens in the in-app browser — PDFs are filtered out so your session keeps tracking."

No DB or edge-function changes required for either fix.

## Technical summary
- Files created: `src/components/VpnGuard.tsx`
- Files edited: `src/components/AppLayout.tsx`, `src/lib/vpnDetection.ts`, `src/components/GeoConsentSlide.tsx`, `src/hooks/useOpenAlex.ts`, `src/components/OpenAlexFeed.tsx`
- Memory: append VPN-block invariant to `mem://index.md` Core
