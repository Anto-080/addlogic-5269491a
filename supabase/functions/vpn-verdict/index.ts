// VPN verdict edge function.
//
// Primary signal: Cloudflare Worker headers (x-al-vpn, x-al-ip) injected
// on add-logic.com/* — the client forwards them in the request body.
// Fallback: Abstract IP Intelligence using ABSTRACT_IP_API_KEY.
//
// Returns { block, reason, source }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-al-vpn, x-al-ip",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AbstractResp = {
  ip_address?: string;
  security?: {
    is_vpn?: boolean;
    is_proxy?: boolean;
    is_tor?: boolean;
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1) Worker verdict — preferred. Check both real request headers and any
  //    values the client mirrored into the JSON body (browser fetch can't
  //    read all response headers from cross-origin assets).
  let body: { workerVerdict?: string | null; workerIp?: string | null; ip?: string | null } = {};
  try { body = await req.json(); } catch { /* allow empty body */ }

  const headerVerdict = req.headers.get("x-al-vpn")?.toLowerCase() ?? null;
  const headerIp = req.headers.get("x-al-ip");
  const workerVerdict = (body.workerVerdict ?? headerVerdict)?.toLowerCase() ?? null;
  const workerIp = body.workerIp ?? headerIp ?? null;

  if (workerVerdict === "block" || workerVerdict === "1" || workerVerdict === "true") {
    return new Response(
      JSON.stringify({ block: true, reason: "Cloudflare Worker flagged VPN/proxy", source: "worker", ip: workerIp }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (workerVerdict === "allow" || workerVerdict === "0" || workerVerdict === "false") {
    return new Response(
      JSON.stringify({ block: false, reason: null, source: "worker", ip: workerIp }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 2) Fallback — Abstract IP Intelligence on the supplied IP.
  const ip = body.ip ?? workerIp ?? null;
  const key = Deno.env.get("ABSTRACT_IP_API_KEY");
  if (!ip || !key) {
    return new Response(
      JSON.stringify({ block: false, reason: null, source: "none", ip }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const url = `https://ipintelligence.abstractapi.com/v1/?api_key=${encodeURIComponent(key)}&ip_address=${encodeURIComponent(ip)}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      return new Response(
        JSON.stringify({ block: false, reason: null, source: "abstract", ip, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = (await r.json()) as AbstractResp;
    const sec = j.security ?? {};
    const block = !!(sec.is_vpn || sec.is_proxy || sec.is_tor);
    const reasonParts: string[] = [];
    if (sec.is_vpn) reasonParts.push("VPN");
    if (sec.is_proxy) reasonParts.push("proxy");
    if (sec.is_tor) reasonParts.push("Tor");
    return new Response(
      JSON.stringify({
        block,
        reason: block ? `${reasonParts.join(" / ")} detected on exit IP` : null,
        source: "abstract",
        ip,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("vpn-verdict abstract error", e);
    return new Response(
      JSON.stringify({ block: false, reason: null, source: "abstract", ip, fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
