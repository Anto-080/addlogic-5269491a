## Plan

### 1. FingerprintJS Pro via env vars + global context

**Package**
- `@fingerprintjs/fingerprintjs-pro` is already installed. Keep it.

**Env vars (build-time, Vite)**
Two new env vars are required:
- `VITE_FP_PUBLIC_KEY` — your Fingerprint Pro **public** browser key
- `VITE_FP_ENDPOINT` — your Pro endpoint URL (e.g. `https://fp.add-logic.com` if you have a custom subdomain, or `https://eu.api.fpjs.io` for the default EU endpoint)

Because the project's `.env` is auto-managed by Lovable Cloud and cannot be edited, these must be added in **Workspace Settings → Build Secrets** (they need the `VITE_` prefix so Vite bundles them at build time). I'll instruct you exactly where to paste them once you approve.

**New files**
- `src/contexts/FingerprintContext.tsx` — `FingerprintProvider` + `useFingerprint()` hook.
  - Reads `import.meta.env.VITE_FP_PUBLIC_KEY` and `import.meta.env.VITE_FP_ENDPOINT`.
  - Calls `FingerprintJS.load({ apiKey, endpoint: [VITE_FP_ENDPOINT, FingerprintJS.defaultEndpoint] })` once on mount.
  - Exposes `{ visitorId, requestId, loading, error, refresh() }` via context.
  - `refresh()` forces a fresh `.get()` (used by PostLoginGate "Re-check" and the drift watcher when device changes).

**Refactor**
- `src/lib/fingerprint.ts` becomes a thin adapter over the new context (keeps `getVisitorId` / `getVisitorEvent` for the watcher and edge call) so the existing edge-function fetch of the public key is removed.
- `src/App.tsx` wraps the tree in `<FingerprintProvider>` above `<PostLoginGate>`.
- `supabase/functions/fingerprint-signals/index.ts` keeps its **POST** branch only (server-side Smart Signals lookup by `requestId` with the workspace ruleset). The GET config branch is removed because the public key now lives in env.

**Block logic** stays exactly as it is today: only `rulesetAction === "block"` from the workspace ruleset `rs_kd5z5fhUgyMT49` blocks. No local heuristics.

### 2. Permanent phone-OTP link on Withdraw (Twilio)

**Approach**
- Use the **Twilio connector** (via Lovable connector gateway) to send and verify OTP codes from an edge function. This is the cleanest path since the Twilio connector is already available in the workspace and avoids needing you to wire Twilio into the Supabase Auth dashboard separately.
- The verified phone is attached **permanently** to the user via `supabase.auth.updateUser({ phone })` (and mirrored to `profiles.phone` for display).

**Backend**
- New edge function `phone-otp` with two actions:
  - `start`: validates phone (E.164, zod), generates 6-digit code, stores `{user_id, phone, code_hash, expires_at, attempts}` in a new `phone_otp_challenges` table, sends SMS via Twilio gateway (`/Messages.json`).
  - `verify`: checks code + expiry + attempts, on success writes `phone` to `auth.users` via service role + upserts `profiles.phone`, deletes the challenge.
- New table `public.phone_otp_challenges` with RLS (users can only read their own), proper GRANTs, 10-minute expiry, max 5 attempts.
- Twilio connector linked via `standard_connectors--connect` (you'll see the picker).

**Frontend**
- New `src/components/PhoneOtpDialog.tsx`:
  - Step 1: country code + phone input → calls `phone-otp` `start`.
  - Step 2: 6-digit OTP input → calls `phone-otp` `verify`.
  - Step 3 (success screen): shows masked phone + user ID + a "Log out" button.
- `src/components/StablecoinWithdraw.tsx`:
  - Reads `profiles.phone`. If absent → Withdraw button opens `PhoneOtpDialog`. After success, the actual withdrawal proceeds. If present → Withdraw runs directly (one-time setup, as requested).

### 3. Sidebar logout

- Add a "Log out" button at the bottom of `src/components/AppSidebar.tsx` (icon + label, collapses to icon-only in compact mode) that calls `signOut()` from `useAuth` and navigates to `/auth`.

### What I'll need from you after approval

1. Add **build secrets** in Workspace Settings → Build Secrets:
   - `VITE_FP_PUBLIC_KEY` = your Fingerprint Pro public browser key
   - `VITE_FP_ENDPOINT` = your Fingerprint Pro endpoint (custom subdomain or `https://eu.api.fpjs.io`)
2. Approve the Twilio connector link prompt when it appears.
3. Make sure the Twilio number you use is **SMS-capable** for the destination countries, and enable **SMS Pumping Protection** + **Geo Permissions** in the Twilio console before going live.

### Files touched

```text
NEW   src/contexts/FingerprintContext.tsx
NEW   src/components/PhoneOtpDialog.tsx
NEW   supabase/functions/phone-otp/index.ts
NEW   supabase/migrations/<ts>_phone_otp.sql        (phone_otp_challenges + profiles.phone)
EDIT  src/lib/fingerprint.ts                        (use context, drop edge-key fetch)
EDIT  src/App.tsx                                   (wrap in FingerprintProvider)
EDIT  src/components/AppSidebar.tsx                 (logout button)
EDIT  src/components/StablecoinWithdraw.tsx         (gate behind phone link)
EDIT  src/components/PostLoginGate.tsx              (use useFingerprint().refresh)
EDIT  src/lib/sessionWatcher.ts                     (read visitorId from context cache)
EDIT  supabase/functions/fingerprint-signals/index.ts  (POST-only, drop GET config)
```

No changes to the existing block ruleset, GeoConsentSlide UX, or any other unrelated screen.
