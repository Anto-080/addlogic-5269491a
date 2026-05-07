## Goal

On the Research page, move the DuckDuckGo "BrowserPicker" search card from its current top position to the very bottom of the stack (below all other research cards), and permanently unlock it for every user — no more Level 25 gate.

## Changes

### 1. `src/pages/Research.tsx`
- Remove the `<BrowserPicker />` block from its current position near the top (right under the page heading).
- Re-insert it at the bottom of the content stack — after the `filteredArticles` list, just before the fixed bottom session bar / `<div className="h-20" />` spacer.
- Keep the same props (`onOpenResult` wired through `exit.requestExit`), but no longer pass `userLevel` (or pass a value that bypasses the gate) since it's now always unlocked.

### 2. `src/components/BrowserPicker.tsx`
- Remove the gating logic so search is always available:
  - Drop the `SEARCH_GATE_LEVEL = 25` constant.
  - Remove the `userLevel` prop (or accept and ignore it for backward-compat).
  - Remove the `gated` branch that renders the "unlocks at Level 25" lock card.
  - Remove the `if (gated) return;` guard inside `runSearch`.
- The classifier + results section becomes the default render path for everyone.

### Result

- Top of `/research`: heading → XP/multiplier card → tier filter chips → OpenAlex feed → Live news from Claude → article list.
- Bottom of `/research`: DuckDuckGo BrowserPicker (always usable, no level lock).
