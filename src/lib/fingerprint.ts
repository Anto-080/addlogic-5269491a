/**
 * FingerprintJS Identification (free tier) — uses the Pro/Identification SDK
 * with the project's public API key fetched once from the edge function.
 *
 * VPN/proxy decisions are NOT made here. They live in the Cloudflare Worker
 * on add-logic.com/* (primary) with Abstract IP Intelligence as fallback
 * via the `vpn-verdict` edge function.
 */

import FingerprintJS, {
  type Agent,
  type GetResult,
} from "@fingerprintjs/fingerprintjs-pro";
import { supabase } from "@/integrations/supabase/client";

type ClientConfig = { publicKey: string; region: string; configured: boolean };

let configPromise: Promise<ClientConfig | null> | null = null;
let agentPromise: Promise<Agent | null> | null = null;
let visitorEventPromise: Promise<{
  visitorId: string | null;
  requestId: string | null;
}> | null = null;

async function loadConfig(): Promise<ClientConfig | null> {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("fingerprint-signals", {
        method: "GET",
      });
      if (error || !data?.publicKey) return null;
      return data as ClientConfig;
    } catch {
      return null;
    }
  })();
  return configPromise;
}

async function getAgent(): Promise<Agent | null> {
  if (agentPromise) return agentPromise;
  agentPromise = (async () => {
    const cfg = await loadConfig();
    if (!cfg?.publicKey) return null;
    try {
      return await FingerprintJS.load({
        apiKey: cfg.publicKey,
        region: (cfg.region as "us" | "eu" | "ap") ?? "us",
      });
    } catch (e) {
      console.error("[fingerprint] agent load failed", e);
      return null;
    }
  })();
  return agentPromise;
}

export function getVisitorEvent(): Promise<{
  visitorId: string | null;
  requestId: string | null;
}> {
  if (visitorEventPromise) return visitorEventPromise;
  visitorEventPromise = (async () => {
    try {
      const agent = await getAgent();
      if (!agent) return { visitorId: null, requestId: null };
      const r: GetResult = await agent.get();
      return {
        visitorId: r.visitorId ?? null,
        requestId: r.requestId ?? null,
      };
    } catch (e) {
      console.error("[fingerprint] get() failed", e);
      return { visitorId: null, requestId: null };
    }
  })();
  return visitorEventPromise;
}

export async function getVisitorId(): Promise<string | null> {
  const { visitorId } = await getVisitorEvent();
  return visitorId;
}

export function clearVisitorEventCache() {
  visitorEventPromise = null;
}

export function isFingerprintConfigured(): boolean {
  return true;
}
