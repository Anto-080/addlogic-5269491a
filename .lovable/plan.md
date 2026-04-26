## Goals

1. Eliminate the laggy old Cookie/GPS controls and consolidate around the new ones.
2. Make the "Opera WebView in-frame" search actually return results instead of a blank/error page.
3. Add two MIT links with brief context to the Dashboard's "Information Desk" (renamed from "Daily Information Desk").

---

## 1. Cookie + GPS permissions: single source of truth on Dashboard

**Remove from Settings (`src/pages/Settings.tsx`)**: delete the entire "Data permissions" card (Cookie + GPS), the GPS confirm `AlertDialog`, and unused imports (`Cookie`, `MapPin`, `Shield`, `requestGeolocation`, `persistTelemetry`, `snapshotDeviceProfile`, `useSettings`, alert-dialog imports, `gpsConfirmOpen`/`requesting` state). Settings keeps only Profile, Availability (which have a Problem in the Toggle that doesn't Remain in the User Position of Choice when someone leave settings, please fix that little nuisance), Notifications.

**Promote on Dashboard (`src/pages/Dashboard.tsx`)**: the existing "Data Analysis Permissions" card stays at top. Upgrade the GPS toggle to use the same proper flow we built for Settings:

- On enable → show the same `AlertDialog` (non-PII disclosure) → call `requestGeolocation()` + `persistTelemetry()` from `src/lib/geolocation.ts` → only flip the switch on success.
- On disable → just turn off.
- Cookie toggle stays as-is (it's instant, no permission needed).

**Move the disappearing Regional Coupons card** so it visually attaches to the GPS row: it already conditionally renders when `gpsPrecision` is true — keep that behavior, but render it directly under the Data Analysis Permissions card (already does). No change needed beyond confirming the order.

**Performance**: the lag came from the SettingsContext effect re-snapshotting device profile + calling `navigator.geolocation` whenever `gpsPrecision` toggled, plus the duplicate Settings card re-subscribing. Removing the Settings card and routing GPS through the explicit `requestGeolocation()` helper (no automatic polling) eliminates the redundant work. Also remove the auto-`getCurrentPosition` block from `SettingsContext` so geolocation is only ever requested via the explicit user action on the Dashboard.

---

## 2. Fix the Opera in-frame search (currently returns a blank page)

**Root cause**: `BrowserPicker` builds the URL as `https://www.opera.com/search?q=...` — that endpoint does not exist, so the iframe loads an Opera marketing page or 404s, which then trips the 4s "blocked" timeout in `InAppBrowser`.

**Fix in** `src/components/BrowserPicker.tsx`: switch to **DuckDuckGo's lite endpoint** (`https://duckduckgo.com/?q={q}&kp=1`) for the iframe URL, since DuckDuckGo does NOT send `X-Frame-Options: DENY` and renders fine inside iframes. Keep "Opera WebView" branding on the wrapper — Opera is the *browser shell* on Android, DuckDuckGo is the *search provider* underneath. Add a tiny "Search powered by DuckDuckGo (privacy-first)" line in the picker so users understand.

- **To Notice:** For the sake of the app to be functional and Generating Profits both for the Users, Myself and thus Exponentially Growing on the Lovable Network (also with the Fidelisation from Myself Side Enlarging the Whole Operation within the Expansion of Lovable Package for Larger Apps Groups) this app necessarily need to retrieve All the Users Cookies and Non-PII Informations otherwise it would be like a Windmill without Any Wind. By this mean **'if'** the Integration of a Privacy Orientated Search Provider as DuckDuckGo could Impact Negatively the Retrieval of this Informations the App will not work as it should, so we would at that point find another way, or simply the App Will need all the Capacitor to allow it for doing it by itself, Acquiring all the Necessary Information Independently from the Research Browser.

**Fix in** `src/components/InAppBrowser.tsx`: when the iframe DOES load (DuckDuckGo will), the existing flow already works — user types, sees results, taps a result, and DuckDuckGo navigates inside the iframe. Increase the X-Frame-Options fallback timer from 4s to 8s to be safer on slow connections, and improve the blocked-state copy to say "this specific destination blocks embedding — open the ads above and below, then continue externally" (already mostly there, just clearer).

**On native Android** (Capacitor): unchanged — `openInOperaWebView()` already hands the URL to the real Opera browser via Capacitor Browser plugin.

(If I am On Android why this didn't worked for me with this Set up not on Lovable App nor in Web Browsing?)

---

## 3. Information Desk: rename + add two MIT links

In `src/pages/Dashboard.tsx`:

- Rename card title from **"Daily Information Desk"** → **"Information Desk"**.
- Above the dynamic `dailyDesk` list, add a fixed **"Recommended reading on dual-use technology"** section with two cards (each a styled link with the existing `ShieldAlert`/dual-use visual treatment):
  1. **"Defining Dual Use" — MIT**
  URL: `https://dualuse.mit.edu/defining-dual-use/`
  Blurb: *"MIT's working framework for distinguishing legitimate research from technology that can be weaponized. Reflects the operating consensus between academic biosecurity and DoD-acquainted reviewers on what counts as 'dual use' and how institutions should triage it."*
  2. **"Top US intelligence official calls gene editing a WMD threat" — MIT Technology Review**
  URL: `https://www.technologyreview.com/2016/02/09/71575/top-us-intelligence-official-calls-gene-editing-a-wmd-threat/`
  Blurb: *"James Clapper's Worldwide Threat Assessment placed CRISPR-class genome editing on the ODNI's WMD/proliferation list. Essential context for why AddLogic flags DNA-modification research with safety advisories."*

Both cards open in a new tab (`target="_blank" rel="noopener noreferrer"`), use the existing dual-use visual style (crimson border + ShieldAlert), and sit *above* the live `dailyDesk` feed so they are always visible regardless of what the desk contains. The descriptive paragraph above the list stays.

---

## Files touched

- `src/pages/Dashboard.tsx` — wire AlertDialog + `requestGeolocation` for GPS toggle; rename Information Desk; insert the two MIT cards.
- `src/pages/Settings.tsx` — remove Data permissions card + dialog + unused imports.
- `src/contexts/SettingsContext.tsx` — remove the auto-`getCurrentPosition` effect (still keep `gpsPrecision`/`cookieAutoAccept` state and `topInterestTiers` derivation, since they're consumed app-wide).
- `src/components/BrowserPicker.tsx` — change search URL to DuckDuckGo; add small attribution line.
- `src/components/InAppBrowser.tsx` — bump fallback timer to 8s; minor copy tweak.

No DB migrations, no edge function changes, no new dependencies. Anthropic/Claude live-news feature stays untouched (you'll re-enable when credits are topped up).