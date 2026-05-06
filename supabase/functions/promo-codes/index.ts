// Proxies the RapidAPI "Get Promo Codes" endpoint so the API key stays server-side.
// Requires a valid Supabase JWT — prevents anonymous callers from burning the
// RapidAPI quota / accruing costs on the shared key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOST = "get-promo-codes.p.rapidapi.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth gate — only signed-in users may invoke this paid upstream.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
