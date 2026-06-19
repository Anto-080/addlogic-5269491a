## What's actually broken

The Cloudflare → GitHub pipeline is working fine. The latest commit (`36fa701`) cloned, `bun install` ran, `vite build` produced `dist/assets/index-yKM2Aaw2.js`, Cloudflare uploaded 19 files and reported `Success: Your site was deployed!`.

The blank dark-green page on https://add-logic.com is **not** a React, Vite, Cloudflare proxy, or SSL problem. The browser console shows one fatal error:

```
Uncaught Error: supabaseUrl is required.
  at Cq (index-yKM2Aaw2.js)   ← createClient()
  at Nq (...)                  ← src/integrations/supabase/client.ts
```

Meaning: at Cloudflare Pages **build time**, `import.meta.env.VITE_SUPABASE_URL` was `undefined`, so `createClient(undefined, undefined)` is baked into the bundle, throws on first import, React never mounts, and you see only the body background color.

### Why the env vars are missing on Cloudflare

`.env` is committed in this repo, but Cloudflare Pages does **not** read `.env` files from the repo for Vite by default in their build sandbox — Vite-prefixed variables need to be defined in **Cloudflare Pages → Settings → Variables and Secrets** so they're present in `process.env` when `vite build` runs. The Lovable preview works because the sandbox loads `.env` directly.

### Vite 6.0.0 / lockfile reset is a red herring

The build log shows bun ignored your `package-lock.json` edit and installed `vite@5.4.19` from `bun.lock` anyway, and the build still succeeded. The blank page would happen on Vite 5 or 6 — the missing env vars are the only cause.

## Plan

### 1. Add the 5 build-time env vars in Cloudflare Pages (you do this, ~2 minutes)

Cloudflare Dashboard → **Workers & Pages → your project → Settings → Variables and Secrets → Production** (and **Preview** if you want preview deploys to work), add as plain text variables (NOT secrets — these are publishable keys):

```
VITE_SUPABASE_URL              = https://qkzbevzmplhnwjuregsc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY  = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFremJldnptcGxobndqdXJlZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjI1OTksImV4cCI6MjA5MTgzODU5OX0.rR1vVO9FFpiwLaCg3cYlFM1Ti60wK-uO2wSeL0eq2q8
VITE_SUPABASE_PROJECT_ID       = qkzbevzmplhnwjuregsc
VITE_FP_ENDPOINT               = https://api.fpjs.io
VITE_FP_PUBLIC_KEY             = kqdX7MeeyGpuaDO3jdCy
```

Then click **Deployments → Retry deployment** on the latest build (or push any commit). The site will render.

These are the same keys already exposed in your `addlogic.lovable.app` bundle — they're publishable/anon keys, safe to ship to the browser. The service-role key is NOT in this list and should never go here.

### 2. Revert the Vite 6 manual bump (I do this in build mode)

Now that we know Vite is innocent, clean up so the lockfiles and `package.json` agree and future Cloudflare builds don't get fragile:

- Restore `vite` to `^5.4.19` and `@vitejs/plugin-react-swc` to `^3.11.0` in `package.json`.
- Delete the hand-edited `package-lock.json` so bun is the only lockfile (Cloudflare auto-detects bun from `bun.lock`).
- Leave `bun.lock` / `bun.lockb` untouched — they already pin Vite 5.

### 3. Verify

After step 1 redeploys:
- Reload https://add-logic.com — should show the "Verifying session…" loader, then the location-mode modal, identical to the Lovable preview.
- Re-check the console: no `supabaseUrl is required` error.

If the page is still blank after env vars are set, take a screenshot of the Cloudflare Pages **Variables and Secrets** screen and paste any new console error — I'll dig further.

### What I will NOT touch

- Cloudflare Worker / DNS / proxy / SSL settings (all confirmed working).
- The GitHub integration (it's pushing commits correctly — the latest build proves it).
- `src/integrations/supabase/client.ts` (auto-generated, off-limits).
- Any application code — this is purely an environment + cleanup fix.
