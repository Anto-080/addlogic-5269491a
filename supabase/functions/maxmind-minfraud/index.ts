import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * MaxMind minFraud Score gateway. Runs only when both
 * MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY are set; otherwise the
 * client falls back to FingerprintJS Pro Smart Signals.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const accountId = Deno.env.get("MAXMIND_ACCOUNT_ID");
  const licenseKey = Deno.env.get("MAXMIND_LICENSE_KEY");

  if (!accountId || !licenseKey) {
    return new Response(JSON.stringify({ configured: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");

  if (!ip) {
    return new Response(JSON.stringify({ configured: true, error: "no_ip" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  try {
    const auth = btoa(`${accountId}:${licenseKey}`);
    const r = await fetch("https://minfraud.maxmind.com/minfraud/v2.0/score", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ device: { ip_address: ip } }),
    });
    if (!r.ok) {
      return new Response(JSON.stringify({ configured: true, error: `maxmind_${r.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const j = await r.json();
    const ipRisk = Number(j?.ip_address?.risk ?? 0);
    const riskScore = Number(j?.risk_score ?? 0);
    const traits = j?.ip_address?.traits ?? {};
    const isVpn = !!(traits.is_anonymous_vpn || traits.is_anonymous);
    const isHostingProvider = !!traits.is_hosting_provider;
    const isPublicProxy = !!traits.is_public_proxy;
    const isTorExitNode = !!traits.is_tor_exit_node;

    return new Response(
      JSON.stringify({
        configured: true,
        riskScore,
        ipRisk,
        isVpn,
        isHostingProvider,
        isPublicProxy,
        isTorExitNode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ configured: true, error: e instanceof Error ? e.message : "minfraud_failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
