## Three-Step Restructure of Research Page + Security Layer

### Step 1 — Cloudflare Turnstile + FingerprintJS as primary VPN/abuse layer (Abstract paused, NOT removed)

Goal: shift the hard-block decision off Abstract API (which is burning the free quota) onto a Cloudflare-based check + FingerprintJS, while keeping the exact same UX (full-screen VPN block, full-screen AdBlock block).

Backend
- New edge function `cloudflare-ip-check` that calls Cloudflare's IP intel / Radar (using the user's CF token stored as secret `CLOUDFLARE_API_TOKEN`) and returns the same payload shape Abstract returns today: `{ ip, country_code, country_name, asn, org, vpn_suspected, reason }`.
  - Reads `CF-Connecting-IP` / `x-forwarded-for`.
  - Flags `vpn_suspected = true` when Cloudflare returns `is_anonymizer`, `is_proxy`, `is_hosting`, `threat_score >= 30`, or matches our existing local datacenter ASN list.
- The existing `ip-intelligence` (Abstract) edge function is **kept on disk** but no longer invoked from the client — it stays callable for emergency fallback / debugging.

Client
- `src/lib/vpnDetection.ts`: switch `callAbstract()` → `callCloudflare()` invoking the new function. Same `IpVerdict` shape, same cache, same local-blocklist escalation. Comments updated to say "Cloudflare is now the primary verdict source; Abstract is paused but retained."
- `VpnGuard` and `useVpnDetector` are unchanged in behavior — they still consume `fetchIpVerdict()`. Full-screen block stays identical.
- Re-activate FingerprintJS as a second-factor: if Cloudflare returns "ok" but the same `visitorId` has been seen tied to a previously blocked IP (stored in `device_telemetry`), escalate to "blocked" with reason `"Fingerprint linked to previously flagged device"`.
- Geolocation API: re-enabled inside the Cloudflare path only when Cloudflare's response is missing `country_code` — used as a sanity cross-check via the existing `reverseGeocodeCountry()` helper. No new UI.
- AdBlock full-screen ban is untouched (`useAdBlockDetector` keeps its current behavior).

Secrets
- Request `CLOUDFLARE_API_TOKEN` via `secrets--add_secret` before deploying the new function.

### Step 2 — PLOS banner + LinkedIn block + collapsible PLOS search

New card placed right under the page heading on `/research`:

```text
┌────────────────────────────────────────────────┐
│  [PLOS banner image]            ⟩PLOS  →       │  ← image + "⟩PLOS" link to plos.org
├────────────────────────────────────────────────┤
│  Connect with LinkedIn — For Biochemical       │
│  Researchers Only             [Connect ▸]      │
├────────────────────────────────────────────────┤
│  ▸ Search PLOS articles  (collapsible)         │
│      [ search input ] [ Search ]               │
│      • result 1                                │
│      • result 2 …                              │
└────────────────────────────────────────────────┘
```

Files
- `src/assets/plos-logo.png` — already copied from upload, used as the banner image.
- `src/components/PlosCard.tsx` — new component:
  - Renders the banner image, a small "⟩PLOS" link (`https://plos.org`, opens in in-app browser via `useOutboundExit`).
  - LinkedIn block (moved out of `BrowserPicker.linkedInSlot`).
  - `<Collapsible>` (already in project: `src/components/ui/collapsible.tsx`) wrapping a PLOS search bar.
- `src/hooks/usePlosSearch.ts` — `useMutation` calling a new edge function `plos-search` that hits PLOS's public Solr endpoint `https://api.plos.org/search?q=...&fl=id,title,journal,publication_date,abstract&wt=json&rows=8`. No key required. Returns `{ id, title, journal, date, url }[]` with `url = https://journals.plos.org/plosone/article?id=<doi>`.
- `src/pages/Research.tsx` — render `<PlosCard />` and remove the `linkedInSlot` from `BrowserPicker`.

### Step 3 — Cleanup of OpenAlex / DuckDuckGo / Tier system

A. Tier filter chips (the row currently above the OpenAlex card)
- Remove the `"All"` chip entirely.
- Default `selectedTier` to `4` (instead of `null`) so the multiplier logic always has a concrete tier.
- Drop all `selectedTier === null` branches in `Research.tsx` (`baseForBar`, `activeMultiplier`, `filteredArticles` filter, `handleFetchLive` fallback) — they were the source of the "All gives infinite multiplier" bug.

B. Move DuckDuckGo `BrowserPicker` into the XP/Tiers card
- The XP card (the one currently rendering `<ExperienceBar />` + tier chip row) becomes one card containing, in order:
  1. ExperienceBar
  2. The XP/Crimson explanatory paragraph
  3. Tier chips row (no "All")
  4. `<BrowserPicker />` (no longer renders LinkedIn slot, no longer renders the "Searches are fetched server-side…" paragraph)

C. `BrowserPicker.tsx` cleanup
- Delete the paragraph: *"Searches are fetched server-side through the DuckDuckGo HTML endpoint…"* (per user request).
- Remove the `linkedInSlot` prop entirely (now lives in `PlosCard`).
- Keep DuckDuckGo logo header and the classifier/results UI.

D. OpenAlex card
- Add the OpenAlex logo (`src/assets/openalex-logo.png`) as a small header above the existing `OpenAlexFeed` card.
- Keep the card position (below the LinkedIn-only PLOS card) and visible to everyone.

E. HuggingFace classifier → personalised subcategories (Zero-Party data)
- Already wired: `useClassifyInterest` returns `tierId` + `tierName`, and `persistKeywords()` writes to `tier_keywords`. Today the active session pulse drives the multiplier — keep that.
- New behavior in `BrowserPicker.runSearch`:
  - On a confident classification (`confidence >= MIN_TIER_CONFIDENCE`):
    - Auto-select that tier in the parent (lift state via a new `onTierClassified?: (tierId: number) => void` prop wired from `Research.tsx` to `setSelectedTier`). This makes the chip row visually reflect the detected tier and feeds the OpenAlex feed below with the right subcategories.
    - Persist the extracted keywords as before (already does this) — these become the user's personalised subcategories surfaced on their per-tier Tiers page.
- On `src/pages/Tiers.tsx`: read `tier_keywords` for the current user and show them as a "Your personalised sub-interests" chip row inside each tier's detail panel. (Read-only display; no schema change — the table already exists.)

### Result (top → bottom of `/research`)

```text
H1 + tagline
─────────────────────────────────────
PLOS banner card
  ├ [banner image]  ⟩PLOS link
  ├ LinkedIn — Biochemical only
  └ ▸ Collapsible PLOS search
─────────────────────────────────────
XP / Tiers / DuckDuckGo card
  ├ ExperienceBar
  ├ XP + Crimson explainer
  ├ Tier chips (no "All")
  └ DuckDuckGo BrowserPicker
─────────────────────────────────────
[OpenAlex logo]
OpenAlex scholarly feed card
─────────────────────────────────────
Live news from Claude card
─────────────────────────────────────
Article list
```

### Technical notes

- New edge functions: `cloudflare-ip-check`, `plos-search` (both with `verify_jwt = false` since they're called pre-auth / publicly).
- New secret: `CLOUDFLARE_API_TOKEN` (requested via add_secret tool before code lands).
- Files added: `src/components/PlosCard.tsx`, `src/hooks/usePlosSearch.ts`, `src/assets/plos-logo.png`, `src/assets/openalex-logo.png`, two edge functions.
- Files edited: `src/pages/Research.tsx`, `src/pages/Tiers.tsx`, `src/components/BrowserPicker.tsx`, `src/components/OpenAlexFeed.tsx`, `src/lib/vpnDetection.ts`, `src/components/VpnGuard.tsx` (minor — fingerprint escalation only).
- Files untouched: `useAdBlockDetector`, `AdBlockConsentSlide`, `VpnConsentSlide` UX, `ip-intelligence` edge function (paused but retained).
