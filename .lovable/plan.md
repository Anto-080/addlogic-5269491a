# Fix-up plan

## 1. PLOS logo sizing (`PlosCard.tsx`)

- Roll PLOS bitmap back to the original asset (no ivory pill, no shrink).
- Match the Biochemistry tier-icon footprint exactly: render at `h-10 w-10` square container, `object-contain`, no max-width clamp.
- Remove the `.brand-asset` ivory wrapper introduced last round; keep just the `.brand-asset` class on the `<img>` so colours stay stable preview↔live.

## 2. Sidebar AddLogic "A" mark (`AppSidebar.tsx`)

- Re-crop `src/assets/addlogic-mark.jpg` via `imagegen--edit_image` to a true circular crop where the orange circled-A fills the frame with a thin green ring (no oval letterbox).
- Render in a `h-8 w-8 rounded-full overflow-hidden` container with `object-cover` on the new square asset, no extra ring.

## 3. Mistral mark (`src/assets/mistral-mark.svg`, `Tiers.tsx`, `Research.tsx` magnetic bar)

- Replace the current hand-drawn SVG with the official Mistral "M" (transparent background — strip white via edit_image from the uploaded original).
- Use it everywhere a red ✨ currently sits next to AI-derived content: tier subcategory chips AND the "Interest locked to this query" magnetic bar shown on the Research page after a search.

## 4. Anthropic + OpenAlex feed framing (`OpenAlexFeed.tsx`, anywhere the Anthropic news card lives — likely `Dashboard.tsx` / a curated-news card)

- Replace the red translucent border/ring around the Anthropic news feed and the OpenAlex "Browse all" CTA with a neutral muted-green token (`hsl(var(--money) / 0.35)` border + matching subtle bg).
- Add `src/assets/anthropic-mark.png` (copied from the second uploaded image, background stripped) and swap the red ✨ next to Anthropic items for this mark.

## 5. AI Interest Lock-in is now query-driven, site-wide (multiplier source of truth)

- Tier icons in Research/Tiers stop triggering any multiplier or interest change on click — they become pure navigation/visual.
- Mistral classifier (already wired into `classify-interest`) is the ONLY thing that locks an interest. It must run from every search bar: PLOS (`PlosCard`), DuckDuckGo (`SearchResults`/`useWebSearch`), OpenAlex (`OpenAlexFeed`).
- New `lockInterestFromQuery(text)` helper in `src/lib/interestLock.ts`: calls `useClassifyInterest`, writes `user_stats.current_multiplier` server-side, stamps `locked_at = now()` and `locked_query` into a new lightweight `interest_lock` row (or reuses `user_stats` with two new columns `locked_query text`, `locked_until timestamptz`).
- `ExperienceBar`'s 1 s accumulator only ticks when `now() < locked_until`. After 5 min of no new search the multiplier returns to 1× and XP accrual pauses.
- Migration: add `locked_query text`, `locked_until timestamptz` columns to `user_stats`; classify-interest sets `locked_until = now() + interval '5 minutes'`.

## 6. Interstitial → unskippable 5 s timer (`ExitInterstitial.tsx`)

- Resize the modal to match the full-page Ad-Block/GPS card footprint (same `max-w-md` + tall hero area).
- Replace the "click the ad to continue" gate with a 5 s countdown. The outbound `Go to <host>` button is disabled with a live "Go in 5… 4…" label and becomes clickable at 0.
- Keep the existing star-rating block under the ad (leave logic untouched; note for future ad-system upgrade).
- Ad slot inside the card grows to fill the new card (~`aspect-[4/3]`).

## 7. Force-dark-mode notice (`Settings.tsx`)

- Try a soft request first: add `<meta name="color-scheme" content="dark">` to `index.html` and `color-scheme: dark` on `:root` in `index.css` so Chromium's auto-dark skips us.
- Add a small info row in Settings → Appearance:
  > "If colours don't display correctly, try deactivating 'Force Dark Mode' in your browser's theme settings."

## 8. Cookie + GPS toggle rewording with lock-in memory (`CookieAuditSlide.tsx`, `GeoConsentSlide` or wherever the dashboard toggles live — check `Dashboard.tsx`)

- Cookie toggle:
  - Headline: **"Cookies Acceptance & Profile Sync"**
  - Body: "Accept First, Third Party & Commercial Cookies, Create '<span class=text-crimson>Zero Party Data&nbsp;' generated from User's on-Site Experience."
  - Badge: **×2 multiplier** when ON.
- GPS toggle:
  - Headline: **"GPS & Non-PII Data Analytics Consensus"**
  - Body: "Allow GPS Location Retrieval and Generation of Non Personal (Non-PII) Anonymous Data for Commercial Analytical Purposes, Providing More Targeted Advertising for Your Researched Interests with Higher Retribution Potential. Regional Offers & Proximity Users Affinity Available Only when this Feature is Activated."
  - Badge: **×5 multiplier** when ON, and only visible/active for users who chose precise GPS at the post-login gate.
- Re-introduce the additive multiplier path: the *base* multiplier is `1 + (cookies?2:0) + (gps?5:0)` and the Mistral query multiplier multiplies it during the 5-min lock window. (This restores the user's original economic intent without re-coupling permissions to query-lock.)
- Under each main toggle add a small vertical sub-toggle with a non-emoji `Lock` icon labelled "Remember choice across sessions". When ON, the choice is persisted to `profiles.preferences` (jsonb, new column) so future logins skip the prompt→ if GPS is On in user Device; when OFF, choice is session-only.

## 9. Post-login banner copy addition (`GeoConsentSlide.tsx`)

- Keep existing intro paragraph verbatim.
- Append a second paragraph: "In the proximate future: Geolocation will allow you to check Places of Interest usually frequented by individuals sharing same types of interests. You'll also be enabled to better connect with users of similar interest affinity who accepted to exchange Contact Cards with you."
- Fraud-detection collapsible left untouched.

## Technical notes

- New migration: `ALTER TABLE user_stats ADD COLUMN locked_query text, ADD COLUMN locked_until timestamptz;` + `ALTER TABLE profiles ADD COLUMN preferences jsonb NOT NULL DEFAULT '{}'::jsonb;`. RLS already covers both tables via existing user-owned policies.
- `classify-interest` edge function: after computing multiplier, set `locked_query`, `locked_until = now() + interval '5 minutes'`, and base multiplier resolution now reads cookie/GPS flags from `profiles.preferences` so server is source of truth.
- New assets: `src/assets/anthropic-mark.png`, refreshed `src/assets/addlogic-mark.jpg` (square circular crop), refreshed `src/assets/mistral-mark.svg` (official M, transparent).
- Files touched: `PlosCard.tsx`, `AppSidebar.tsx`, `Tiers.tsx`, `OpenAlexFeed.tsx`, `Dashboard.tsx`, `Research.tsx`, `ExitInterstitial.tsx`, `ExperienceBar.tsx`, `GeoConsentSlide.tsx`, `CookieAuditSlide.tsx`, `Settings.tsx`, `index.html`, `index.css`, `classify-interest/index.ts`, new `src/lib/interestLock.ts`, new migration.

## Open question

For the cookie/GPS "Lock choice across sessions" sub-toggle: when OFF, should the user be re-prompted on every new login (current behaviour), or only when the session storage is cleared? Default I'll implement: **re-prompt on every new login** unless the lock is engaged and the GPS is Retrievable.

[User is Re-prompted only if Geolocation is not Retrievable due being Deactivated on User Smartphones.]