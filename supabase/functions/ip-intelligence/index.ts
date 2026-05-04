// IP intelligence proxy backed by Abstract API.
// Called by VpnGuard + GeoConsentSlide (pre-auth) — verify_jwt = false.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type AbstractResp = {
  ip_address?: string;
  asn?: { asn?: string | number; name?: string; domain?: string; type?: string };
  company?: { name?: string; domain?: string; type?: string };
  location?: { country?: string; country_code?: string };
  security?: {
    is_vpn?: boolean;
    is_proxy?: boolean;
    is_tor?: boolean;
    is_hosting?: boolean;
    is_relay?: boolean;
    is_abuse?: boolean;
  };
};

// Best-effort in-memory cache, per warm instance, to absorb the
// 1-req/sec Abstract free-tier limit. Same IP within 5 minutes is reused.
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

function shape(j: AbstractResp, callerIp: string) {
  const sec = j.security ?? {};
  const flags: { key: keyof NonNullable<AbstractResp["security"]>; reason: string }[] = [
    { key: "is_vpn", reason: "VPN flag from Abstract" },
    { key: "is_proxy", reason: "Proxy flag from Abstract" },
    { key: "is_tor", reason: "Tor exit node" },
    { key: "is_relay", reason: "Anonymous relay" },
    { key: "is_hosting", reason: "Hosting / datacenter IP" },
  ];
  const matched = flags.find((f) => sec[f.key] === true);
  const asnType = String(j.asn?.type ?? "").toLowerCase();
  const companyType = String(j.company?.type ?? "").toLowerCase();
  const typeReason =
    !matched &&
    (asnType.includes("hosting") ||
      companyType.includes("hosting") ||
      companyType.includes("vpn") ||
      companyType.includes("proxy"))
      ? `Non-residential ASN type: ${asnType || companyType}`
      : null;
  const reason = matched?.reason ?? typeReason ?? null;
  return {
    ip: j.ip_address ?? callerIp ?? "",
    country_code: j.location?.country_code ?? null,
    country_name: j.location?.country ?? null,
    asn: j.asn?.asn != null ? String(j.asn.asn) : null,
    org: j.company?.name ?? j.asn?.name ?? null,
    vpn_suspected: !!reason,
    reason,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ABSTRACT_IP_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ABSTRACT_IP_API_KEY not configured", fallback: true }),
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

  // Serve from cache when fresh.
  const hit = cache.get(callerIp);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return new Response(JSON.stringify(hit.payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "HIT" },
    });
  }

  const url = new URL("https://ip-intelligence.abstractapi.com/v1/");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("ip_address", callerIp);

  try {
    const r = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!r.ok) {
      // Rate-limited or upstream error — degrade gracefully so the client
      // can fall back to ipwho.is rather than treating this as a hard error.
      // If we have a stale cache entry, serve it.
      if (hit) {
        return new Response(JSON.stringify(hit.payload), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "STALE" },
        });
      }
      return new Response(
        JSON.stringify({ error: `Abstract API ${r.status}`, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = (await r.json()) as AbstractResp;
    const payload = shape(j, callerIp);
    cache.set(callerIp, { at: Date.now(), payload });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "MISS" },
    });
  } catch (e) {
    if (hit) {
      return new Response(JSON.stringify(hit.payload), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "STALE" },
      });
    }
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "fetch failed",
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
