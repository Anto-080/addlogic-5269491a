## Overview

This is a large multi-part overhaul. To keep changes auditable, I'll deliver it in **4 phases**. Each phase compiles and is usable on its own.

---

## Phase 1 — Remove Admin & rewire toggles

### Remove Admin page

- Delete `src/pages/Admin.tsx`, `src/hooks/useAdmin.ts`, `src/hooks/useAdminFlags.ts`.
- Strip `<Route path="/admin">` from `src/App.tsx`.
- Remove the Admin sidebar entry + `useIsAdmin` import in `src/components/AppSidebar.tsx`.
- In `BrowserPicker.tsx`, drop `useAdminFlags` and the `force_opera_search` bypass — gating is purely level-based.
- Drop the Admin migration and `admin_feature_flags` table reads from any remaining file. (Table itself is left in DB; cheap and harmless. Removing it is a separate destructive op.)

### Cookie toggle — make it real

Today the cookie row only writes `localStorage` and reads `document.referrer`. The user wants:

- Read **all** cookies the page can see (first + same-site third-party set in this origin via `document.cookie`).
- **Generate zero-party cookies** = a structured `rr.zeroParty` cookie containing { topInterestTiers, totalSearches, lastTier, perTierSeconds }.
- Drive **tier-level Experience bars** that grow per second of research on each tier.

New file `src/lib/zeroPartyCookies.ts`:

- `readAllCookies()` returns `Record<string,string>` parsed from `document.cookie`.
- `bumpInterestSignal(tierId, seconds)` updates an in-memory + cookie-backed counter `{ perTier: { [id]: seconds }, multipliers: { [id]: number } }` keyed by tier.
- `applyMultiplierBumps()` — every 8 cumulative hours of seconds on a tier, increment that tier's multiplier by +1, there is no cap to this is to express user level of Experience in a Field, each Bar Level is 10000 points and is of Different Gradient of Emerald Green going from Pale Pea Green for Adult Content to Deep Emerald for Top Tier Interests. Levels are Expressed at the Side of the Bar in Golden.

The existing `userInterestProfiler.ts` is upgraded to also consume `readAllCookies()` keys/values as haystack tokens.

### GPS toggle — fix functionality

The slide already works; what fails is:

- The slide opens but on cancel/close the toggle stays "on visually" because `setGpsPrecision(true)` is fired up-front in some flows. We move the `setGpsPrecision(true)` call into the `onSatisfied` callback only (after coords arrive). `onCancel` flips it false explicitly.
- Persisted multipliers won't resync on reload because `SettingsContext` snapshots only when `gpsPrecision` flips. We add a one-time `useEffect` that re-runs `snapshotDeviceProfile` when `user` becomes available with `gpsPrecision === true`.
- Errors thrown from `persistTelemetry` are swallowed silently when Supabase row exists. We catch + toast once, then suppress duplicates within 60s.

---

## Phase 2 — Tier-level Experience bars + bot/VPN guards

### Per-tier ExperienceBar

Currently `ExperienceBar` uses a single global `user_stats.xp` row. The user wants **one bar per tier**, visible when a tier card is expanded in `Tiers.tsx`, above the subcategories.

Approach: keep `user_stats` for global level, but add a new client-side store for per-tier seconds:

- New table `tier_progress` (migration): `(user_id uuid, tier_id int, seconds_active bigint, multiplier_bonus int default 0, updated_at timestamptz, PK(user_id, tier_id))` with RLS "users read/write own".
- New hook `useTierProgress(tierId)` + `useUpdateTierProgress` mirroring `useUserStats`.
- New component `TierExperienceBar` (lighter version of `ExperienceBar`) that:
  - Increments 1s when the Interest and Subcategories of the Tier are being Actively Researched. **For Now:** By Tapping the Newly Open Tab which was Open throughout our InApp Search Results Link and Seeing if it is Active with a PinBack feed every 30s
  - Multiplier formula: `base = tier.multiplier; bonus = floor(secondsActive / 28800); active = base + bonus + consentBonus()`.
  - Renders: green XP fluid bar with label `Tier XP · Lv {floor(seconds/3600)+1}` + crimson multiplier bar `x{active}` with no cap marker since is a Lifetime Field Experience Bar.
- Mounted in `Tiers.tsx` inside the `isOpen && (...)` block, above the subcategories chips/`OpenAlexFeed`.
  &nbsp;

### Fingerprint API for real-user check

- Use the open-source `@fingerprintjs/fingerprintjs` (free, runs fully client-side, no key). Identifies device via canvas/audio/screen hash. NOT the paid Pro version (which would require an API key).
- New hook `useDeviceFingerprint()` returns a stable `visitorId`. Stored alongside `tier_progress` writes so the server can later flag VPN-rotation farms (multiple visitorIds → same user_id in 1 hour).

### Cloudflare Turnstile invisible (background) check

- Turnstile invisible mode requires **two keys** from the user: a site key (public, hardcoded after they paste it) and a secret key (stored in Lovable Cloud secrets). Used to verify scroll/click events are human via a server-side challenge.
- Frontend: load Turnstile script, render an invisible widget on `Research.tsx` and the Tiers detail view; emits a token every ~5min and on suspicious spike (e.g. >20 clicks/sec).
- New edge function `verify-turnstile` that POSTs the token to Cloudflare's `siteverify` endpoint. Returns `{ ok, score }`. Caller throttles XP accumulation when `ok === false` (multiplier × 0).
- **I'll need to ask the user for their Turnstile site key + secret key before deploying this part.** If they don't have an account I'll instruct them through cloudflare.com → Turnstile → "Add a site" (Invisible mode).

---

## Phase 3 — Outbound redirect + interstitials + 1-time star rating

### Force external browser on outbound clicks

Today `InAppBrowser.tsx` iframes the URL and only escapes externally when blocked. New behavior: every result click in `BrowserPicker`, `Research` live news, and the Information Desk goes through a single helper:

`src/lib/outboundExit.ts` exports `openExternal(url, tierId, sponsorId?)`:

1. Records `outbound_visits` row `(user_id, url, tier_id, sponsor_id, opened_at, returned_at?)` with RLS own-row.
2. Shows the new `<ExitInterstitial>` overlay (full-screen).
3. On overlay confirm, `window.open(url, "_blank", "noopener,noreferrer")` + records `opened_at`.
4. When the tab regains visibility (`document.visibilitychange → visible`), writes `returned_at`. Difference = "outside-app dwell" per topic = a new analytics signal that feeds the per-tier multiplier with the First Parties Cookies for Chronology (which we Also Can check from the InApp Search Bar and Confirm with the Chronological History Cookies from Google Login Token Request) and Cookies for Time Past on the Outbound Site through the PinBack Feedback for Activity of the Open Tabs

`InAppBrowser.tsx` is gutted from being the default; it stays only as the "blocked-iframe fallback" preview path, but we delete the auto-iframe attempt for outbound URLs.

### `<ExitInterstitial>` component

- Full-screen card with: native ad slot (see below), 5-second countdown, then the **per-sponsor star rating** (only shown the first time per sponsor — see persistence below), then a "Continue to {host}" CTA.
- Mandatory ad-open before the button enables (mirrors the existing Ad gate logic from `InAppBrowser`).

### Star rating — one per sponsor (not per click)

- New table `sponsor_ratings (user_id uuid, sponsor_id text, stars int, rated_at timestamptz, PK(user_id, sponsor_id))` with RLS own-row.
- Frontend hook `useSponsorRating(sponsorId)` returns `{ rated: boolean, stars?: number }`. The `<ExitInterstitial>` only renders the rating widget when `rated === false`. Submit writes the row, future exits skip the widget.

### Per-tier native ad fetcher

- New edge function `native-ad-for-tier` returning a synthetic ad payload `{ id, sponsorId, title, body, ctaUrl, image, tierId, multiplier }`. For now sourced from a curated JSON list (no real ad-network integration in this phase). Driven by:
  - the tierId currently being researched, AND
  - the user's `rr.zeroParty.topInterestTiers` (zero-party signal).
- New component `<NativeAdSlot tierId>` reads the function, renders a sponsor card. Used in: the `ExitInterstitial`, top of `Research.tsx`, and the dashboard Daily Desk.

---

## Phase 4 — Outside-app research chronology

- Powered by the `outbound_visits` table from Phase 3.
- New page section on the Dashboard ("Research chronology") and a tier-scoped one in the Tiers expanded card: list of `{ host, opened_at, dwell_minutes, tier }` for the last 30 days.
- New hook `useResearchChronology(tierId?)` selecting from `outbound_visits` ordered by opened_at desc.
- The dwell time also drives a small overlay multiplier on the tier ExperienceBar from Phase 2 (already wired there).

---

## Files

**Created**

- `src/lib/zeroPartyCookies.ts`
- `src/lib/outboundExit.ts`
- `src/components/TierExperienceBar.tsx`
- `src/components/ExitInterstitial.tsx`
- `src/components/NativeAdSlot.tsx`
- `src/hooks/useTierProgress.ts`
- `src/hooks/useDeviceFingerprint.ts`
- `src/hooks/useSponsorRating.ts`
- `src/hooks/useResearchChronology.ts`
- `supabase/functions/native-ad-for-tier/index.ts`
- `supabase/functions/verify-turnstile/index.ts`
- 1 migration: `tier_progress`, `outbound_visits`, `sponsor_ratings` tables + RLS

**Edited**

- `src/App.tsx` (drop /admin)
- `src/components/AppSidebar.tsx` (drop Admin)
- `src/components/BrowserPicker.tsx` (drop admin flags, route through `openExternal`)
- `src/pages/Dashboard.tsx` (cookie copy fix, chronology section, GeoSlide cancel fix)
- `src/pages/Research.tsx` (replace `InAppBrowser` opens with `openExternal`; wire NativeAdSlot)
- `src/pages/Tiers.tsx` (mount `TierExperienceBar` above subcategories in expanded state)
- `src/contexts/SettingsContext.tsx` (zero-party reader, dedupe telemetry persistence)
- `src/components/GeoConsentSlide.tsx` (move `setGpsPrecision(true)` to onSatisfied)
- `src/lib/userInterestProfiler.ts` (consume cookie haystack)
- `src/components/InAppBrowser.tsx` (kept as last-resort fallback only)

**Deleted**

- `src/pages/Admin.tsx`, `src/hooks/useAdmin.ts`, `src/hooks/useAdminFlags.ts`

**Dependencies added**

- `@fingerprintjs/fingerprintjs` (open-source, no key needed)

---

## Things I need from you before Phase 2 ships

1. **Cloudflare Turnstile keys** — I'll request the secret via `add_secret` once we reach Phase 2. If you don't have an account yet, sign up free at cloudflare.com → Turnstile → "Add site" → mode **Invisible**, then paste both keys.
2. Confirm phasing: I can deliver all 4 phases back-to-back in a single approval, OR pause for review after Phase 1 and Phase 2. Default plan is **all 4 in one go**, with the Turnstile secret request inserted mid-stream.

Awaiting approval to proceed.