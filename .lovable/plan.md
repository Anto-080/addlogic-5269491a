Three independent workstreams. They can ship in one phase, but I'll group them so each can be reviewed/reverted on its own.

---

## Phase 1 — Kill Opera + Firecrawl, switch search to DuckDuckGo

**Why:** Opera WebView was iframe-embedded, which every browser blocks via `X-Frame-Options`. Firecrawl was used as a server-side search wrapper but isn't returning what we need. DuckDuckGo offers two free, no-key endpoints we can actually use:

- **DuckDuckGo Instant Answer API** — `https://api.duckduckgo.com/?q=...&format=json` (used for Tier "news feed" landing).
- **DuckDuckGo HTML results** — `https://html.duckduckgo.com/html/?q=...` (parsed server-side for general search results, since DDG has no public results JSON API). Server-side parsing avoids CORS and the same iframe-blocking problem.

**Changes:**
- Replace `supabase/functions/web-search/index.ts`: remove Firecrawl, fetch `html.duckduckgo.com/html/?q=...`, parse result anchors + snippets with a small regex/HTML walker, return the same `{title, url, snippet, source}` shape so `SearchResults.tsx` keeps working unchanged.
- Delete the Firecrawl connector usage in code (the secret stays linked at the workspace level — harmless).
- Rename and rebrand the picker: `BrowserPicker.tsx` → DuckDuckGo branding (replace `OperaLogo` import with a DuckDuckGo-style mark, drop "Powered by Opera WebView" copy and the "Opera default" row). Keep the same gating (Level 25 / `force_opera_search` flag — we can rename the flag later).
- Delete `src/lib/operaWebView.ts` and any reference (`@capacitor/browser` Opera intent path).
- In `Research.tsx` change `engineName: "Opera WebView"` → `"DuckDuckGo"` and the page subtitle.
- `InAppBrowser.tsx`: when a result is opened, target DuckDuckGo (same iframe pattern still won't work for arbitrary sites — we'll keep the existing "open in new tab" fallback the component already has).

**Removed files:** `src/lib/operaWebView.ts`, Opera logo references.
**Anthropic stays untouched** (used by `curate-news`).

---

## Phase 2 — Geolocation rewrite + two mandatory consent slides

### 2a. Geolocation
The current GPS toggle calls `requestWebGeolocation()` then `persistTelemetry`. The error you're seeing is from the browser permission flow + the telemetry insert. Fix:

- Rewrite `src/lib/webGeolocation.ts` to a clean wrapper around the standard **Geolocation API** (`navigator.geolocation.getCurrentPosition` with a 10s timeout, `enableHighAccuracy:false` for coarse coords) plus an **IP-fallback** via `https://ipapi.co/json/` (no key, returns `latitude`/`longitude`/`city`/`country`) when the browser permission is denied or times out.
- Strip the "snapshotDeviceProfile + persistTelemetry" call out of `Dashboard.handleGpsToggle` — that's the path that errors. Telemetry persist becomes a separate `useEffect` that runs only after the consent slide (2c below) is confirmed.
- Surface clean errors via toast (no stack noise).

### 2b. AdBlock-detection consent slide (after Cookie toggle ON)
- New full-screen modal `src/components/AdBlockConsentSlide.tsx`. Triggered when `cookieAutoAccept` flips to `true` and AdBlock is detected. Cannot be dismissed until adblock is OFF.
- Detection method: bait technique — render a hidden `<div class="adsbox ad-banner ads">` plus a fetch to a known ad-bait URL (`https://pagead2.googlesyndication.com/pagead/show_ads.js`). If the element has `offsetHeight === 0` after mount OR the fetch fails with a network error, adblock is active. Implemented as a small hook `src/hooks/useAdBlockDetector.ts`. Re-checks every 3s while the slide is open so it auto-closes when the user disables it.
- Slide copy: "~60% of ads are blocked by AdBlock services — that money never reaches you. Disable AdBlock for this site or whitelist us to continue earning."
- Persist a "user dismissed once they whitelisted" flag in localStorage so we don't nag on every cookie toggle.

### 2c. Geolocation consent slide (after GPS toggle ON)
- New full-screen modal `src/components/GeoConsentSlide.tsx`. Triggered when user flips GPS toggle ON. Cannot be dismissed until either:
  1. `navigator.geolocation.getCurrentPosition` resolves with coords, **or**
  2. IP fallback returns coords.
- Slide copy: explicit consent for "geolocation + non-PII signals (timezone, locale, screen, hardware tier, network type)".
- On confirm, call `persistTelemetry(user.id, coords, snapshotDeviceProfile())` from inside the slide (not from the toggle handler — fixes the current error).
- If browser permission is `denied`, show the OS/browser-level instructions inline (already drafted in current Dashboard) and offer "Use approximate location (IP)" button which runs the IP fallback.

Both slides reuse the same shadcn `Dialog` primitive in `fullscreen` style we used previously.

---

## Phase 3 — OpenAlex inside "Priority Research" + DuckDuckGo handoff

**OpenAlex** = free scholarly metadata API, no key. Endpoint: `https://api.openalex.org/works?search=<subcategory>&per-page=5&sort=relevance_score:desc`.

**Changes in `src/pages/Tiers.tsx`:**
- Inside the silver-framed "Priority Research" block (top 3 tiers), when a tier expands, fetch OpenAlex results for that tier's subcategories. Add a new component `src/components/OpenAlexFeed.tsx`:
  - Tabs/chips of the tier's subcategories.
  - On chip click → fetch OpenAlex `/works?search=<subcategory>` and render top 5 (title, host venue, year, OA link).
  - Each result has two buttons:
    - **Open paper** → opens OpenAlex `primary_location.landing_page_url` in `InAppBrowser`.
    - **Browse this topic** → opens DuckDuckGo news feed `https://duckduckgo.com/?q=<subcategory>+<tier name>&ia=news` in `InAppBrowser`.
  - A "Browse all news on this field" CTA at the chip level → same DuckDuckGo news handoff without a specific paper.
- New hook `src/hooks/useOpenAlex.ts` (React Query, 1h staleTime, cached per `subcategory`).
- No edge function needed — OpenAlex allows direct browser CORS calls. Add a polite `mailto=` query param ("`mailto=research@addlogic.app`") per their etiquette guide.
- Anthropic AI hook-up for "smart article fetching from selected interest" deferred per your instruction.

---

## Technical summary

| Area | Tool | Notes |
|------|------|-------|
| Search | `supabase/functions/web-search/index.ts` rewritten to scrape DDG HTML | No key; returns same shape so UI is untouched |
| Geolocation | `navigator.geolocation` + `ipapi.co` fallback | Clean error handling, telemetry moved into consent slide |
| AdBlock detect | bait DOM + bait fetch in `useAdBlockDetector` | No external API needed; this is the standard reliable approach |
| OpenAlex | direct `fetch('https://api.openalex.org/works?...')` | Free, no key, browser-CORS-friendly |

**Files created:** `src/components/AdBlockConsentSlide.tsx`, `src/components/GeoConsentSlide.tsx`, `src/components/OpenAlexFeed.tsx`, `src/hooks/useAdBlockDetector.ts`, `src/hooks/useOpenAlex.ts`.

**Files edited:** `src/components/BrowserPicker.tsx`, `src/pages/Research.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Tiers.tsx`, `src/lib/webGeolocation.ts`, `src/contexts/SettingsContext.tsx`, `supabase/functions/web-search/index.ts`.

**Files deleted:** `src/lib/operaWebView.ts`.

**No DB migrations needed.**

Confirm and I'll do all three phases in one pass (they don't depend on each other and the file overlap is small).