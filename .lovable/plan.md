## Plan: Vault icon, dollar revert, gold money color, banner tweaks, Opera WebView

### 1. New round Vault icon (from uploaded reference)

Replace `RoundVault.tsx` with a faithful version of the uploaded reference: round door (outer ring), inner dial with cross-spokes, six bolt dots around the perimeter, and a side hinge bracket on the right. All strokes use `currentColor`; consumers pass `style={{ color: "#B0903D" }}`. Apply that color in:

- `AppLayout.tsx` (top header pill)
- `Earnings.tsx` (page title, Vault explainer, balance row)

### 2. Revert "$" symbol changes remove all USDC Symbols —  All-Time badge change

This was the user's main complaint. Roll back UsdcIcon usage to the **original `$` text / `DollarSign` icon** in:

- `Dashboard.tsx` — Today / This Week cards, AnimatedCounter, milestone earnings → back to `$12.40` text
- `Earnings.tsx` — all 4 summary cards, redistribution rows, vault balance, withdraw row → back to `$`
- `StablecoinWithdraw.tsx` — amount/fee/net/Max → back to `$`
- `Tiers.tsx` — Avg/day, top bid, BidDialog → back to `$`
- `Research.tsx` — already uses `$` and `DollarSign`, leave as-is

Dashboard "All Time" card: keep a small stylized icon, but as a **gold hexagon with a** `$` **inside** (new tiny inline SVG, same `#9A7246` color, same font size as the other two "Today"/"This Week" badges that use `<UsdcIcon size={32} />` currently — those revert to no USDCicon and Old icon / matching style). Place it inline on the same row as the other two badges so the three badges look uniform except All-Time gets the hex-$ inside Exagon marker.

### 3. Money color = `#9A7246`

Wherever a number represents money, an earnings bar, a money-related button, or the weekly trend bars, color it `#9A7246`:

- `index.css` — add `.text-money { color: #9A7246; }` and `.bg-money { background-color: #9A7246; }`
- `Dashboard.tsx` — replace `text-gradient-gold` on monetary values with `text-money`; AnimatedCounter, milestone `$` totals
- `Earnings.tsx` — summary card values, vault balance, redistribution direct-bar (`bg-money`), Withdraw button (`className="bg-money hover:bg-money/90"`)
- `Earnings.tsx` weekly chart — change `<Bar fill="hsl(38, 92%, 50%)">` to `fill="#9A7246"`
- `StablecoinWithdraw.tsx` — "You receive" total, Send button background
- `Tiers.tsx` — top-bid amount, Avg earning text
- `Research.tsx` — session earnings number, article earnings

### 4. Tier numbering — drop labels, keep colors

In `Tiers.tsx`:

- Remove the `Tier {tier.id}` text label above each tier name (both top-3 silver block and main list)
- Remove "Tier 1 / Tier 17" labels under the Seasonal Spectrum bar
- Keep all color borders, color chips, and the spectrum gradient — they convey ranking visually without locking to numbers
- Update sub-text: keep the current "17 tiers ranked by societal importance. Switch to Sponsor Live Bidding to see auction activity." → change to **"Tiers ranked by Systemic Importance. Switch to Sponsor Live Bidding to see auction activity."** (drop the "17", split into two lines as user wrote it)
- In Sponsor view rows, also drop the "Tier {id}" label

### 5. Biochemistry banner restructure

In `Tiers.tsx` silver-frame block:

- Banner image stays at top
- Center text below image: **"Priority Research"** (medium weight, silver `#758A9C`)
- Bottom-right corner of banner: small link `⟩ ACS` (replaces "Top Priority Research · ACS Biochemistry") — link still opens [https://pubs.acs.org/journal/bichaw](https://pubs.acs.org/journal/bichaw)

### 6. New "Investments" CTA card in Vault & Earnings

In `Earnings.tsx`, **insert before the Withdraw card**:

```
┌─────────────────────────────────┐
│ 📈  Stake your Stablecoins      │
│     Safely — Multiply your      │
│     Earnings Passively          │
│                    [ Invest → ] │
└─────────────────────────────────┘
```

Card with `glow-amber`, TrendingUp icon, button navigates to `/investments` via `<NavLink>`. Button uses money color. Icon to be Non-Emoji and Showing just a Trend 

### 7. Opera WebView in Research (real, not mock)

Goal: when running on Android, the in-app browser uses **Opera's WebView** for stronger fraud / third-party protection.

Approach (web app context — Capacitor not currently installed):

- Detect runtime: `const isAndroidNative = !!(window as any).Capacitor?.isNativePlatform?.()`
- **Native path (when packaged with Capacitor on Android)**: install the `@capacitor/browser` plugin and call `Browser.open({ url, presentationStyle: 'popover' })` with a meta-flag `windowName: 'opera-webview'`. Add a thin native bridge: a documented `capacitor.config.ts` entry `OperaWebView: { enabled: true }` that the user (when exporting to Android Studio) wires to Opera's WebView (`com.opera.browser` custom-tabs / `OperaWebView` AAR). We expose a TypeScript wrapper `src/lib/operaWebView.ts` that:
  1. Tries `(window as any).OperaWebView?.open(url)` — present if the native shim is wired
  2. Falls back to Capacitor `Browser.open` with Opera's CustomTabs intent (`packageName: 'com.opera.browser'`)
  3. Falls back to standard `Browser.open`
- **Web preview path (current Lovable preview, no Android shell)**: render the existing iframe but with a clear "Opera WebView protections active when installed on Android" label; CSP/sandboxing hardened (`sandbox="allow-scripts allow-forms allow-popups"` — drop `allow-same-origin` to mimic Opera's stricter defaults)
- Update `BrowserPicker.tsx`: remove all engines except **Opera** (default + only choice). Keep the search input. Header changes to "Powered by Opera WebView (Android) · in-app preview here". Remove the emoji-grid; show one Opera badge card
- Update `InAppBrowser.tsx`: header label becomes `Opera WebView`; on mount, if `isAndroidNative`, call `operaWebView.open(url)` and immediately `onClose()` (handing off to native); otherwise show iframe as today
- Update `package.json`: add `@capacitor/core`, `@capacitor/browser`, `@capacitor/android` as deps. Add `capacitor.config.ts` at repo root with `appId: app.lovable.researchrewards`, `appName: ResearchRewards`, `webDir: dist`, plugin block for Browser
- Add `src/lib/operaWebView.ts` with the wrapper + Android export instructions in a leading JSDoc block

### Files to touch

- `src/components/icons/RoundVault.tsx` — redesign to match uploaded reference
- `src/components/AppLayout.tsx` — apply `#B0903D` to vault icon
- `src/pages/Earnings.tsx` — vault color, revert UsdcIcon→`$`, money color, weekly bar color, new Investments CTA card
- `src/pages/Dashboard.tsx` — revert UsdcIcon→`$` except All-Time hex-$ badge, money color
- `src/components/StablecoinWithdraw.tsx` — revert `$`, money color
- `src/pages/Tiers.tsx` — remove tier numbers, banner restructure, money color, header copy, revert `$`
- `src/pages/Research.tsx` — money color on session/article earnings
- `src/components/BrowserPicker.tsx` — Opera-only
- `src/components/InAppBrowser.tsx` — Opera WebView label + native handoff
- `src/lib/operaWebView.ts` (new) — wrapper
- `capacitor.config.ts` (new) — Android shell config
- `package.json` — add Capacitor deps
- `src/index.css` — `.text-money`, `.bg-money` utilities
- New tiny inline SVG `src/components/icons/HexDollar.tsx` — gold hexagon with `$` inside, color `#9A7246`

### Notes

- The Opera WebView native handoff only fully activates when the user exports the project to Android via Capacitor; in the Lovable web preview it falls back to the hardened iframe automatically with a visible label so behavior is correct in both contexts.
- Money color `#9A7246` is applied uniformly. Vault icon color `#B0903D` is applied to all vaults symbols.
- Tier IDs remain in the data model for routing/keys; only the visible "Tier N" labels are removed.