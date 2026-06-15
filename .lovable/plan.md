## Plan

### 1) Consent locking UI
- Remove the small “save/saved” switches/buttons from the cookie and Non-PII rows.
- Add one 40×40 lock block directly beneath each of the first two main toggles.
- Show these lock blocks only when the Data Consensus collapsible text is open.
- Style inactive lock as black/dark background with opaque gold padlock.
- Style active lock as lit emerald background with vivid opaque gold padlock.
- Keep GPS without a persistent lock, because GPS must be requested each time.

### 2) Consent locking behavior
- When a lock block is activated:
  - force that main consent toggle ON;
  - persist the decision between sessions;
  - disable clicking the main toggle so misclicks cannot turn it off.
- When the user clicks the active lock block again:
  - unlock it;
  - turn the main consent OFF;
  - clear the remembered cached value;
  - stop cookie sweep / Non-PII consent collection immediately.
- Keep cookie and Non-PII locks independent.

### 3) Settings cleanup
- Remove GPS lock state and persistence from the settings context and profile preferences.
- Keep only cookie lock and analytics/Non-PII lock persistence.
- Ensure unlocked choices reset on a new session, while locked active choices restore as ON.

### 4) Fingerprint and Vite dependency update
- Confirm Vite is pinned to `6.0.0` in `package.json` instead of a floating range if needed.
- Replace Fingerprint Pro package usage with the standard browser FingerprintJS package at version `4.0.0`.
- Update the fingerprint client wrapper to load the standard agent and return a visitor ID.
- Adjust VPN/proxy code so the app does not depend on Pro-only `requestId` / Smart Signals when using the free package; it should fail open instead of locking users on a blank page.

### 5) Safety validation
- Check for TypeScript/import errors caused by the removed GPS lock and Fingerprint package swap.
- Verify the dashboard consent UI renders with locked main toggles disabled and unlock blocks visible only while descriptions are open.
- Check the app avoids blank-page failure if Fingerprint keys or Pro server signals are unavailable.

## Notes
- I will not ask you for server keys unless we keep or restore Fingerprint Pro server-side Smart Signals.
- The standard FingerprintJS package can identify browsers with a visitor ID, but VPN detection is a Pro/Smart Signals capability; with the free package we can still support anti-duplicate-browser logic later, but not reliable VPN/proxy blocking from Fingerprint alone.