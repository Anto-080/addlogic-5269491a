## Plan: Vault re-scaling, color sweep, sandglass/clock, gating, anti-bot detection, banners

### 1. Vault icon — use uploaded reference (proportional, gold)

Re-import the uploaded vault image as `src/assets/vault-door.png` and rewrite `RoundVault.tsx` to render the PNG inside a colored mask so it stays `#B0903D` (using CSS `mask-image` with the asset as the mask). All instances (`AppLayout` pill, `Earnings` header / explainer / balance, sidebar if any) keep the `#B0903D` tint. Money/UI elements stay `#9A7246` — only the vault is `#B0903D`.

### 2. Color sweep — kill the orange "primary" wherever it represents money/UI accents

Replace all `text-primary` / `bg-primary` / amber Lucide-icon colors used on **toggles, buttons, money icons, switches, badges, and chart accents** with `#9A7246` via existing `.text-money`/`.bg-money`. Specifically:

- Switches (Cookie, GPS) → tint thumb/track `#9A7246`
- Dashboard inline icons (Zap, Newspaper, Tag, Star/gold), Daily Desk header, Multiplier hint chip → `text-money` where they relate to money/UI; keep crimson for multiplier specifics
- AdBanner / Research banner / Investments cards / Tiers info icons / BrowserPicker Globe + Default badge / Coupons distance chip → `text-money`
- HexDollar hexagon stroke + `$` → `#9A7246` (so "All Time" badge matches money color)
- Vault stays `#B0903D`; gold stars (`text-gold`) for milestones stay as accent

Add an override block in `index.css` so existing `glow-amber` shadow becomes `#9A7246` glow.

### 3. Today / This Week icons → Sandglass + Clock

In `Dashboard.tsx`, replace the `DollarSign` icon next to `Today` and `This Week` cards with two custom inline SVGs in `#9A7246`:

- **Today** → stylised **Sandglass** (hourglass, two trapezoids + falling sand)
- **This Week** → stylised **Clock** (circle + hour/minute hands at 10:10)
- **All Time** → keeps existing `HexDollar` (recolored to `#9A7246`)

New file: `src/components/icons/SandglassIcon.tsx`, `src/components/icons/ClockIcon.tsx`.

### 4. Investments page — banners & disappearing card

Edit `src/pages/Investments.tsx`:

- Above "Level 50 Required": replace the `Lock` icon with the uploaded **Work In Progress** sign (`src/assets/work-in-progress.png`, ~200px)
- "Circular Economy Class" card becomes **collapsed by default** showing only the WIP banner + **dev-only mock toggle "Simulate Level 100"**. When toggled ON (or if user level ≥100), card expands fully:
  - Background: `#D1DEFB`
  - Top of expanded card: uploaded **infinity light-trail** image (`src/assets/infinity-banner.jpg`) — replaces the current Lucide `Infinity` + lock SVG
  - Below it: replace the current AI-generated globe with a **new SVG mock of the US-DIA-style seal**: globe + crimson Möbius-strip ribbon, surmounted by an infinity symbol (`#00BFFF`) instead of the flaming torch, surrounded by stars. Inline SVG component `src/components/icons/DiaSeal.tsx`.
  - The Underneath Explanation cite that : Direct Interactions between Companies and Most Experienced Users will Be Not Only Promoted but Facilitated, Users Ideas will be Prompted as New Concepts to Already Established Industrial Complexes, the best Ideas will be not only Chosen but Retributed and offered a Working Position inside the Finest Companies Worldwide. Companies will be shown how the Users Knowledge-Development will push Clients to Reinvest in their Favourite Companies in the Safests, Fluctuations Stables, and More Remunerative ways Possible for both the Users and The Companies.

### 5. Research page — Opera logo, gated in-app bar, remove old mock search

- `BrowserPicker.tsx`: replace the "O" placeholder with the **Original Opera "O" logo**  since we are using their Browser as Main Browser of Choice (`src/components/icons/OperaLogo.tsx`) — concentric red rings/ellipse, public Opera mark.
- **Gate the in-app search input until Level 25**: in `BrowserPicker`, accept `userLevel` prop; when `<25`, disable Input + Open button and overlay a small lock + caption "Unlocks at Level 25 — keep researching."
- In `Research.tsx`: **remove the top mock search bar** (the `<Input>` with `Search topics, articles…`) — Opera WebView now handles search.

### 6. Behavioral gating — anti-bot exploit prevention

- **Top-tier (1–3) lock for users <Level 35**: in `Tiers.tsx` and `Research.tsx`, when `userLevel < 35`, overlay top-3 tier rows with the **Work In Progress yellow banner** + caption: *"For Accredited Scientists: Connect through LinkedIn for Early Access"* and a `Connect via LinkedIn` button (mock OAuth stub). Lower tiers stay accessible.
- Add `MOCK_USER` (level: 23) in `mockData.ts` so all gates resolve consistently across pages until real auth metadata exists.

### 7. Cookie + GPS consents → real device data acquisition (web/Capacitor)

Extend `SettingsContext.tsx`:

- When `cookieAutoAccept` toggles ON: request `navigator.permissions` for `clipboard-read`, set a cross-domain cookie shim, and on Capacitor call `@capacitor/preferences` + `@capacitor-community/http` to mark cookie auto-accept globally.
- When `gpsPrecision` toggles ON: call `navigator.geolocation.getCurrentPosition` (web) or `@capacitor/geolocation` (native) and store coords in context.
- Add a new helper `src/lib/userInterestProfiler.ts` that, **only when both toggles are ON**, attempts to read browsing-history-derived interests:
  - Web: cannot read raw history (browser sandbox forbids it). Falls back to `document.referrer`, `localStorage` recents, and the user's in-app search history; classifies hits against tier subcategory keywords.
  - Native Android (Capacitor): documents the required `READ_HISTORY_BOOKMARKS`-equivalent path. Since modern Android forbids 3rd-party history reads, real data comes from a **Capacitor Browser History plugin shim** (`window.HistoryBridge?.read()`) that the Android shell exposes after the user grants the consents. Wrapper resolves: shim → Capacitor `App` URL events → in-app search log fallback.
- Result: a `topInterestTiers: number[]` exposed by `useSettings()`. `Research.tsx` uses it to **sort article feed and the Opera WebView quick-suggest chips** by the user's actual top interests.

### 8. Tiers — text & data fixes (`mockData.ts`)

- Tier 1 name: `"Biological Systems & Life-saving Tech"` → **"Biological Systems & Lifesaving Technologies"**
- Tier 3 name: `"Systematically Important Sci Research"` → **"Systematically Important Scientific Research"**
- Tier 1 subcategories: replace `"Gene therapy"` with **"Genes Functioning"** and **"Peptide Research"** (keep Cancer research, Vaccines, Organ regeneration → final list: `Genes Functioning, Peptide Research, Cancer research, Vaccines, Organ regeneration`)

### Files touched

- `src/components/icons/RoundVault.tsx` — masked PNG render
- `src/components/icons/SandglassIcon.tsx`, `ClockIcon.tsx`, `OperaLogo.tsx`, `DiaSeal.tsx` (new)
- `src/components/icons/HexDollar.tsx` — recolor stroke/text to `#9A7246`
- `src/assets/vault-door.png`, `work-in-progress.png`, `infinity-banner.jpg` (new, copied from uploads)
- `src/index.css` — `.glow-money` shadow, switch tint override, money color sweep helpers
- `src/pages/Dashboard.tsx` — Sandglass/Clock icons, color sweep
- `src/pages/Investments.tsx` — WIP banner, collapsible Circular card with mock Level 100 toggle, DIA seal, infinity banner image
- `src/pages/Research.tsx` — remove mock search bar, gating overlay <L35, pass userLevel to BrowserPicker
- `src/pages/Tiers.tsx` — top-3 WIP overlay <L35, name fixes propagated
- `src/components/BrowserPicker.tsx` — Opera logo, level-25 gate
- `src/components/AdBanner.tsx`, `src/components/StablecoinWithdraw.tsx` — color sweep to `#9A7246`
- `src/contexts/SettingsContext.tsx` — geolocation request, history-shim integration, expose `topInterestTiers`
- `src/lib/userInterestProfiler.ts` (new) — interest extraction wrapper
- `src/lib/mockData.ts` — tier name + subcategory fixes, `MOCK_USER`

### Notes

- Browser sandbox forbids reading other sites' history; the real cross-app history read only works once the project is exported to Capacitor + Android with a custom history-bridge plugin. The wrapper degrades gracefully in the Lovable web preview.
- DIA-style seal is recreated as generic SVGs (no copyrighted raster).
  &nbsp;
- Vault color `#B0903D` and other Vault and Earnings Colours are preserved; everything else money-tinted is `#9A7246`.