// FingerprintJS Identification proxy (Free + Pro compatible).
//
// GET  → returns { publicKey, region, configured } for the browser agent.
// POST { requestId } → server-side fetches the event using the server key
//      and returns { visitorId, ip, ipCountry }. No Smart-Signals parsing
//      (Free tier doesn't include them). VPN verdict lives in `vpn-verdict`.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

type EventResp = {
  products?: {
    identification?: { data?: { visitorId?: string } };
    ipInfo?: {
      data?: {
        v4?: { address?: string; geolocation?: { country?: { code?: string } } };
      };
    };
  };
};

const eventCache = new Map<string, { at: number; payload: unknown }>();
const EVENT_TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const region = Deno.env.get("FINGERPRINT_REGION") ?? "us";
  const publicKey = Deno.env.get("FINGERPRINT_PUBLIC_API_KEY") ?? "";
  const serverKey = Deno.env.get("FINGERPRINT_SERVER_API_KEY") ?? "";

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ publicKey, region, configured: !!publicKey && !!serverKey }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!serverKey) {
    return new Response(
      JSON.stringify({ error: "FINGERPRINT_SERVER_API_KEY not configured", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { requestId?: string } = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const requestId = body.requestId?.trim();
  if (!requestId) {
    return new Response(JSON.stringify({ error: "requestId required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const url = `${regionBase(region)}/events/${encodeURIComponent(requestId)}`;
    const r = await fetch(url, {
      headers: { "Auth-API-Key": serverKey, Accept: "application/json" },
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("fingerprint-signals upstream error", r.status, text);
      return new Response(
        JSON.stringify({ error: `Fingerprint ${r.status}`, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = (await r.json()) as EventResp;
    const p = j.products ?? {};
    const payload = {
      visitorId: p.identification?.data?.visitorId ?? null,
      ip: p.ipInfo?.data?.v4?.address ?? null,
      ipCountry: p.ipInfo?.data?.v4?.geolocation?.country?.code ?? null,
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
