## Plan: Trim sidebar, add Offers, USDC icon, round vault, tier name fixes

### 1. Round vault icon

Lucide's `Vault` is a square safe. Replace it everywhere it appears with a custom **round vault door** SVG component (circular dial, spokes, hinges):

- New file: `src/components/icons/RoundVault.tsx` — accepts `size`, `className`, standard SVG props
- Swap usages in: `AppLayout.tsx` (top-right pill), `AppSidebar.tsx` (if still present after trim — see §3, will be removed), `Earnings.tsx` (header + vault explainer + balance card)

### 2. USDC icon replaces "$" everywhere

- New file: `src/components/icons/UsdcIcon.tsx` — stylized USDC: blue circle (#2775CA) with white "$" / hexagonal ring, scalable SVG
- Replace `$` text + `DollarSign` lucide icon usages in:
  - `Dashboard.tsx` — All-Time Earnings badge icon on the Right + any $ stats
  - `Earnings.tsx` — summary cards (Today / Week / All-Time / Streak), vault balance, withdraw row, redistribution per-tier amounts
  - `StablecoinWithdraw.tsx` — amount/fee/net rows
  - `Tiers.tsx` sponsor bidding view — current top bid amounts
  - `AdBanner.tsx` if it shows $ payout
- Format: `<UsdcIcon className="inline h-3 w-3" /> 12.40` (icon before number, no "$")

### 3. Trim sidebar to: More → Connections, Investments, Offers

In `AppSidebar.tsx`:

- Remove the entire **Main** group (Dashboard, Research, Tiers & Sponsors, Vault/Earnings)
- Remove Settings from secondary (already accessible via avatar top-right)
- Keep only **More** group with: **Connections**, **Investments**, **Offers** (new)
- Sidebar header/footer (logo, sign out, user email) unchanged

### 4. New "Offers" page (CPA marketplace)

- New route `/offers` in `App.tsx` (protected)
- New file: `src/pages/Offers.tsx`
- Layout mirrors `Tiers.tsx`:
  - Top **Tabs/Switch**: `Browse Offers` (user side) | `Place Offer` (sponsor side)
  - **Browse Offers**: filterable list grouped by tier (uses same 17 tiers + `<TierIcon>`); each card shows merchant, discount %, original→sale price (with `<UsdcIcon>`), CPA payout to user on completed purchase, "Claim Offer" button (mock)
  - **Place Offer**: form mock — pick tier, discount %, CPA bounty, merchant name, CTA preview; "Submit Offer (Free listing — pay on conversion)" button
- Add 6-8 mock offers in `mockData.ts` (`MOCK_OFFERS`) spread across tiers
- Short header explainer in "Place offer " Side : "CPA = Cost Per Acquisition. Sponsors list offers free; pay only when a user completes a purchase. Better deals for users, zero-risk reach for sponsors."
- Short Header Explainer in " Browse Offers": "Level 50 Unlock Cashback on Purchased Offers"
  &nbsp;

### 5. Tier label fixes (`mockData.ts` + `Tiers.tsx`)

- Rename `"Art & Culture / Humanistic"` → `"Art & Culture / Humanism"`
- `Tourism & Travel` Interest is added to the Tier List with a Backpack Bag Icon.
- For long tier names that get truncated in the Tiers list:
  - Apply `truncate` by default on the row label
  - On click/expand (use existing accordion or add lightweight `useState` toggle per row), show full name + description
  - Tier rows become collapsible; expanded state reveals full title, color chip, multiplier details, and (sponsor view) extra bid stats
  &nbsp;

### Files to touch

- New: `src/components/icons/RoundVault.tsx`, `src/components/icons/UsdcIcon.tsx`, `src/pages/Offers.tsx`
- `src/App.tsx` — add `/offers` route
- `src/components/AppSidebar.tsx` — trim to Connections/Investments/Offers
- `src/components/AppLayout.tsx` — swap Vault icon → RoundVault
- `src/pages/Earnings.tsx` — RoundVault + UsdcIcon throughout
- `src/pages/Dashboard.tsx` — UsdcIcon on earnings badge + any $ figures
- `src/pages/Tiers.tsx` — collapsible rows for long names, "Humanism" rename, UsdcIcon in bid amounts
- `src/components/StablecoinWithdraw.tsx` — UsdcIcon
- `src/components/AdBanner.tsx` — UsdcIcon if applicable
- `src/lib/mockData.ts` — rename Humanistic → Humanism, add `MOCK_OFFERS`

### Notes

- USDC icon is a generic stylized representation (blue circle + $), not the Circle® trademarked logo file.
- Round vault is a custom SVG; no external asset.
- No backend changes; Offers is mock data only.