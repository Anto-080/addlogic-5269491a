# Data Consensus card — collapse text + add 3rd toggle

## Goal
On the Dashboard "Data permissions" card:
1. Rename header to **Data Consensus**, add a single‑click chevron next to it that collapses/expands ALL descriptive text.
2. When collapsed, only the toggle rows remain (icon + title + ×multiplier chip + switch + save lock).
3. Split today's combined row into two independent toggles, so the card now has **three** consents:
   - **Cookies Acceptance & Profile Sync** — ×1.5
   - **Non‑PII Data Analytical Consensus** — ×2  *(new)*
   - **GPS Location Retrieval** — ×5  *(separated)*

## UI changes — `src/pages/Dashboard.tsx`
- Wrap the card body in a `Collapsible` controlled by new state `descriptionsOpen` (default `true`).
- Header row: rename "Data permissions" → "Data Consensus"; right‑side `CollapsibleTrigger` is a chevron button (`ChevronDown`/`ChevronUp`, no extra text, aria‑expanded).
- All `<p>` paragraphs (card subtitle, per‑row description, "Required permission · active/inactive", cookie live counters, denied‑permission hint) move inside `CollapsibleContent` slots local to each row, so the collapse hides them everywhere at once.
- The toggle rows themselves (icon + title line with ×N chip + Switch + save lock) stay outside the collapsible and remain visible.
- Cookie ×2 chip → ×1.5. Add the new Analytics row between Cookies and GPS with chip ×2; GPS row keeps ×5.
- GPS row description text becomes exactly: *"Allow GPS Location Retrieval Regional Offers & Proximity Users Affinity Available Only when this Feature is Activated."*
- Analytics row description: *"Generate Non‑Personal (Non‑PII) Anonymous Data from your research for commercial analytical purposes — unlocks higher‑retribution targeted offers on your researched interests."*
- Regional Coupons panel stays gated on `gpsPrecision`.

## State / wiring — `src/contexts/SettingsContext.tsx`
- Add `analyticsConsent: boolean` + `setAnalyticsConsent` + `analyticsLocked` + `setAnalyticsLocked`, following the same localStorage lock pattern (`rr.analyticsLocked`, `rr.analyticsConsent.remembered`).
- Update bonus constants: `COOKIE_BONUS = 1.5`, add `ANALYTICS_BONUS = 2`, `GPS_BONUS = 5` (unchanged).
- `consentBonus(cookies, analytics, gps)` → sums the three; update its single caller in `TierExperienceBar.tsx`.
- Mirror the new flag into `profiles.preferences` JSON as `analytics` / `analytics_locked` alongside today's `cookies` / `gps`.
- `deriveInterestTiers` gate (`userInterestProfiler.ts`) keeps requiring cookies + gps (no change), since GPS data is the geographic signal.

## Handler
- New `handleAnalyticsToggle(v)` — pure setter, no slide (no browser permission needed).
- GPS toggle keeps opening `GeoConsentSlide` exactly as today.

## Files touched
- `src/pages/Dashboard.tsx` — header rename, chevron, collapsible wrap, new row, chip values.
- `src/contexts/SettingsContext.tsx` — new flag, new bonus constant, updated `consentBonus`.
- `src/components/TierExperienceBar.tsx` — pass the third arg to `consentBonus`.

## Out of scope
- No DB schema change (preferences is JSON).
- No server multiplier formula change (Mistral classifier remains the sole writer of `current_multiplier`; the bonus constants only affect the on‑screen `TierExperienceBar` overlay, matching current behavior).
- No memory file update needed unless you want me to record the 1.5 / 2 / 5 split.
