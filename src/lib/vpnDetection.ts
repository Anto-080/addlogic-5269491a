/**
 * VPN / proxy detection client.
 *
 * Truth comes from the `vpn-verdict` edge function, which prefers the
 * Cloudflare Worker headers (forwarded by the client when available) and
 * falls back to Abstract IP Intelligence. Fingerprint provides only the
 * stable visitorId via `src/lib/fingerprint.ts`.
 */

import { clearVisitorEventCache, getVisitorEvent } from "@/lib/fingerprint";
import { supabase } from "@/integrations/supabase/client";

export type IpInfo = {
  ip: string;
  country_code: string | null;
  country_name: string | null;
  asn: string | null;
  org: string | null;
};

export type FpSignals = {
  vpn: boolean;
  proxy: boolean;
  proxyType?: string | null;
  tor: boolean;
  relay: boolean;
  incognito: boolean;
  ipFromFp?: string | null;
  ipCountryFromFp?: string | null;
  rulesetAction?: string | null;
  rulesetRuleName?: string | null;
  fallback?: boolean;
  error?: string;
};

export type RulesetVerdict = {
  ok: boolean;
  reason?: string;
  ruleName?: string | null;
  signals?: FpSignals | null;
};

/**
 * Read the Cloudflare Worker verdict from cookies it set on add-logic.com.
 * Cookies are used (vs headers) because browser fetch can read them directly.
 * Expected (set by the Worker): `al_vpn=block|allow`, optional `al_ip=<ip>`.
 */
function readWorkerCookies(): { verdict: string | null; ip: string | null } {
  if (typeof document === "undefined") return { verdict: null, ip: null };
  const jar = Object.fromEntries(
    document.cookie.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("=") ?? "")];
    }),
  );
  return { verdict: jar["al_vpn"] ?? null, ip: jar["al_ip"] ?? null };
}

/**
 * Entry check used by PostLoginGate (approximate-IP branch only).
 * 1. Force a fresh fingerprint event (gives us visitorId + a fresh requestId).
 * 2. Resolve the exit IP via fingerprint-signals.
 * 3. Ask vpn-verdict for the final allow/block decision.
 */
export async function verifyFingerprintRuleset(): Promise<RulesetVerdict> {
  clearVisitorEventCache();
  let requestId: string | null = null;
  try {
    const ev = await getVisitorEvent();
    requestId = ev.requestId;
  } catch {
    /* ignore — verdict will fall back to Worker / Abstract on ip-from-transport */
  }

  // Resolve IP via Fingerprint server (best-effort).
  let ip: string | null = null;
  if (requestId) {
    try {
      const { data } = await supabase.functions.invoke("fingerprint-signals", {
        body: { requestId },
      });
      ip = (data as { ip?: string | null } | null)?.ip ?? null;
    } catch { /* ignore */ }
  }
  if (!ip) {
    const transport = await fetchTransportIpInfo();
    ip = transport?.ip ?? null;
  }

  const { verdict: workerVerdict, ip: workerIp } = readWorkerCookies();

  try {
    const { data } = await supabase.functions.invoke("vpn-verdict", {
      body: { ip, workerVerdict, workerIp },
    });
    const d = (data ?? {}) as { block?: boolean; reason?: string | null };
    if (d.block) {
      return {
        ok: false,
        reason: d.reason ?? "VPN / proxy detected",
        ruleName: null,
        signals: { vpn: true, proxy: false, tor: false, relay: false, incognito: false, ipFromFp: ip },
      };
    }
  } catch (e) {
    console.warn("[vpnDetection] vpn-verdict failed, failing open", e);
  }

  return { ok: true, signals: null };
}

export const verifyIpForApproximateLocation = verifyFingerprintRuleset;

/** Transport-only IP lookup (metadata, never blocks). */
export async function fetchTransportIpInfo(): Promise<IpInfo | null> {
  try {
    const r = await fetch("https://ipwho.is/", { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.success === false) return null;
    return {
      ip: String(j.ip ?? ""),
      country_code: j.country_code ?? null,
      country_name: j.country ?? null,
      asn: j.connection?.asn != null ? String(j.connection.asn) : null,
      org: j.connection?.isp ?? j.connection?.org ?? null,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const cc = j?.address?.country_code;
    return cc ? String(cc).toUpperCase() : null;
  } catch {
    return null;
  }
}
