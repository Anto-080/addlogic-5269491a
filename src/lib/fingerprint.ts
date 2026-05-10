/**
 * FingerprintJS Pro wrapper.
 *
 * Loads the Pro agent with a publishable key fetched once from the
 * `fingerprint-signals` edge function (so the bundle never carries the
 * secret server key). Exposes:
 *   - getVisitorId()    → stable visitorId (back-compat with OSS API)
 *   - getVisitorEvent() → { visitorId, requestId } — `requestId` is what
 *                         the server uses to look up Smart Signals
 *                         (vpn/proxy/tor/relay/incognito).
 *
 * Used to:
 *  - Tag every research session with a stable visitorId
 *  - Cross-check the same browser doesn't repeatedly create accounts
 *  - Be persisted on `device_telemetry.fingerprint` and `tier_progress.fingerprint`
 *  - Drive the VPN/proxy hard block in vpnDetection.ts
 */

import {
  load,
  type Agent,
} from "@fingerprintjs/fingerprintjs-pro";
import { supabase } from "@/integrations/supabase/client";

type ConfigResp = { publicKey?: string; region?: string; configured?: boolean };

let configPromise: Promise<ConfigResp | null> | null = null;
let agentPromise: Promise<Agent | null> | null = null;

async function getConfig(): Promise<ConfigResp | null> {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("fingerprint-signals", {
        method: "GET",
      });
      if (error || !data) return null;
      const c = data as ConfigResp;
      if (!c.publicKey) return null;
      return c;
    } catch {
      return null;
    }
  })();
  return configPromise;
}

async function getAgent(): Promise<Agent | null> {
  if (agentPromise) return agentPromise;
  agentPromise = (async () => {
    const cfg = await getConfig();
    if (!cfg?.publicKey) return null;
    try {
      return await load({
        apiKey: cfg.publicKey,
        region: (cfg.region ?? "eu") as "eu" | "us" | "ap",
      });
    } catch {
      return null;
    }
  })();
  return agentPromise;
}

let visitorEventPromise: Promise<{ visitorId: string | null; requestId: string | null }> | null = null;

export function getVisitorEvent(): Promise<{ visitorId: string | null; requestId: string | null }> {
  if (visitorEventPromise) return visitorEventPromise;
  visitorEventPromise = (async () => {
    try {
      const agent = await getAgent();
      if (!agent) return { visitorId: null, requestId: null };
      const result = await agent.get();
      return {
        visitorId: result.visitorId ?? null,
        requestId: result.requestId ?? null,
      };
    } catch {
      return { visitorId: null, requestId: null };
    }
  })();
  return visitorEventPromise;
}

export async function getVisitorId(): Promise<string | null> {
  const { visitorId } = await getVisitorEvent();
  return visitorId;
}

/** Force a fresh event (e.g. after the user disables their VPN and retries). */
export function clearVisitorEventCache() {
  visitorEventPromise = null;
}
