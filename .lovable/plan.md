## Plan: Multi-section refinements

### 1. Top quick-access nav bar (in `AppLayout.tsx` header)

Add a row of shortcut buttons between the sidebar trigger and the wallet:

- **Research** (Search icon) → `/research`
- **Tiers & Sponsors** (Layers icon) → `/tiers` (merged page)
- **Investments** (TrendingUp icon) → `/investments`
- Active route highlighted with amber underline/bg
- Wallet pill becomes clickable → `/earnings` (with subtle "shortcut" indicator above the Wallet icon — small dot/chevron)
- Hidden on very small screens, shown ≥sm

### 2. Wallet — remove self-custody section

In `src/components/StablecoinWithdraw.tsx`: remove the "Self-custody (USDT)" provider entry. Keep MiniPay + Google Wallet only. Add a short note explaining anonymous wallets are excluded to protect the ad-revenue pool from bot abuse.

### 3. Merge Tiers + Sponsors into one page

- Keep route `/tiers` as the merged page; redirect `/sponsors` → `/tiers`
- Add a top **Tabs/Switch**: `Interest Tiers` | `Sponsor Live Bidding`
- **Tiers view**: current tier list (unchanged structurally)
- **Sponsor view**: same 17 tier rows but each row shows live bid stats (current top bid, # bidders, traffic volume, engagement, user and investor multiplier which is the  same) + a `Place Bid` button that opens a small dialog (mock)
- Remove `Sponsors` route from sidebar; rename sidebar item to "Tiers & Sponsors"
- Update `App.tsx` routes
- Color fix in `mockData.ts`: Real Estate → Technology range now blues (light → deep). Currently Personal Shopping=peach, Personal Care=pink. Re-map:
  - Real Estate `#7DB9E8` (light blue)
  - Food `#5BA3D9`
  - Entertainment `#3F8FCC`
  - Global News `#2A7BBF`
  - Art & Culture `#1F66A8`
  - Technology `#15528F` (deep blue)
  - Personal Shopping stays peach, Personal Care stays pink (unchanged)
- Update `.tier-spectrum` gradient in `index.css` to match
- Add Stylised, non Emojis, type of Interest Related Icons, delineated Symple, as the Smiley and Ghost of the Availability Button, Simple and Effective, yet not Overly "Goofy".
  &nbsp;

### 4. Split Data Consent toggle into two

On Dashboard, replace the single merged toggle with one card containing **two** toggles styled like the Settings availability toggle:

- **Cookie Auto-Accept** — stylized cookie SVG icon. Description: app auto-accepts cookies during in-app browsing for max ad targeting & returns.
- **GPS Precision** — stylized map-pin SVG icon. Description: enables high-end regional ad rewards + XP multiplier + unlocks "Regional Coupons" list on Dashboard.
- When GPS is on, show a new **Regional Coupons** mock card on Dashboard (3-4 sample local offers).

### 5. In-app browser for Research + ad banners

- Convert `BrowserPicker.tsx` flow: instead of `window.open(...)`, render the search result inside an **in-app `<iframe>**` on the Research page when a query is submitted.
- Layout: `[Top Ad Banner] / [iframe search results] / [Bottom Ad Banner]`
- Cookie auto-accept toggle state read from a shared store (simple localStorage or React context) — when on, show "Cookies auto-accepted" badge in the iframe header strip.
- Note: many sites (Google) block iframe embedding via `X-Frame-Options`. Will use Opera/Ecosia/Brave as defaults (more permissive) and show a fallback "Open in new tab" button when iframe fails to load. Will add a brief disclaimer.
- If Embedding is not Available the Research start a Set of Add Banners In App which the User have to Open before Reading the Article/Research and After. The App just take Track of Screen Touch and Up/Down Movements for Forbidding Bots to Acquire Free Revenues.
- Ad banners are mock components showing a tier-matched placeholder ad (uses user's top interest tier color).
- One Small Horizontal Button Above in Research Section Allow you to see when Retributed Sonsoref Videos are Available.
  &nbsp;

### Files to touch

- `src/components/AppLayout.tsx` — add quick-nav row
- `src/components/AppSidebar.tsx` — remove Sponsors entry, rename Tiers
- `src/App.tsx` — redirect /sponsors → /tiers
- `src/pages/Tiers.tsx` — add Tabs (Tiers | Sponsor Bidding), inline sponsor bidding view
- `src/pages/Sponsors.tsx` — keep file but make it a redirect (or delete & remove import)
- `src/lib/mockData.ts` — recolor blue range tiers
- `src/index.css` — update `.tier-spectrum` gradient
- `src/pages/Dashboard.tsx` — split toggle into two (Cookie + GPS), add Regional Coupons card (visible when GPS on)
- `src/components/StablecoinWithdraw.tsx` — remove self-custody, add bot-pool note
- `src/components/BrowserPicker.tsx` + `src/pages/Research.tsx` — in-app iframe + top/bottom ad banners
- New: `src/components/InAppBrowser.tsx`, `src/components/AdBanner.tsx`

### Notes

- Iframe embedding limitation will be handled gracefully with fallback or by Opening a New Tab in the User Predefined Browser After the User Tapped over Few Ads, the Not-In-App Research can be Overcomed by Putting In-Apps Ads and suggesting the User the Retributions come After Clicking the Highest Paying Ads. By this Mean we don't Substitute for the User Browsing Choices we just add a Revenue Stream for them Coming from their Own Researches.
- Shared toggle state via lightweight React context (`SettingsContext`) to avoid prop drilling between Dashboard and Research/InAppBrowser.