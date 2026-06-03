/**
 * FingerprintJS Pro client — initialized from build-time env vars.
 *
 *   VITE_FP_PUBLIC_KEY  — browser public key (workspace publishable)
 *   VITE_FP_ENDPOINT    — Pro endpoint (custom subdomain or eg https://eu.api.fpjs.io)
 *
 * Block decisions are made server-side via the `fingerprint-signals` edge
 * function using the workspace ruleset (rs_kd5z5fhUgyMT49). This module
 * only loads the agent and exposes visitorId / requestId.
 */

import { load, type Agent, defaultEndpoint } from "@fingerprintjs/fingerprintjs-pro";

const PUBLIC_KEY = import.meta.env.VITE_FP_PUBLIC_KEY as string | undefined;
const ENDPOINT = import.meta.env.VITE_FP_ENDPOINT as string | undefined;

let agentPromise: Promise<Agent | null> | null = null;

function getAgent(): Promise<Agent | null> {
  if (agentPromise) return agentPromise;
  agentPromise = (async () => {
    if (!PUBLIC_KEY) {
      console.warn("[fingerprint] VITE_FP_PUBLIC_KEY missing — Fingerprint disabled, all sessions allowed");
      return null;
    }
    try {
      return await load({
        apiKey: PUBLIC_KEY,
        endpoint: ENDPOINT ? [ENDPOINT, defaultEndpoint] : undefined,
      });
    } catch (e) {
      console.error("[fingerprint] load failed", e);
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
      const r = await agent.get();
      return { visitorId: r.visitorId ?? null, requestId: r.requestId ?? null };
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

export function isFingerprintConfigured(): boolean {
  return !!PUBLIC_KEY;
}
