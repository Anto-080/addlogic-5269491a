## What's actually wrong

I navigated to your published site and confirmed the root cause of most of your frustration:

- `https://addlogic.lovable.app/` still serves the **old build** — "ResearchRewards" title, old `/auth` route, no AddLogic branding.
- `https://addlogic.lovable.app/login` returns **404** — the new route exists in code but has never been pushed live.

Every recent fix (AddLogic branding, `/login`, Google OAuth redirect, lag reductions, real Supabase data) is sitting in the preview build only. The live domain has not been re-published since those edits. **Clicking Publish → Update is required to push them live** — code edits alone do not redeploy the published domain.

On top of that, two real code issues remain that cause the lag and the "still mock" XP bar:

1. `ExperienceBar` runs a 1-second `setInterval` *plus* a `setState` re-render every tick on every page that mounts it (Dashboard + Research). On Dashboard it's pointless because `earning={false}` — it still re-renders the whole bar every second and competes with the Switch toggles you reported as laggy.
2. XP / level / multiplier still come from `localStorage` seeded with `MOCK_EARNINGS` — never from the `user_stats` row that already exists in the database. So the Experience bar genuinely is mock.
3. `Research.tsx` still imports `MOCK_ARTICLES` and reads `getXpSnapshot().level` instead of the DB level.
4. `Tiers.tsx` pins Tourism+Real Estate to the **bottom of the list** instead of placing them inside the blue band where their colors belong.

---

## Plan

### 1. Re-publish the live domain (you do this, one click)
After I land the code fixes below, open Publish → **Update**. Without that step `addlogic.lovable.app` will keep showing the old "ResearchRewards" screen and `/login` will keep 404'ing — no code change can fix that for you.

### 2. Stop the Dashboard lag
- In `ExperienceBar.tsx`: only run the 1s ticker when `earning === true`. On Dashboard the bar will render once and stay still; toggles will respond instantly.
- Remove the `force` re-render path entirely on the dashboard side; subscribe to a tiny module-level event emitter so only the Research-room copy updates.
- Drop the `AnimatedCounter` 30 ms interval on Dashboard summary cards (3 of them × 40 ticks = 120 renders on every mount); replace with a single CSS transition.

### 3. Make XP / Multiplier truly live (kill the mock)
- Move XP, level, and `current_multiplier` reads/writes to the existing `user_stats` Supabase row via `useUserStats` + a small `updateUserStats` mutation.
- Keep a 1s in-memory accumulator while Research is open; flush to the DB every ~15s and on unmount. No `localStorage` mock fallback — show "—" until the row loads.
- Delete `MOCK_EARNINGS` consumption from `SettingsContext.tsx`.

### 4. Replace remaining mock imports
- `Research.tsx`: swap `MOCK_ARTICLES` → `useArticles()`, swap `getXpSnapshot().level` → `useUserStats().level`.
- `IdeasLibrary.tsx` + `Tiers.tsx` still pull `TIERS` from `mockData.ts` — switch to `useTiers()` (already exists), keep `mockData` only as the offline fallback inside that hook.

### 5. Fix tier ordering (chromatic scheme)
Use the natural multiplier-descending order so the blue band stays contiguous: Tech → Art → Global News → Entertainment → Food → **Tourism & Travel** → **Real Estate** → Personal Shopping → … . Remove the "pin to tail" logic that was shoving Tourism + Real Estate below the locked red bottom tiers.

### 6. Cleanup
- Remove the now-unused `setMultiplier` / `addXpForSeconds` / `getXpSnapshot` exports.
- Keep the `/auth → /login` redirect so old bookmarks work.

---

## Files I will touch
- `src/components/ExperienceBar.tsx` — gated ticker, no-op on Dashboard
- `src/contexts/SettingsContext.tsx` — drop XP store + MOCK_EARNINGS import
- `src/hooks/useAppData.ts` — add `useUpdateUserStats` mutation
- `src/pages/Dashboard.tsx` — remove AnimatedCounter interval
- `src/pages/Research.tsx` — live articles + live level + DB-backed XP flush
- `src/pages/Tiers.tsx` — restore chromatic order
- `src/components/IdeasLibrary.tsx` — live tiers

## What will NOT change
- Auth code, Google OAuth wiring, `/login` route, `/auth` redirect — already correct, the only thing missing is republishing.
- Database schema — `user_stats` already has `xp`, `level`, `current_multiplier`.

## After I finish
You click **Publish → Update**. Then `addlogic.lovable.app/login` will load the AddLogic page and Google sign-in will land on `/dashboard`. If it still shows ResearchRewards after publishing, that's a stale CDN cache — hard-refresh (Ctrl/Cmd+Shift+R) once.

Approve and I'll execute.