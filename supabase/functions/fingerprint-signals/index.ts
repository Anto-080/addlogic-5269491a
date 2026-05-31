// FingerprintJS Pro Smart Signals proxy.
//
// Two endpoints in one function:
//   GET  → returns the publishable client config { publicKey, region }
//          so the browser agent can initialize without leaking the secret
//          server key to the bundle.
//   POST { requestId } → server-side fetches the event from FP Pro,
//          extracts the security signals (vpn, proxy, tor, relay, incognito)
//          and returns a normalized payload.
//
// verify_jwt = false (called pre-auth from VpnGuard).
//
// Secret mapping for this project:
//   FINGERPRINT_PUBLIC_API_KEY  -> browser/public key
//   FINGERPRINT_SERVER_API_KEY  -> preferred server-side Events API key
//   FINGERPRINT_SECRET_API_KEY  -> legacy fallback name for the same server key
//   sealed result keys are NOT used by this VPN block function.
//
// Region defaults to "us" because this project's Fingerprint workspace is
// currently resolving against the global/US API host. Override with a
// FINGERPRINT_REGION secret set to "eu" or "ap" if the workspace is moved.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function regionBase(region: string): string {
  switch (region.toLowerCase()) {
    case "us":
    case "global":
      return "https://api.fpjs.io";
    case "ap":
      return "https://ap.api.fpjs.io";
    case "eu":
    default:
      return "https://eu.api.fpjs.io";
  }
}

type ProductBool = { data?: { result?: boolean } };
type ProxyProduct = { data?: { result?: boolean; type?: string } };
type EventResp = {
  products?: {
    vpn?: ProductBool;
    proxy?: ProxyProduct;
    tor?: ProductBool;
    privacySettings?: ProductBool;
    incognito?: ProductBool;
    suspectScore?: { data?: { result?: number } };
    ipInfo?: { data?: { v4?: { address?: string; geolocation?: { country?: { code?: string } } } } };
  };
};


const eventCache = new Map<string, { at: number; payload: unknown }>();
const EVENT_TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const region = Deno.env.get("FINGERPRINT_REGION") ?? "us";
  const publicKey = Deno.env.get("FINGERPRINT_PUBLIC_API_KEY") ?? "";
  const secretKey = Deno.env.get("FINGERPRINT_SERVER_API_KEY") ?? Deno.env.get("FINGERPRINT_SECRET_API_KEY") ?? "";

  // ── GET: ship the publishable config to the browser ────────────────
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        publicKey,
        region,
        configured: !!publicKey && !!secretKey,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── POST: server-side event lookup ─────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: "FINGERPRINT_SECRET_API_KEY not configured", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { requestId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const requestId = body.requestId?.trim();
  if (!requestId) {
    return new Response(JSON.stringify({ error: "requestId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hit = eventCache.get(requestId);
  if (hit && Date.now() - hit.at < EVENT_TTL_MS) {
    return new Response(JSON.stringify(hit.payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "HIT" },
    });
  }

  try {
    const rulesetId = Deno.env.get("FINGERPRINT_RULESET_ID") ?? "rs_kd5z5fhUgyMT49";
    const url = new URL(`${regionBase(region)}/events/${encodeURIComponent(requestId)}`);
    if (rulesetId) url.searchParams.set("ruleset_id", rulesetId);
    const r = await fetch(
      url.toString(),
      { headers: { "Auth-API-Key": secretKey, Accept: "application/json" } },
    );
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("fingerprint-signals upstream error", r.status, text);
      return new Response(
        JSON.stringify({ error: `Fingerprint ${r.status}`, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = (await r.json()) as EventResp & { products?: { ruleset?: { data?: { result?: { action?: string; ruleName?: string } } } } };
    const p = j.products ?? {};
    const proxyType = (p.proxy?.data?.type ?? null)?.toLowerCase() ?? null;
    const rulesetResult = (p as { ruleset?: { data?: { result?: { action?: string; ruleName?: string } } } }).ruleset?.data?.result ?? null;
    const payload = {
      vpn: p.vpn?.data?.result === true,
      proxy: p.proxy?.data?.result === true,
      proxyType, // "datacenter" | "hosting" | "residential" | "mobile" | "isp" | null
      tor: p.tor?.data?.result === true,
      relay: p.privacySettings?.data?.result === true,
      incognito: p.incognito?.data?.result === true,
      suspectScore: p.suspectScore?.data?.result ?? null,
      ipFromFp: p.ipInfo?.data?.v4?.address ?? null,
      ipCountryFromFp: p.ipInfo?.data?.v4?.geolocation?.country?.code ?? null,
      rulesetAction: rulesetResult?.action ?? null, // e.g. "block" | "allow" from your workspace ruleset
      rulesetRuleName: rulesetResult?.ruleName ?? null,
      fallback: false as const,
    };
    eventCache.set(requestId, { at: Date.now(), payload });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-cache": "MISS" },
    });
  } catch (e) {
    console.error("fingerprint-signals error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "fetch failed", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
