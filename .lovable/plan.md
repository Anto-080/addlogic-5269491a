## Goal

Add a live news fetcher to the Research page that uses the **Anthropic Claude SDK** (as in your original code) to retrieve real, current articles for the user's tiers of interest.

## Setup

- **New secret required**: `ANTHROPIC_API_KEY` — I'll request it via the secrets prompt before deploying.
- No new tables, no Express server. The Express logic moves into one Supabase Edge Function (Deno).

## What gets built

### 1. Edge function `supabase/functions/curate-news/index.ts`

- Imports the Anthropic SDK (`npm:@anthropic-ai/sdk`)
- Reads `ANTHROPIC_API_KEY` from env
- Accepts `POST { tierIds: number[], count?: number }`
- Loads the matching rows from the `tiers` table to get each tier's `name` + `subcategories` — these become the "interests" passed to Claude (so it stays in sync with whatever you set in the Admin panel, including the 16 real tiers like Biochem, Quantum, Climate, Tourism, Real Estate)
- Uses your exact prompt structure (curator role, JSON-only response, real HTTPS URLs, recent articles, varied sources) with `claude-sonnet-4-20250514`
- Parses the JSON array, filters to valid `https://` URLs, returns `{ articles: [...] }`
- CORS enabled, public access, handles upstream errors gracefully

### 2. Hook `useCurateNews` in `src/hooks/useAppData.ts`

- React Query mutation calling the function via `supabase.functions.invoke("curate-news", { body: { tierIds, count } })`
- Returns `{ mutate, data, isPending, error }`

### 3. Research page (`src/pages/Research.tsx`)

- New card above the article list: **"Fetch live news"** with a refresh button
  - When a specific tier is selected → fetches for that tier only
  - When "All" is selected → uses `topInterestTiers` from settings (the user's connected tiers of interest)
- Renders returned articles with a "Live" badge, source, summary, and an **Open** button that routes through the existing `InAppBrowser` (so reading still earns XP via Opera WebView)
- Page Open for real so Opera WebView Need Active Internet Access
- Live results are session-only (not written to DB)
  &nbsp;
  &nbsp;

## Caveat

LLMs don't truly browse — Claude generates URLs from training knowledge and recall. The function validates `https://` prefixes but cannot guarantee every link resolves. If a link is dead, the user can refresh to re-roll. (If you later want guaranteed-live results, Firecrawl search can be added on top — separate request.)

## Files

- `supabase/functions/curate-news/index.ts` (new)
- `src/hooks/useAppData.ts` (add `useCurateNews`)
- `src/pages/Research.tsx` (add fetch panel + live results)
- Secret: `ANTHROPIC_API_KEY` (you provide)