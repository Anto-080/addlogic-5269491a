## Plan

Five focused changes. All UI lives in existing files; one new asset, one new table for anonymized analytics, one tiny mutation hook.

---

### 1. Fix OpenAlex "Browse this topic" — open the actual paper URL, not a DDG search

**File:** `src/components/OpenAlexFeed.tsx`

Today the secondary "Browse this topic" button opens a DuckDuckGo News search built from the paper title. That's the "Text → Search → Outbound" overshoot you described.

- Remove the secondary "Browse this topic" button entirely from each result card.
- Keep only the **"Open paper"** button — clicking it sends `paperUrl` (OA mirror → landing page → DOI) directly through `onOpenUrl` → `useOutboundExit` → in-app outbound browser as a new group-tab.
- Keep the per-subcategory "Browse all on DuckDuckGo" chip at the top (that one is *meant* to be a topic search, not a paper).

---

### 2. Personal Research Chronology — collapsible + erasable + anonymized retention

**Files:** `src/components/ResearchChronologyCard.tsx`, `src/hooks/useResearchChronology.ts`, new migration.

- Wrap the chronology body in a `<Collapsible>` (default **closed**) so it doesn't dominate the Dashboard. Header shows count + chevron.
- Add a small **"Erase chronology"** button (trash icon) inside the open panel, with a confirm `AlertDialog`.
- New mutation `useEraseChronology()` that calls a Supabase RPC `anonymize_outbound_visits()` (security-definer). The RPC, in a single transaction:
  1. Inserts one aggregated row per `(tier_id, host)` into a new public table `**anonymous_research_analytics**` with: `tier_id`, `host`, `visit_count`, `total_dwell_seconds`, `bucket_week` (truncated to ISO week). **No `user_id`, no URL paths, no timestamps finer than week** → non-PII.
  2. Deletes the user's rows from `outbound_visits`.
- New table `anonymous_research_analytics` is **insert-only by authenticated**, **select for `service_role` only** (no per-user select); used internally for "for-profit analytical purposes" exactly as the cookie/data consent already covers.
- The existing zero-party cookie tier-seconds and bumps remain untouched — only the chronological row-level history is erased and folded into the anonymous aggregate.

---

### 3. Cookie auto-accept slide — replace placeholder lines, make AdBlock a hard gate

**File:** `src/components/CookieAuditSlide.tsx` (text), `src/pages/Dashboard.tsx` (gating order), `src/components/AdBlockConsentSlide.tsx` (button gating + copy).

- **Remove** the unhelpful sample lines that show up in the audit list (`sidebar:state`, `__dpl`, `session-id`, etc.). Replace the inline cookie-name list with a friendly summary: "We swept N cookies on this device — X first-party, Y third-party, Z written by AddLogic. Tap Continue when ready." Drop the raw entry list entirely (we still log them server-side via `persistAudit`, just hidden from the UI).
- **AdBlock gating becomes mandatory and persistent**, not just a one-time satisfied flag:
  - In `Dashboard.tsx` `handleCookieToggle`: when the user enables the cookie toggle, **always** open `AdBlockConsentSlide` first — drop the `adBlockSlideAlreadySatisfied()` short-circuit so the gate re-checks every session enable.
  - On every page load, if `cookieAutoAccept === true`, run an AdBlock probe (existing `useAdBlockDetector` polling 5s). If blocked → re-open the AdBlock slide as a hard overlay. User cannot interact with the rest of the app until the probe goes green.
  - The slide's "Continue" button stays disabled (dark, uncklickable) until `blocked === false`; when the detector flips to false, button enables, the slide closes, the cookie audit slide opens. (Most of this is already wired — we're just removing the "satisfied" memory and re-running the probe app-wide.)
- **Restore the motivation copy** on the AdBlock slide:
  > "Ad-blockers stop more than 60% of impressions, which depletes the redistributed research-grant pool. Whitelist AddLogic (or close your ad-blocker) so the rewards engine can credit your time and other researchers' work."

---

### 4. GPS toggle — friendlier copy, keep the anti-fraud teeth

**File:** `src/components/GeoConsentSlide.tsx` (copy + collapsing the technical block).

- Keep the FingerprintJS + IP/ASN + GPS-vs-IP-country checks (those are what stop bot farms — required).
- Hide the technical fingerprint/IP/ASN dump behind a `<Collapsible>` "Show anti-fraud details" link. Default closed.
- Rewrite the headline copy: "Share your approximate location to unlock regional ads and the location multiplier. We never see your address, contacts, or browsing history." Two big buttons: "Use precise (GPS)" and "Use approximate (IP)" stay.
- Same VPN/mismatch low-trust behaviour, just expressed as a small "Reduced trust mode — multiplier withheld" line instead of red walls of text.

---

### 5. Currency reframe — Time-Coins, Franklin quote, time-coin glyph next to `$`

**Asset prep:**

- Save uploaded `download.jpeg` (silver/blue infinity-hourglass medallion) as `src/assets/time-coin-medallion.jpeg` — used full-size on the Vault page.
- Save uploaded `Duck-ai-image-2026-05-01-20-27.jpeg` (mono hourglass coin) as `src/assets/time-coin-glyph.jpeg` — used as a small inline icon next to every `$` counter.

**New tiny component:** `src/components/icons/TimeCoinGlyph.tsx` — `<img>` with `borderRadius:9999px`, default size 14, configurable.

**Vault & Earnings page (`src/pages/Earnings.tsx`):**

- Replace the page subtitle and the in-app vault paragraph with the Time-Coins explanation:
  > "**AddLogic** doesn't pay per click or per ads watched — it pays for Your **Time&Experience**. Ads' revenue across all tiers is Pooled and redistributed by tier importance into **Time-Coins**, your *in-app tokenised balance*. Withdraw at any time, by redeeming Time-Coins & Experience Gained while Researching, for *Stablecoins* via your **MiniPay**. You can also convert to your local currency trough your **Google Wallet**.
  >
  > (*Small Operational Fees for Conversion*)
  >
  > &nbsp;
  >
  > -**W**e Encourage you to test the withdrawal functions for *Small Transactions*, while you're building Up Your Time-Coins Credits Alongside your Main Experience Bar.                    From Level **25** you'll be Provided with Experience-Based '**Research Grants**' Without the Need of Depleting the Advancement Bar you worked so hard for Filling.                      When you'll reach *Investment Level*, you'll be Aided with *Tailored Plans* for making **Zero-Risks** Automated **Passive Earnings** over the Sum of All of what you've Earned with your Time while you were Researching-                         *Keep on Searching your Favourite Interests* ! *A.*"
  &nbsp;
- Keep the Kiln link as-is.
- **Below the Kiln pill**, insert the medallion image (`time-coin-medallion.jpeg`, max-w 280px, centered, rounded), and underneath in italics:
  > *"Time Is Money"* — *Benjamin Franklin ·         The Free Thinker ·*
- In the four summary cards (Today / This Week / All Time / Streak Bonus) and in the Withdraw card, render `<TimeCoinGlyph size={18} />` immediately to the left of the `$` value.

**Dashboard (`src/pages/Dashboard.tsx`):**

- In the three earnings summary cards (`Today`, `This Week`, `All Time`), render `<TimeCoinGlyph size={16} />` immediately to the left of the `${value}` produced by `AnimatedCounter`.

**Wording sweep (no logic change, just copy) to avoid AdSense pay-per-click flags:**

- Remove "withdraw anytime" framing where it suggests instant per-action payout. The new vault copy already does this.
- Leave the actual Withdraw button working — only the *narrative* changes from "you earned $X, withdraw" to "you've earned X Time-Coins (≈ $X), redeem to withdraw".

---

### Technical notes

- New table SQL (concept):
  ```sql
  create table public.anonymous_research_analytics (
    id uuid primary key default gen_random_uuid(),
    tier_id integer,
    host text,
    visit_count integer not null default 0,
    total_dwell_seconds integer not null default 0,
    bucket_week date not null,
    created_at timestamptz not null default now()
  );
  alter table public.anonymous_research_analytics enable row level security;
  -- no select policy for authenticated; insert via security-definer RPC only
  ```
  Plus `create or replace function public.anonymize_outbound_visits() returns void language plpgsql security definer set search_path = public as $$ ... $$;` that aggregates and deletes inside one transaction, scoped to `auth.uid()`.
- AdBlock app-wide gate: lightweight wrapper inside `AppLayout` that, when `cookieAutoAccept` is on and the detector returns `true`, mounts `AdBlockConsentSlide` over the children (no route change).
- Outbound flow already routes through `useOutboundExit` → `ExitInterstitial` → `InAppBrowser`; OpenAlex change is purely removing the redundant button. New tab grouping is already handled by `useOutboundExit`.
- No edge function changes; no auth flow changes; no DB types regen needed beyond the new table.