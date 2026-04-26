// In-app web search powered by Firecrawl. Returns a list of result cards
// the client renders inline — no iframe, so no X-Frame-Options issues.
import { corsHeaders } from "@supabase/supabase-js/cors";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const limit = Math.min(Math.max(Number(body?.limit) || 8, 1), 15);
    if (!query) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fc = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit }),
    });

    const json = await fc.json().catch(() => null);
    if (!fc.ok) {
      return new Response(
        JSON.stringify({
          error: "Search provider error",
          status: fc.status,
          details: json,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Firecrawl v2 returns { success, data: { web: [{ title, url, description, ... }] } }
    // or { data: [...] } depending on version. Normalize both shapes.
    const raw =
      (json?.data?.web && Array.isArray(json.data.web) && json.data.web) ||
      (Array.isArray(json?.data) && json.data) ||
      (Array.isArray(json?.web) && json.web) ||
      [];

    const results: SearchResult[] = raw
      .map((r: Record<string, unknown>) => {
        const url = String(r.url ?? "");
        let host = "";
        try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { host = ""; }
        return {
          title: String(r.title ?? r.metadata?.["title"] ?? url),
          url,
          snippet: String(r.description ?? r.snippet ?? r.markdown ?? ""),
          source: host || "web",
        };
      })
      .filter((r: SearchResult) => r.url);

    return new Response(
      JSON.stringify({ query, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
