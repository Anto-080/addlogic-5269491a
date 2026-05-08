// Cloudflare-backed IP intelligence (primary VPN/proxy gate).
// Replaces Abstract API as the primary verdict source — Abstract is paused
// (kept on disk for emergency fallback). Uses Cloudflare Radar to resolve
// ASN/org/country; the rich datacenter/VPN ASN blocklist on the client
// (vpnDetection.ts) escalates the verdict to "blocked" when matched.
//
// verify_jwt = false (called pre-auth from VpnGuard).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

function firstIp(value: string | null): string | null {
  if (!value) return null;
  for (const part of value.split(",")) {
    const ip = part.trim().replace(/^::ffff:/, "");
    if (!ip || ip.toLowerCase() === "unknown") continue;
    return ip;
  }
  return null;
}

function getCallerIp(req: Request): string | null {
  return (
    firstIp(req.headers.get("cf-connecting-ip")) ??
    firstIp(req.headers.get("x-real-ip")) ??
    firstIp(req.headers.get("x-forwarded-for")) ??
    firstIp(req.headers.get("x-forwarded-client-ip"))
  );
}

type CfRadarIp = {
  result?: {
    ip?: string;
    type?: string;
    location?: string;
    locationName?: string;
    asn?: number | string;
    asnLocation?: string;
    asOrganization?: string;
  };
  success?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = Deno.env.get("CLOUDFLARE_API_TOKEN");
  if (!token) {
    return new Response(
      JSON.stringify({ error: "CLOUDFLARE_API_TOKEN not configured", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const callerIp = getCallerIp(req);
  if (!callerIp) {
    return new Response(
      JSON.stringify({ error: "client ip unavailable", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const hit = cache.get(callerIp);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return new Response(JSON.stringify(hit.payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "HIT" },
    });
  }

  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/radar/entities/ip?ip=${encodeURIComponent(callerIp)}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );
    if (!r.ok) {
      console.error("cloudflare radar error", r.status, await r.text().catch(() => ""));
      if (hit) {
        return new Response(JSON.stringify(hit.payload), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "STALE" },
        });
      }
      return new Response(
        JSON.stringify({ error: `Cloudflare ${r.status}`, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = (await r.json()) as CfRadarIp;
    const res = j.result ?? {};
    const ipType = String(res.type ?? "").toLowerCase();
    // Cloudflare classifies IPv4 ranges; we treat anything tagged as
    // "hosting"/"business"-ish as suspect upstream of the local blocklist.
    const cfSuspected = ipType.includes("hosting") || ipType.includes("anonymizer") || ipType.includes("proxy");
    const payload = {
      ip: res.ip ?? callerIp,
      country_code: res.location ?? null,
      country_name: res.locationName ?? res.location ?? null,
      asn: res.asn != null ? String(res.asn) : null,
      org: res.asOrganization ?? null,
      vpn_suspected: cfSuspected,
      reason: cfSuspected ? `Cloudflare IP type: ${ipType}` : null,
    };
    cache.set(callerIp, { at: Date.now(), payload });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "MISS" },
    });
  } catch (e) {
    console.error("cloudflare-ip-check error", e);
    if (hit) {
      return new Response(JSON.stringify(hit.payload), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "STALE" },
      });
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "fetch failed", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
