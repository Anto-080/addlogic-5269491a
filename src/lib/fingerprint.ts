/**
 * FingerprintJS v5 OSS wrapper. Bundled via npm (no CDN, no `new Function`
 * CSP bypass, no SRI risk). The promise is cached so we only pay the
 * agent-load cost once per session.
 *
 * Used to:
 *  - Tag every research session with a stable visitorId
 *  - Cross-check the same browser doesn't repeatedly create accounts
 *  - Be persisted on `device_telemetry.fingerprint` and `tier_progress.fingerprint`
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cached: Promise<string | null> | null = null;

export function getVisitorId(): Promise<string | null> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const agent = await FingerprintJS.load();
      const result = await agent.get();
      return result.visitorId ?? null;
    } catch {
      return null;
    }
  })();
  return cached;
}
