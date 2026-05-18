# Plan

## What I’ll change

1. **Make Mistral lock-in the only source of Research XP/multiplier activation**
   - Remove the remaining coupling where clicking tier icons or sitting on the Research page can still imply an active earning context.
   - Change the shared Research XP bar to read only from the backend lock state (`locked_query`, `locked_until`, `current_multiplier`) and never from the clicked tier UI.
   - Keep tier icon clicks purely as a browsing/filtering choice for content visibility, not an earning trigger.

2. **Unify all search bars under the same lock-in flow**
   - Refactor PLOS, DuckDuckGo, and OpenAlex search entry points to use one shared site-wide lock helper instead of mixed logic.
   - Ensure every search submission:
     - classifies through Mistral,
     - persists keywords/subcategories,
     - stores the locked query and 5-minute timer,
     - refreshes `user_stats` immediately,
     - optionally updates the visible selected tier in the UI without making the UI itself the earning source.

3. **Restore cookie/GPS bonuses as part of the lock multiplier source of truth**
   - Reattach `x2 cookies` and `x5 GPS` to the server-side multiplier calculation, so the lock result includes those bonuses again.
   - Stop mixing frontend-only bonus math into the Research XP display where it can drift from the persisted backend value.
   - Keep the backend-stored multiplier as the authoritative number used by the XP bar.

4. **Add the two small “lock for future sessions” toggles under Cookies and GPS**
   - Add a smaller secondary toggle under each main permission control, with a non-emoji lock icon.
   - These sub-toggles will decide whether the user’s decision is remembered across sessions.
   - Store those memory preferences in the backend profile preferences so they persist reliably beyond the current browser session.
   - Update the settings/context flow so session-only permission state and cross-session remembered preference are handled separately and consistently.

5. **Tighten the approximate-location VPN path so the security rule is explicit in behavior**
   - Review the post-login gate flow and app-wide VPN guard together so the approximate-location branch cannot be interpreted as a permissive path when a VPN/proxy is active.
   - Align the entrance-card wording/logic with the hard-block rule: approximate location must never grant access if the connection is flagged as VPN/proxy/datacenter.
   - Preserve the anti-fraud collapsible content itself unless a wording adjustment is strictly needed for consistency.

6. **Update the security memory to match the real business/security model**
   - Rewrite the security memory so it clearly states:
     - users must never be able to alter balance / XP / protected stats directly,
     - VPN/proxy/datacenter traffic must never access the app,
     - these rules are essential to the app’s economics and privacy model,
     - anything that weakens them should be treated as a real vulnerability, not a benign scanner inconsistency.
   - If any current scanner interpretation needs an explicit ignore/fix note, I’ll sync that too.

## Technical notes

- **Files likely involved**
  - `src/pages/Research.tsx`
  - `src/components/ExperienceBar.tsx`
  - `src/components/BrowserPicker.tsx`
  - `src/components/PlosCard.tsx`
  - `src/components/OpenAlexFeed.tsx`
  - `src/hooks/useLockInterest.ts` and/or `src/lib/interestLock.ts`
  - `src/contexts/SettingsContext.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/components/PostLoginGate.tsx`
  - `src/components/GeoConsentSlide.tsx`
  - `src/lib/vpnDetection.ts`
  - `supabase/functions/classify-interest/index.ts`

- **Backend data likely needed**
  - Reuse `profiles.preferences` for remembered cookie/GPS decisions and their new lock-state flags.
  - No new role model changes.
  - Schema migration only if the existing `preferences` JSON shape proves insufficient for clean persistence.

- **Validation after implementation**
  - Confirm that passive idle presence in Research no longer advances XP unless a search created an active lock window.
  - Confirm PLOS, DuckDuckGo, and OpenAlex all start the same 5-minute lock flow.
  - Confirm cookie/GPS bonuses are reflected in the stored multiplier.
  - Confirm remembered lock toggles persist across sessions.
  - Confirm approximate-location users on VPN/proxy remain blocked and the security memory reflects that rule clearly.