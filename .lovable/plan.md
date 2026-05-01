
# Real consent, real fingerprinting, real research signal

Six related fixes — they share the same data pipeline (fingerprint + tier-classifier + chronology), so they ship together.

## 1. Cookie toggle — actually do something visible

Today the cookie toggle just sets a localStorage flag. Make it concrete:

- On enable, sweep `document.cookie`, group entries by domain (= "third-party / first-party / zero-party `rr_zero_*`"), and surface the count in the Dashboard card itself ("Reading 12 first-party · 4 third-party · writing 3 zero-party").
- After the AdBlock slide is satisfied, open a second slide **`CookieAuditSlide`** that lists the cookies just enumerated (host, name, type), then commits them to a new `cookie_audit` table (user-scoped, RLS) so the sweep persists. This is the visible proof the toggle did something.
- Re-sweep on every Dashboard mount while the toggle is on; show a small "last synced 12s ago" line.

## 2. GPS toggle — real geolocation + FingerprintJS + VPN detection

Add **FingerprintJS v5 OSS** (free CDN ESM build, no key) and use the visitorId as the device fingerprint persisted on `device_telemetry.fingerprint` and `tier_progress.fingerprint`. New file `src/lib/fingerprint.ts` wrapping `import('https://openfpcdn.io/fingerprintjs/v5')` with one cached promise.

In `GeoConsentSlide`:
- Always run FingerprintJS on open (even before the user picks GPS vs IP).
- Run an IP/VPN check via `https://ipapi.co/json/` and inspect `org`/`asn` against a small built-in list of known datacenter/VPN ASNs (DigitalOcean, OVH, M247, Mullvad, NordVPN, ExpressVPN, etc.) plus the `proxy`/`hosting` fields. If detected, show a blocking **"VPN/Datacenter IP detected"** state with copy explaining why it must be turned off (region-fraud / Asian-botfarm protection); the slide cannot be satisfied until both a real GPS fix *and* a residential IP are present, OR until the user explicitly accepts a "low-trust mode" that disables the GPS multiplier bonus.
- Cross-check that the IP-derived country and the GPS-derived reverse-geocoded country (via `https://geocode.maps.co/reverse` — keyless) agree. Mismatch → same low-trust path.
- Persist `fingerprint`, `ip_country`, `gps_country`, `vpn_suspected`, `asn` on `device_telemetry` (migration adds these columns).
- Server-side, the multiplier bonus from GPS only applies when `vpn_suspected = false` AND countries agree.

On Capacitor (Android wrap), the existing `requestGeolocation()` already triggers the OS prompt — keep it as the preferred path; the web `requestWebGeolocation` is the fallback.

## 3. Move OpenAlex to Research, above the Anthropic card

Remove the `<OpenAlexFeed>` block from each expanded tier card in `src/pages/Tiers.tsx`. Mount one shared `<OpenAlexFeed>` in `src/pages/Research.tsx` directly above the "Live news from Claude" card. Its sub-interest chips are sourced from the currently-selected tier's `subcategories` (or, when "All" is selected, from the user's top zero-party tier). Make the OpenAlex query fully public — already keyless, so just remove any auth gating.

## 4. Tier XP must come from real research, not from opening a card

Today `<TierExperienceBar active={isOpen} />` ticks just because the card is expanded. Replace with two real signals — XP only accumulates while **both** are true:

1. **Outbound dwell** — the user has an active `outbound_visits` row (opened, not yet returned) for that tier, OR the user is actively typing in the in-app DuckDuckGo search bar for that tier.
2. **Pingback** — every 15s (was 30s) the tab fires a visibility/heartbeat ping; if the tab has been hidden for ≥ that interval since the last ping, the seconds in between are discarded.

New hook `useActiveResearchTracker(tierId)` owns the heartbeat and reads from a new `ResearchSessionContext` populated by:
- `useOutboundExit` (sets active tier on `requestExit`, clears on return)
- `BrowserPicker` (sets active tier on each search submit, clears after 90s of no further input)

`<TierExperienceBar>` no longer self-ticks; it just renders the persisted total + the live delta from the context. Opening/closing a tier card has zero effect on XP.

## 5. Rebalanced timing

In `src/lib/zeroPartyCookies.ts`:
- `TIER_XP_PER_LEVEL`: `10_000` → **`1_000`**
- `SECONDS_PER_BUMP`: `8 * 60 * 60` → **`60 * 60`** (1h per +1 multiplier)

In `src/components/TierExperienceBar.tsx`:
- Flush interval: `15000` ms stays
- Live-bonus formula: `Math.floor(liveSeconds / 3600)` (was `/ 8 / 3600`)
- Tick interval already 1s — keep.

No upper cap remains (lifetime achievement, as requested).

## 6. HuggingFace zero-shot tier classifier (interest "magnetic bar")

Add an edge function `classify-interest` that proxies HuggingFace `facebook/bart-large-mnli` zero-shot classification. The HF token lives as a **Lovable Cloud secret** (`HUGGINGFACE_API_KEY`) — I'll request it via `add_secret` before coding. Candidate labels = the 17 tier names; the function returns the top tier id + confidence + the user's raw query (for subcategory mining).

Client wiring:
- `BrowserPicker.runSearch()` calls the function on every submit. The detected tier is recorded into `ResearchSessionContext` (drives §4) AND into a new `tier_keywords` table (`user_id, tier_id, keyword, count, last_seen`) — every noun/adjective from the query lands as a subcategory candidate (cheap stopword strip, no NLP lib needed). Top-N keywords per tier surface as live "Discovered subcategories" chips in the Tiers card.
- On every outbound exit (`useOutboundExit.requestExit`), classify the destination URL's title (best-effort fetch via existing `web-search` edge function or just the visible card title) so the tier attached to the visit reflects the link content, not the tier the user happened to be browsing.

Veracity rule: tier XP only accumulates for `tierId` when `classify-interest` confidence ≥ 0.4 OR the user explicitly picked that tier in the picker. This is the "veridicity" gate — combined with the §4 pingback it prevents passive idle XP.

## 7. Personal Research Chronology (Dashboard)

Add a `<ResearchChronologyCard>` to `src/pages/Dashboard.tsx` (above "Information Desk"). Backed by the existing `useResearchChronology()` hook + `outbound_visits` table — already wired, just never rendered. Shows: tier icon, host, title (from URL), opened-at, dwell seconds, with a "Browse again" action that re-opens via `useOutboundExit`. Filter pill row by tier across the top.

## Files

```text
NEW   src/lib/fingerprint.ts                        FingerprintJS v5 wrapper
NEW   src/lib/vpnDetection.ts                       ASN list + ipapi parser
NEW   src/lib/cookieAudit.ts                        Sweep + categorize cookies
NEW   src/components/CookieAuditSlide.tsx           Post-AdBlock cookie list
NEW   src/components/ResearchChronologyCard.tsx     Dashboard chronology
NEW   src/contexts/ResearchSessionContext.tsx       Active tier + heartbeat
NEW   src/hooks/useActiveResearchTracker.ts         Real XP tick source
NEW   src/hooks/useClassifyInterest.ts              Calls HF edge function
NEW   supabase/functions/classify-interest/index.ts HF zero-shot proxy
EDIT  src/components/TierExperienceBar.tsx          Read from context, new timings
EDIT  src/components/GeoConsentSlide.tsx            Fingerprint + VPN gate
EDIT  src/components/AdBlockConsentSlide.tsx        Chains into CookieAuditSlide
EDIT  src/pages/Dashboard.tsx                       Cookie counts, chronology
EDIT  src/pages/Research.tsx                        Mount OpenAlexFeed
EDIT  src/pages/Tiers.tsx                           Remove OpenAlexFeed, no auto-tick
EDIT  src/components/BrowserPicker.tsx              Classify on submit
EDIT  src/lib/zeroPartyCookies.ts                   New constants (1000 / 1h)
EDIT  src/lib/userInterestProfiler.ts               Pull from tier_keywords
MIGR  device_telemetry: + fingerprint, ip_country, gps_country, vpn_suspected, asn
MIGR  cookie_audit (user_id, host, name, kind, observed_at) + RLS
MIGR  tier_keywords (user_id, tier_id, keyword, count, last_seen) + RLS unique
```

## Secrets required

- **`HUGGINGFACE_API_KEY`** — your `hf_KbEKSK…` token. Will request via `add_secret` once you approve.

FingerprintJS OSS, ipapi.co, geocode.maps.co, OpenAlex are all keyless.
