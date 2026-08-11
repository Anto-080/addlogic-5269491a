# PLOS panel, Field Experience rebalance, filing-cabinet tier cards

## 1. Research page — collapsible PLOS panel

- Upload the hippocampal-synapses GIF as a CDN asset and use it as the backdrop image of the PLOS block.
- Closed state: a single full-width strip showing the PLOS logo stretched across the whole card width, clearly legible, acting as the collapsible trigger.
- Open state, in this order:
  1. The GIF backdrop with the PLOS logo overlaid on top of it (logo centred, readable over the animation).
  2. The search row — input rendered fully transparent (no filled background, thin border, text readable over the surrounding surface).
  3. The LinkedIn "For Selected Scientists" button in solid Evergreen `#05472A`.
- Existing behaviour kept: PLOS search results, Mistral magnetic-lock badge, outbound-link handling, LinkedIn visibility gate.

## 2. Tier list — use the current 21-tier list everywhere

The XP logic still assumes an old 17-item list and clamps tier ids at 17, so tiers 18–21 (Tourism, Sciences, Energy, Women's Interests) all fall back to wrong values. Replace id-arithmetic with lookups against the real ordered tier list, so every tier — including 18–21 — gets its correct rank, colour and XP rate.

## 3. Field Experience: Science field → Sport field

- Base field-experience multiplier becomes a flat **1.5** for every graded tier, added to the lifetime multiplier once per level passed.
- XP required per level runs from **50,000** at the Sciences end down to **1,000** at the Sports & eSports end, using an **exponential decay** across the graded band, so higher tiers are far slower to level. This is the discouragement mechanism: only genuinely interested researchers climb the high tiers.
- The overall (global) experience multiplier per tier is unchanged.
- **Excluded from the graded band:** Top-Tier Research (tiers 1–3), Adult Entertainment and Betting Services. Their bars render greyed and non-ticking, labelled as a separate progression arriving later.
- Bar copy updates: show the tier's own XP-per-level requirement instead of the old fixed 1,000, and show the flat 1.5 base rather than the old inverted rate.

## 4. Tier card graphics — old filing-cabinet folders

- Keep the current layout; make each card's tint **less transparent and more vivid** while staying matte/opaque — no glow or highlighter effect.
- Move the solid colour bar from the left edge to a **full-width line across the top** of each card, as a colour identification code.
- Reshape each card as an **old paper folder**: a tab notch at the top-left of the card silhouette, slightly warm paper texture, soft folded-edge shading and a subtle bottom crease, so the list reads like a filing cabinet drawer.
- Scroll-reveal and click-to-glow behaviour from the Investment Phase cards is preserved.

## Technical notes

- `src/lib/zeroPartyCookies.ts`: replace `tierXpRate`/`TIER_XP_PER_LEVEL` with a tier-rank-driven `xpPerLevelForTier(tierId)` (exponential 50,000 → 1,000 over the graded ranks) plus a `FIELD_BASE_MULTIPLIER = 1.5` constant and an `isGradedTier(tierId)` guard; `tierLevelFromSeconds` takes the per-tier XP requirement.
- `src/components/TierExperienceBar.tsx`: use the new helpers, render the locked/greyed variant for excluded tiers, keep the Ash Gold `#8C6F54` fill.
- `src/components/PlosCard.tsx`: wrap the whole block in a Collapsible; add the GIF backdrop layer, transparent input and Evergreen button.
- `src/pages/Tiers.tsx`: `tierSurface` gains stronger tint, top colour line, folder silhouette (clip-path tab + paper texture).
- Asset: `lovable-assets create` from the uploaded GIF, referenced via an `.asset.json` pointer.
