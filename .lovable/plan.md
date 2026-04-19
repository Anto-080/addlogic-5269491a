## Plan: Nav, Icons, Branding Frame & Bank Vault

### 1. Quick-access top nav — fix visibility

The nav row exists in `AppLayout.tsx` but only shows ≥sm (640px). User's viewport is 411px so it's hidden. Changes:

- Show on all sizes (remove `hidden sm:flex`); on small screens show **icon-only** (label hidden <md)
- Update links to: **Dashboard** (LayoutDashboard), **Research** (Search), **Tiers & Sponsors** (Layers) — drop Investments from the quick row
- Make the user avatar circle (top-right "A") a `NavLink` to `/settings` with hover ring

### 2. Replace emoji tier icons everywhere with `TierIcon`

Audit + replace `tier.icon` (emoji string from `mockData.ts`) usages with `<TierIcon tierId={...} />`:

- `src/pages/Dashboard.tsx` — top interests list
- `src/pages/Research.tsx` — tier chips/filters
- `src/pages/Earnings.tsx` — per-tier earnings rows
- `src/pages/Tiers.tsx` — both Tiers and Sponsor Bidding views (confirm)
- `src/components/AdBanner.tsx` — tier-matched ad chip
- Any other `tier.icon` references found via search
Keep `icon` field in mockData for backward compat but stop rendering it.

### 3. Tiers & Sponsors page — Biochemistry-branded silver frame

- Wrap the **top 3 purple high-priority tiers** (Biological Sciences, Biochemistry, Scientific Research) in a single rounded card with a **Scotty Silver (#758A9C)** 1.5px border + soft inner glow
- Above the frame, inside the same border (connected, no gap), place a **"Biochemistry" wordmark banner** — recreated as inline SVG text using a similar slab/condensed style (no logo file, avoids trademark) in the same silver tone
- Remove the **color-name legend** ("Green = Ecology/Finance" etc.) — keep only the horizontal priority spectrum bar
- Banner copy: "BIOCHEMISTRY · TOP PRIORITY RESEARCH"

### 4. Earnings → Bank vault rebrand

- Swap `Wallet` icon → `Landmark` (bank columns) icon in:
  - `AppSidebar.tsx` — Earnings sidebar entry
  - `AppLayout.tsx` — top-right earnings shortcut pill
- Keep `Wallet` icon **only** inside `StablecoinWithdraw.tsx` on the withdrawal button
- In `Earnings.tsx`, add a short **"Vault" explainer card**: earnings accumulate securely in-app; withdraw any time to MiniPay/Google Wallet; later phases enable auto-restake loop (Ads → Stake → Yield → Stablecoin → Restake)
- Add a small ASCII-style flow diagram component:
  ```text
  Ads → Stake → Yield → Stablecoin ↺
  ```
- Note re: third-party custody/hacker-defense partnerships: Lovable does not bundle a custody partner. I'll add a placeholder "Secured by [Vault Provider]" badge that you can swap when a real provider (e.g. Fireblocks, Turnkey) is wired in — purely cosmetic for now.

### Files to touch

- `src/components/AppLayout.tsx` — nav visibility, link set, avatar→Settings, Wallet→Landmark
- `src/components/AppSidebar.tsx` — Earnings icon → Landmark
- `src/pages/Tiers.tsx` — silver-framed top-3 + Biochemistry banner, remove color legend
- `src/pages/Dashboard.tsx`, `src/pages/Research.tsx`, `src/pages/Earnings.tsx`, `src/components/AdBanner.tsx` — replace emoji with `<TierIcon>`
- `src/pages/Earnings.tsx` — add Vault explainer + flow diagram
- `src/index.css` — `.silver-frame` utility, optional shimmer

### Notes

- Biochemistry banner is recreated as styled SVG text (not the uploaded PNG) to keep it crisp at any size and avoid embedding a possibly-trademarked raster.
- No new routes, no backend changes.