## Plan: Real Vault SVG fix, Level 100 card visual lock, and Ideas Library

### 1. Vault icon — actually redraw to match the reference

The current `RoundVault.tsx` doesn't visually match the uploaded reference. Rewrite it as a faithful SVG of the reference vault door:

- Outer thick ring (gold `currentColor`, stroke ~8% of viewBox)
- 8 perimeter rivets evenly spaced on the ring
- Inner recessed circle (slightly darker via `fill-opacity`)
- Central 5-spoke turning handle with a round hub and rounded spoke ends
- Square-ish hinge bracket on the left Aligned/Leveled with the Vault Door's Circle, latch bolt on the right
- Small keyhole below the handle hub
- Single `currentColor` so the parent `style={{ color: "#B0903D" }}` keeps the gold tint

I'll verify alignment using the existing `/dev/vault-diff` overlay route before declaring done (will set blend mode to "difference" mentally against `vault-reference.png`).

### 2. Level 100 card — force the `#D1DEFB` background to actually render

The `.bg-circular-economy` utility exists in `index.css` but the card markup in `Investments.tsx` still mixes Tailwind `bg-card` and inline color overrides that win the cascade. Fix:

- Remove `bg-card` from the Card when unlocked; rely solely on `.bg-circular-economy`
- Strengthen the utility to also cover `[data-state]` and child `CardHeader`/`CardContent` which inherit no bg but visually bleed when a parent class loses
- Confirm the unlocked `CardHeader` and `CardContent` have transparent backgrounds so the `#D1DEFB` shows through
- Keep text color `#0E2A47` for contrast (already set)

### 3. Ideas Library — new collapsible attachment under the Level 100 card

Add a new `<Collapsible>` block immediately under the ∞ Circular Economy card content (still inside the unlocked branch). Header: "Ideas Library" with a chevron. Inside, a two-tab slider (`Tabs` from shadcn) with two sides:

#### Side A — Researchers: "Submit Idea" With a  Underneath banner Citing : "*Yours Ideas will be Protected by Copyright Laws ©"*

A form styled like `Offers.tsx`'s "Place Offer":

- **Tier** — `Select` of all Updated tiers (icon + name) from `mockData and/or Tiers Section`
- **Idea Name** — `Input` (max 80)
- **Core Concepts** — `Textarea` (max 600)
- **Functionality /Sector Improvement**s — `Textarea` (max 400)
- **Keywords** — `Input` parsed into `#hashtag` chips on Enter/comma
- Submit button (gold). On submit: prepend to local list (in-memory `useState`; mock for now, will move to Supabase when the user asks).

Below the form, a list of submitted ideas. Each row:

- Tier icon + Idea name (clickable header)
- Collapsed by default; expanding reveals Core Concepts, Functionality, Keywords
- Footer line: Meta / LinkedIn glyphs (linking to the user's connected profile when present via `socialOAuth` storage), plus username and `Lv {level}` rank from `MOCK_USER`

#### Side B — Companies: Search & ∞InfiniTag

- Search `Input` at top to filter ideas by name/keyword/tier
- Horizontal scroll row of the Updated Tier icons as filter chips
- Mini form: single `Input` to submit an `∞InfiniTag` (auto-prepends `∞`, strips spaces) + Tier `Select` + "Purchase Tags" button (gold, mock — opens a toast "Tag purchased — 10$/Week" or "1 Token/1% Interest" for now; real Stripe wiring deferred until the user asks)
- Below: a noticeboard grid of submitted `∞InfiniTags` as cards showing the tag, tier icon, and timestamp. Seeded with the six examples from the brief (`∞RainyDayMorningHappines` / Food, `∞QuantumProcessorLiquidCooling` / Technology, `∞PlotTwistNoirMovie` / Entertainment, `∞SustainablePermaculturalProjectAfrica` / Ecology & Natural Biomes, `∞PetricoreBodyShampoo` / Personal Care, `∞ConfortabelImpermeableTravellingBodywear` / Clothes & Accessory)

State is local `useState` for now; the data shape is structured so it can move to Supabase tables (`ideas`, `infinitags`) in a later turn without UI rework.

### 4. Files touched

- `src/components/icons/RoundVault.tsx` — full SVG rewrite to match reference
- `src/index.css` — strengthen `.bg-circular-economy` selector specificity
- `src/pages/Investments.tsx` — drop `bg-card` on unlocked card; mount new `<IdeasLibrary />`
- `src/components/IdeasLibrary.tsx` — **new**, contains the Tabs, both forms, lists, noticeboard
- (uses existing `Tabs`, `Collapsible`, `Select`, `Input`, `Textarea`, `Button`, `Card` shadcn primitives — no new deps)

### Notes

- "Purchase Tags" is a UI stub in this turn (toast only). Real Stripe checkout for InfiniTag credits is a follow-up: enable Lovable Cloud Stripe → create a "InfiniTag credit" product → wire button to checkout session. Tell me when to proceed and I'll run that flow.
- Ideas and InfiniTags are in-memory until you confirm the schema; nothing persists across reloads yet.
- Meta/LinkedIn footer on each idea reads from existing `localStorage` keys written by `socialOAuth.ts`; if a user hasn't connected, only username + level show.