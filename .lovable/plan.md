# Research page rework + softer tier palette

## 1. OpenAlex: show user-discovered subcategories
**File:** `src/components/OpenAlexFeed.tsx`

- Add new prop `tierId: number` (passed from `Research.tsx`).
- Read `useTierKeywords().subcategories[tierId]` — the Mistral-derived, count-ranked subcategories from the user's own past queries.
- Render a **second chip row** under the existing static subcategory row, labelled `Most-researched by you · sub-interests`, with a small Mistral "M" mark.
  - Empty state: muted hint "Run a search to grow this list."
  - Each chip behaves exactly like an existing subcategory chip (sets `active`, triggers OpenAlex query for `${chip} ${tierName}`, calls `lockInterest`).
  - Top 8, ordered by count desc; show count as a faint badge.
- Keep the existing static `subcategories` row above (labelled `Default sub-interests`) so the user can fall back.

## 2. Tier icons on Research page become indicative-only
**File:** `src/pages/Research.tsx`

- The horizontal tier row (`TIERS.map` → `<Button>`) is replaced with a non-interactive strip: render as `<div>`/`<span>` chips, `cursor-default`, no `onClick`, no selected-state toggling.
- Current selected tier is driven **only** by Mistral classification (`onTierClassified` from `BrowserPicker` and from `OpenAlexFeed` searches). Add an `onTierClassified` callback to `OpenAlexFeed` too and wire it.
- Highlight the chip whose id matches `selectedTier` so users still see what's active.
- Pass `tierId={selectedTier}` into `<OpenAlexFeed>`.

## 3. Search results stay open until next search
**File:** `src/components/SearchResults.tsx` (and `BrowserPicker.tsx` if it manages collapse)

- Audit current behavior: ensure result list never auto-collapses on outside click, scroll, or focus loss.
- Only clear/replace results when `runSearch` fires for a new query. (Likely already true — confirm and remove any auto-close effect; add a comment locking the behavior.)

## 4. Double-click scroll-ad slots between result links
**File:** `src/components/SearchResults.tsx` (results list render) + new `src/components/ScrollAdSlot.tsx`

- New component `ScrollAdSlot`:
  - Horizontally scrollable strip (`overflow-x-auto`, snap), 3–5 sponsor cards from `pickNativeAd` using current tier + `topInterestTiers` fallback.
  - **Single click = no-op** (with a tiny tooltip "Double-click to open"). **Double click (`onDoubleClick`)** opens the sponsor via `onOpenUrl` / `exit.requestExit` — this is the anti-misclick guard the user wants.
  - Visually clearly labelled `Sponsored · double-click to open`.
- Inject one `ScrollAdSlot` after every 3rd result in `SearchResults`. Also inject one between every 3rd OpenAlex work in `OpenAlexFeed`.
- Add a `onOpenUrl` prop chain so slots can call back into `exit.requestExit`.

## 5. Softer "vintage cookie box" tier palette
**Files:** `src/lib/mockData.ts` (TIERS colors), `src/index.css` (optional desaturation token)

- Replace the current saturated tier colors with a warmer, lower-saturation palette: think aged cardboard, faded biscuit tin — saturation ~35–50%, lightness ~55–65%, no neon.
- Preserve hue family per tier (purple stays purple, green stays green, etc.) so meaning is intact; only saturation & lightness change.
- Tier bars (`TierExperienceBar`, tier dots in Dashboard/Tiers): no code change needed — they already consume `tier.color`. Just verify contrast on dark emerald bg with the new values.

### Proposed new color values (HSL)
```
1  hsl(270, 35%, 60%)   2  hsl(265, 35%, 62%)   3  hsl(258, 35%, 64%)
19 hsl(295, 30%, 58%)   20 hsl(48, 55%, 65%)
4  hsl(150, 30%, 52%)   5  hsl(135, 28%, 55%)
6  hsl(212, 35%, 50%)   7  hsl(210, 35%, 55%)   18 hsl(205, 40%, 65%)
8  hsl(208, 38%, 58%)   21 hsl(330, 35%, 72%)
9  hsl(206, 40%, 62%)   10 hsl(204, 40%, 66%)   11 hsl(202, 45%, 72%)
12 hsl(20, 45%, 72%)    13 hsl(25, 50%, 74%)
14 hsl(30, 55%, 64%)    15 hsl(22, 60%, 58%)
16 hsl(0, 45%, 50%)     17 hsl(0, 50%, 42%)
```

## Out of scope (not touched)
- Backend, Mistral classifier, edge functions, RLS, auth.
- Sidebar, Dashboard layout, Tiers page logic.
- `src/integrations/supabase/*` (auto-gen).

## Files edited
- `src/pages/Research.tsx`
- `src/components/OpenAlexFeed.tsx`
- `src/components/SearchResults.tsx`
- `src/components/BrowserPicker.tsx` (pass `onOpenUrl` through if needed)
- `src/components/ScrollAdSlot.tsx` (new)
- `src/lib/mockData.ts` (palette only)
