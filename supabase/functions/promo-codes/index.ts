// Proxies the RapidAPI "Get Promo Codes" endpoint so the API key stays server-side.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOST = "get-promo-codes.p.rapidapi.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("RAPIDAPI_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "RAPIDAPI_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const page = url.searchParams.get("page") ?? "1";
  const sort = url.searchParams.get("sort") ?? "update_time_desc";

  try {
    const upstream = await fetch(
      `https://${HOST}/data/get-coupons/?page=${encodeURIComponent(page)}&sort=${encodeURIComponent(sort)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": HOST,
          "x-rapidapi-key": key,
        },
      },
    );
    const text = await upstream.text();
    if (!upstream.ok) {
      // Surface upstream errors as a 200 with an error envelope so the client can show
      // a friendly message instead of a red "non-2xx" toast (e.g. RapidAPI 403 "not subscribed").
      return new Response(
        JSON.stringify({ error: "upstream", upstreamStatus: upstream.status, upstreamBody: text, data: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Upstream failed", detail: e instanceof Error ? e.message : String(e) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
