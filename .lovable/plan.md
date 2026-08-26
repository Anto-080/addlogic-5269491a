# Staking Split + Paper Folder Tiers

## 1. Stablecoin Staking — split into two graphs

**Graph A — Stablecoin Staking (Ash Gold, unchanged colour)**
- Projects **only** on-site earnt Time-Coins. The amount input field is removed here; the projected amount is locked to the user's Time-Coin balance.
- Keeps the 1–10 years slider.
- Runs on the 3% baseline (active from Level 15 up to the Level 50 Financial Phase).
- The emerald message "Investing Personal Assets increase both Overall & Financial Sector Field Experience" stays, and the "Invest Your Personal Assets" button moves to sit **below** that message.

**Graph B — new, Silvered Grey `#565B64`**
- Title: `Aggregated Stablecoins Staking — [Multi Platform · Insurance Margin Required]`
- Holds the whole interest ladder that currently lives in Graph A: **4% base**, then 5-6-7-8-9-10%, one step every 10 experience levels (same unlock logic as today).
- Same years slider, no manual amount field; projection uses the Time-Coin balance.

**Deposit window (Invest Your Personal Assets)**
- Clicking the bronze/silver button opens a modal: amount to deposit + choice of **Google Pay** or **MiniPay**.
- Wiring reuses the destinations already saved on the profile (`minipay_address`, `google_wallet_email`) that the Vault withdrawal tiles use. If a rail is not yet linked, the modal prompts to link it inline.
- The manual "amount to project" input stays available **only** in the Investment Pools (∆Delta-Neutral) section, as today.

## 2. Tier List — paper folder look

- Folder body base becomes Pale Brown cardboard `#987654`, with the tier's identifying colour applied as a **faint translucent tint on top** (colour values themselves unchanged, so sectors stay recognisable).
- Folder tabs use the same cardboard brown.
- Add an organic/rough paper feel via a subtle CSS fibre/noise texture layer plus slightly irregular edges and a soft crease shadow — no images needed.
- The tier colour identification line at the top of each folder stays, so tiers remain readable at a glance.

## 3. Deeper purple for Sciences and Top Tiers

- Tiers 1, 2, 3 (Bio Lifesaving, Biochemical, Systemically Important Research) and 19 (Sciences) shift to a deeper, richer purple in `src/lib/mockData.ts`.

## Technical notes

- `src/components/InvestmentPanels.tsx`: split `StakingPanel` into two chart blocks; `ProjectionControls` gains a variant without the amount input; ladder chips move to the new grey block; new `DepositDialog` component with amount + rail selection reading/writing `profiles.minipay_address` / `profiles.google_wallet_email`.
- `src/pages/Tiers.tsx`: rewrite `tierSurface()` / `FolderTab()` to layer cardboard `#987654` + low-alpha tier tint + noise texture.
- `src/index.css`: add a `.paper-folder` texture utility.
- `src/lib/mockData.ts`: purple colour values for tiers 1, 2, 3, 19.
- No database or edge-function changes.
