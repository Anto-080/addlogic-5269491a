/**
 * FingerprintJS (open-source, v4) client.
 *
 * The Pro/Smart-Signals tier is no longer used in the bundle. This module
 * exposes a stable per-browser visitorId for the post-entry drift watcher
 * and anti-duplicate-account logic. VPN/proxy detection is intentionally
 * NOT performed here — the free agent cannot reliably detect VPNs.
 */

import FingerprintJS, { type Agent } from "@fingerprintjs/fingerprintjs";

let agentPromise: Promise<Agent | null> | null = null;

function getAgent(): Promise<Agent | null> {
  if (agentPromise) return agentPromise;
  agentPromise = (async () => {
    try {
      return await FingerprintJS.load();
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
      // The OSS agent has no Pro requestId; we mirror visitorId for compatibility.
      return { visitorId: r.visitorId ?? null, requestId: r.visitorId ?? null };
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

export function clearVisitorEventCache() {
  visitorEventPromise = null;
}

export function isFingerprintConfigured(): boolean {
  return true;
}
