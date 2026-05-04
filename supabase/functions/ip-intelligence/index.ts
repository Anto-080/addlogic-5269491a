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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ABSTRACT_IP_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ABSTRACT_IP_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Resolve caller IP from forwarded header.
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const callerIp = fwd.split(",")[0]?.trim() || "";

  const url = new URL("https://ip-intelligence.abstractapi.com/v1/");
  url.searchParams.set("api_key", apiKey);
  if (callerIp) url.searchParams.set("ip_address", callerIp);

  try {
    const r = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!r.ok) {
      const text = await r.text();
      return new Response(
        JSON.stringify({ error: `Abstract API ${r.status}`, detail: text.slice(0, 300) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = (await r.json()) as AbstractResp;

    const sec = j.security ?? {};
    const flags: { key: string; reason: string }[] = [
      { key: "is_vpn", reason: "VPN flag from Abstract" },
      { key: "is_proxy", reason: "Proxy flag from Abstract" },
      { key: "is_tor", reason: "Tor exit node" },
      { key: "is_relay", reason: "Anonymous relay" },
      { key: "is_hosting", reason: "Hosting / datacenter IP" },
    ];
    const matched = flags.find((f) => (sec as Record<string, boolean | undefined>)[f.key] === true);

    // ASN/company type fallback — Abstract sometimes labels datacenters via type.
    const asnType = String(j.asn?.type ?? "").toLowerCase();
    const companyType = String(j.company?.type ?? "").toLowerCase();
    const typeReason =
      !matched &&
      (asnType.includes("hosting") ||
        asnType.includes("isp/hosting") ||
        companyType.includes("hosting") ||
        companyType.includes("vpn") ||
        companyType.includes("proxy"))
        ? `Non-residential ASN type: ${asnType || companyType}`
        : null;

    const reason = matched?.reason ?? typeReason ?? null;

    const payload = {
      ip: j.ip_address ?? callerIp ?? "",
      country_code: j.location?.country_code ?? null,
      country_name: j.location?.country ?? null,
      asn: j.asn?.asn != null ? String(j.asn.asn) : null,
      org: j.company?.name ?? j.asn?.name ?? null,
      vpn_suspected: !!reason,
      reason,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "fetch failed" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
