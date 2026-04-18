**Goal**: Three focused refinements to bring the prototype back in line with the original vision.

---

### 1. Dashboard — Split Data Consent & GPS into two distinct toggles (same card)

In `src/pages/Dashboard.tsx`, replace the single merged toggle with **two side-by-side toggle rows** inside one `Card`, separated by a divider. Both styled like the Settings availability toggle (icon + label + description + Switch).

**Row A — Data Consent**

- Icon: `Cookie` from lucide-react (Golden Brown  tint)
- Title: "Accept All Cookies"
- Description: "Allow the app to accept all cookies while you surf. Unlocks higher rewards and rewarded videos."
- State: `dataConsent` / `setDataConsent`

**Row B — GPS Precision**

- Icon:  `Map` from lucide-react, stylized
- Title: "GPS Precision Targeting"
- Description: "Share live location for premium-priced ads, exclusive regional coupons (unlocks a Wallet coupons section), highest-paying spots & videos, and a bonus XP multiplier. Drains battery faster."
- State: `gpsEnabled` / `setGpsEnabled`
- When ON, conditionally show a small note: "✓ Regional Coupons unlocked in Wallet (mock)"

Each toggle independent — no longer linked.

---

### 2. Investments page — Rethink the Circular Economy / ∞ section

In `src/pages/Investments.tsx`:

**a) Move and enlarge the ∞ symbol to the TOP of the page**, before the "Level 50 Required" card. It becomes the page's hero banner. Replace the small inline SVG with a **large, centered infinity** Image spanning most of the card width (~h-32 to h-40). azure `#1D5DEC` gradient + pulse when 

Add hero copy beneath it:

> "Infinite Revenue Stream — Delta-neutral strategies and collective investment pools generate passive yield while you research. Set it once; let it compound."

**b) Replace the JPG globe** (`src/assets/circular-economy-globe.jpg`) with an **inline 8-bit / pixel-art style SVG** built directly in the component, matching the visual language of the Settings smiley/ghost icons. Concept:

- A simple pixel-grid globe (chunky squares forming a circle with continent blocks)
- 4 chunky pixel arrows orbiting it in a circle (top, right, bottom, left), each rotated 90°
- Color: muted gray-blue when locked; bright azure `#1D5DEC` when unlocked
- Built with a small grid of `<rect>` elements inside one SVG, ~120×120px
- No external image file needed — keep the asset for now but stop importing it

**c) Keep** the existing "Sponsor ↔ Researcher Loop" explanation text and the Level-100 progress bar, but place them *below* the new hero ∞ banner so the page reads: ∞ hero → locked-status card → 4 phase cards → circular-economy detail card with pixel globe.

---

### 3. Layout reordering on Investments page

New order top-to-bottom:

1. Page title
2. **NEW: ∞ hero banner card** (full-width, prominent)
3. Existing "Level 50 Required" card
4. 4-phase grid
5. Circular Economy class card (now with pixel-art globe SVG instead of JPG)

---

### Files to edit

- `src/pages/Dashboard.tsx` — split the merged toggle into two rows with Cookie + MapPin icons
- `src/pages/Investments.tsx` — add ∞ hero at top, replace `<img>` with inline pixel-art SVG globe
- `src/index.css` — possibly tweak `.infinity-active` sizing if needed (likely no change)

### Files NOT touched

- `src/assets/circular-economy-globe.jpg` left in place (orphaned, harmless)
- Tier system, Settings, Earnings, Research, Sponsors — untouched

---

### Technical notes

- Pixel-art SVG: use `shape-rendering="crispEdges"` so squares stay sharp
- Both new dashboard toggles use the existing `Switch` component and `glow-amber` card styling
- ∞ hero stroke width increases to ~10–12 to feel monumental at large size
- Conditional "Regional Coupons unlocked" text uses muted-foreground + check icon, no new route

This is a focused 2-file change — should land cleanly in one pass.