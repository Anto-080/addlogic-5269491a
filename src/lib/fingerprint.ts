/**
 * FingerprintJS v5 OSS wrapper. Loads the library lazily from the public CDN
 * (no key required, free developer tier). The promise is cached so we only
 * pay the import + agent-load cost once per session.
 *
 * Used to:
 *  - Tag every research session with a stable visitorId
 *  - Cross-check the same browser doesn't repeatedly create accounts
 *  - Be persisted on `device_telemetry.fingerprint` and `tier_progress.fingerprint`
 */

let cached: Promise<string | null> | null = null;

type FpAgent = { get: () => Promise<{ visitorId: string }> };
type FpModule = { load: () => Promise<FpAgent> };

export function getVisitorId(): Promise<string | null> {
  if (cached) return cached;
  cached = (async () => {
    try {
      // Free OSS build, no API key. Cast through unknown to avoid TS resolving the URL.
      const dynImport = new Function("u", "return import(u)") as (u: string) => Promise<unknown>;
      const mod = (await dynImport("https://openfpcdn.io/fingerprintjs/v5")) as FpModule;
      const agent = await mod.load();
      const result = await agent.get();
      return result.visitorId ?? null;
    } catch {
      return null;
    }
  })();
  return cached;
}
