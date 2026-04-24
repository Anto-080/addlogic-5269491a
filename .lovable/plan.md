## Plan

### 1. Fix login redirect and branding mismatch first

- Move the app’s public auth screen off `/auth` to a route that does not collide with Lovable-hosted auth behavior, such as `/login`.
- Add a dedicated post-OAuth handling path/loading state so Google sign-in waits for session restoration before deciding whether to show login or send the user into the app.
- Keep both email/password and Google sign-in, but make them use one consistent entry flow and one consistent redirect target.
- Replace the remaining old auth branding so the login surface, page title, and published copy all say **AddLogic**.
- Update the auth hero styling to match your requested brand treatment: **“Add” in carbon black with gold surround, “Logic” in emerald `#004627**`.

### 2. Remove the new lag and make navigation fluid again

- Strip out the background behaviors that now keep re-rendering or running timers unnecessarily.
- Fix the leaked/incorrect timer logic in Research, remove the constant tier reshuffle behavior in Tiers (place Travel & Tourism  above Real Estate), and trim expensive global observers tied to cookie auto-accept.
- Keep the app responsive by reducing always-on work in layouts/pages and limiting live updates to the components that truly need them.
- Clean up the current dialog/accessibility errors that are polluting runtime behavior.
- Verify that Dashboard toggles, page switches, and Research interactions feel as fast as they did before today’s regressions.

### 3. Replace the remaining fake experience and mock-driven logic with real backend data

- Make `user_stats` the source of truth for **XP, level, earnings, multiplier, streak**, instead of local mock/localStorage-only experience state.
- Rework the experience bar so it displays persisted user data and updates from real research activity rather than mock seed values.
- Replace remaining `mockData` usage across the app with live queries for tiers, research content, offers, sponsor data, and user progress.
- Wire Research reading actions to real backend writes so milestones, weekly earnings, and XP progression actually change over time.
- Remove the last visible “production-looking but fake” sections or clearly re-scope them if they still need backend tables.

### 4. Add real admin access with secure feature locking

- Create a proper admin role system using a separate roles table.
- Seed your current account as the first admin so you can immediately access admin controls.
- Add backend-managed feature flags / lock states so **admin** can lock or unlock features independently of normal user progression.
- Build an admin-only management screen to control:
  - feature availability
  - tier locks
  - key app sections that should be enabled/disabled for users
- Update user-facing pages so they respect admin locks from the backend instead of relying only on local level checks or mock booleans.

### 5. Correct the Opera and Facebook integration story

- Separate what works on Lovable web hosting from what only works in a native mobile shell.
- Keep a clean browser fallback for web, and stop pretending the Lovable server can fully test native Opera WebView behavior when it cannot.
- Refactor the Opera code so web preview uses a supported browser flow, while native-only hooks stay isolated for future mobile packaging.
- For **Facebook Audience Network / Live advertising bid SDK**: do a proper feasibility pass and only add a real integration boundary if it is supported in this stack. If it is not supported for this web app, I will remove the misleading fake path instead of shipping broken SDK code.

## Technical details

### Frontend files to update

- `src/App.tsx`
- `src/pages/Auth.tsx`
- `src/hooks/useAuth.tsx`
- `src/contexts/SettingsContext.tsx`
- `src/components/ExperienceBar.tsx`
- `src/hooks/useAppData.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/Research.tsx`
- `src/pages/Tiers.tsx`
- `src/pages/Earnings.tsx`
- `src/pages/Offers.tsx`
- `src/pages/Investments.tsx`
- `src/components/IdeasLibrary.tsx`
- `src/components/InAppBrowser.tsx`
- `src/components/BrowserPicker.tsx`
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- dialog-related UI files that are triggering current runtime warnings

### Backend changes

- Add secure admin roles:
  - `app_role` enum
  - `user_roles` table
  - `has_role()` security definer function
- Add admin-managed feature configuration tables for locks/toggles
- Add any missing content/progression tables needed to remove the remaining mock logic
- Keep RLS on all private/admin data
- Do not store roles on `profiles`

### Key implementation rules

- Google auth stays on Lovable Cloud’s managed flow
- Roles will be server-validated, never client-only
- Experience/progression will persist in the backend, not only in localStorage
- Web preview and published app behavior will be aligned so auth and branding are consistent
- Unsupported SDKs will not be faked as “working”

## Expected outcome

After this pass:

- Google and email login should enter the app reliably
- the login page will show **AddLogic**, not the old name
- navigation should feel fluid again
- the experience bar will use real persisted progress
- admin will be able to lock/unlock features safely
- Opera behavior will be honest and stable for web
- Facebook SDK work will either be integrated correctly or explicitly isolated if the platform does not support it