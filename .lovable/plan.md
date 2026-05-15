## 1. PLOS card — rollback + fix search

**`src/components/PlosCard.tsx`**
- Remove the `bg-[hsl(var(--ivory))]` wrapper button. Restore the prior look: PLOS logo on the card's normal dark background. Make the bitmap **shorter and wider** (squeezed): cap height (`maxHeight: 48px`) and let width run wide (`maxWidth: 260px`, `width:100%`), `objectFit: contain`. No ivory overlay.
- Keep "⟩PLOS →" link in foreground/60.

**`src/hooks/usePlosSearch.ts` + `supabase/functions/plos-search/index.ts`**
- The search button "doesn't work": likely the `body` is sent through `functions.invoke` but the edge function reads it then also requires Bearer auth. Confirm by adding a console.error capture and check live network. Fix: edge function currently rejects when no Authorization Bearer; `supabase.functions.invoke` from the browser does pass the user JWT, so the failure is most likely the **CORS header missing on the 401 response after `OPTIONS`**, or the empty-body POST throwing. Concretely:
  - Change `usePlosSearch` to also pass `headers: { "Content-Type": "application/json" }`.
  - In the edge function, wrap the `await req.json()` in a defensive parse (already done) and ensure the auth check returns CORS headers (already does). Add a fallback: if `Authorization` is missing, allow public read (PLOS is keyless and rate-limited upstream anyway) — drop the auth gate to a soft warning. This restores the toggle.

## 2. Sidebar "A" mark — real round frame

**`src/components/AppSidebar.tsx`**
- The current `<img className="h-8 w-8 rounded-full object-cover">` crops the source image to a circle but the source itself is rectangular, so the visible A looks oval. Replace with a fixed-size **round container** that holds the full image with padding so the entire circled A + its green halo are visible:
```tsx
<div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-primary/40 bg-[hsl(150_60%_8%)] flex items-center justify-center">
  <img src={addlogicMark} alt="AddLogic" className="h-full w-full object-contain" />
</div>
```
- Also do the same in the expanded (non-collapsed) header so the brand mark sits next to "AddLogic" text.

## 3. Live-vs-preview colour mismatch (OpenAlex icon black-on-black, paler logos)

Root cause: components using inline `style={{ color: tier.color }}` with `currentColor` SVGs render fine in dev, but in the published bundle Tailwind's purge + a few `text-foreground/XX` overlays + `mix-blend` from parent gradients shift the apparent value. The OpenAlex icon specifically is rendered as an `<img>` of a black-on-transparent PNG inside a dark card without any background.

Fixes:
- **`src/components/OpenAlexFeed.tsx`**: wrap the OpenAlex logo `<img>` in a small ivory pill `<span className="inline-flex items-center justify-center rounded-md bg-[hsl(var(--ivory))] px-2 py-1">` so the black mark sits on its native white background in both preview and prod.
- **Audit `text-foreground/60`, `opacity-50` overlays on logo containers** (Sidebar, PlosCard, OpenAlexFeed, TierIcon usage in Dashboard "Primary Research Tier" card). Remove the opacity wrappers around brand assets — they cause the "paler in live" effect because production builds resolve `opacity` differently when combined with backdrop-blur cards.
- Add a single utility `.brand-asset { opacity: 1 !important; mix-blend-mode: normal !important; filter: none !important; }` in `index.css` and apply it to the AddLogic mark, OpenAlex logo, PLOS logo and tier icons rendered inside cards. This guarantees identical rendering in preview and `addlogic.lovable.app`.

## 4. Tiers list — replace mock numbers with real traffic

**`src/lib/mockData.ts` + `src/pages/Tiers.tsx`**
- Remove the hardcoded `researchers` and `avgEarning` numbers in `TIERS`.
- New hook `useTierTraffic()` that reads from `anonymous_research_analytics` (already in DB) aggregated per `tier_id`:
  - `researchers = COUNT(DISTINCT user_id_hash)` — but that table is anonymised; instead aggregate `SUM(visit_count)` as "weekly visits" and `SUM(total_dwell_seconds)/3600` as "researcher-hours".
  - `avgEarning` = remove entirely until the rewards engine flushes real T$ per tier; show "—" with tooltip "Live data accumulating".
- In `Tiers.tsx`, render `{traffic[t.id]?.visits ?? "—"} visits · {hours} researcher-hours` instead of "X researchers · T$Y/day".
- "Top Milestones" card on Dashboard already uses real `milestones` rows — leave it.

## 5. Experience & Multiplier bar

**`src/components/ExperienceBar.tsx`**
- `XP_PER_LEVEL` from `1_000_000` → **`500_000`** (request: "500000 instead of a Million").
- Bars: thinner — `h-3` → `h-2`, compact mode `h-2` → `h-1.5`. Soften edges with `rounded-full` already, plus `shadow-inner` on the track.
- **Decouple multiplier from cookie/GPS toggles**: drop `consentBonus(...)` from `activeMultiplier`. Multiplier is now driven only by `stats.current_multiplier`, which is set server-side by the Mistral classifier each time a research query is graded. Remove the `useEffect` that mutates `current_multiplier` from this component — the bar becomes read-only.
- Update Dashboard "Multiplier x{COOKIE_BONUS}" / "Multiplier x{GPS_BONUS}" copy on the cookie + GPS rows: relabel as "Required permission" instead of advertising a multiplier number, since they no longer move the bar.
- Replace 🔴 red star / crimson "AI argument" indicators with a small Mistral "M" mark. Add `src/assets/mistral-mark.svg` (white M on transparent bg) and use it wherever the AI-derived chip currently shows the brain emoji or a star (Tiers.tsx line 223 already removed brain — also remove the colored `text-primary` star next to "AI-derived sub-interests" if any; render `<img src={mistralMark} className="brand-asset h-3 w-3 inline-block mr-1" />`).

**`supabase/functions/classify-interest/index.ts`**
- After classification, write back the user's `current_multiplier` based on confidence × tier multiplier. Persist via service-role to `user_stats.current_multiplier`. This is what the bar will reflect.

## 6. Top Milestones card → host the Meta-Interests Cake

**`src/pages/Dashboard.tsx`** — keep the card title "Top Milestones" but split body into two sections:

a. **Meta-Interests Cake** (new, on top): a circular pie chart showing % of XP this user has accumulated per tier. Built with a small dependency-free SVG donut (no Recharts needed — keep bundle light). Slice colour = `tier.color`. Center label = "Affinity Map". Below the donut, a 3-row legend of the user's top 3 tiers with `% affinity`.
   - Data source: existing `tier_progress` rows. New hook `useTierAffinity()` returns `[{ tierId, percent }]` normalised over `seconds_active`.
   - Caption: "Your skill mix — connect with researchers who share ≥30% overlap." Add a small "Find affinity matches" link that routes to `/connections?affinity=1` (just navigation, matching logic out of scope here).

b. Existing milestone list stays underneath the donut.

**New file**: `src/components/MetaInterestsCake.tsx` — pure SVG donut, no animation library, accepts `slices: {color, percent, label}[]`.

## 7. Memory update

Update `mem://index.md` Core line to note: "Multiplier is set only by Mistral classifier on each research query — toggles no longer add to it. XP_PER_LEVEL = 500k. Top Milestones card hosts a Meta-Interests Cake (donut of per-tier affinity)."

## Files touched

- `src/components/PlosCard.tsx` (rollback)
- `src/hooks/usePlosSearch.ts`, `supabase/functions/plos-search/index.ts` (search fix)
- `src/components/AppSidebar.tsx` (round A frame, both states)
- `src/components/OpenAlexFeed.tsx` (ivory pill behind logo)
- `src/index.css` (`.brand-asset` utility)
- `src/lib/mockData.ts` (drop fake numbers)
- `src/hooks/useTierTraffic.ts` (new), `src/pages/Tiers.tsx` (real traffic)
- `src/components/ExperienceBar.tsx` (500k cap, thinner, decouple from toggles)
- `src/pages/Dashboard.tsx` (relabel toggle copy, mount Meta-Interests Cake in milestones card)
- `src/hooks/useTierAffinity.ts` (new)
- `src/components/MetaInterestsCake.tsx` (new)
- `src/assets/mistral-mark.svg` (new)
- `src/pages/Tiers.tsx` (Mistral M chip in AI-derived line)
- `supabase/functions/classify-interest/index.ts` (write `current_multiplier`)
- `mem://index.md`

## Open question

For the Meta-Interests Cake "affinity match" link — should clicking through filter the existing `/connections` list to users with ≥30% tier overlap (requires a new RPC + an affinity score column on `tier_progress`), or just deep-link without filtering for now? Default in this plan: **deep-link only**, build the matching RPC in a follow-up.