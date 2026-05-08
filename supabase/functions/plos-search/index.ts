// PLOS public Solr search proxy. No API key required.
// Returns concise article cards used by the PlosCard collapsible search.
// verify_jwt = false (public endpoint).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type PlosDoc = {
  id?: string;
  title_display?: string;
  journal?: string;
  publication_date?: string;
  abstract?: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let body: { query?: string; limit?: number } = {};
  try { body = await req.json(); } catch { /* allow GET */ }
  const query = (body.query ?? new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const rows = Math.min(Math.max(body.limit ?? 8, 1), 20);
  const url =
    `https://api.plos.org/search?q=${encodeURIComponent(query)}` +
    `&fl=id,title_display,journal,publication_date,abstract` +
    `&wt=json&rows=${rows}`;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      console.error("plos upstream", r.status);
      return new Response(JSON.stringify({ results: [], error: `PLOS ${r.status}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const docs: PlosDoc[] = j?.response?.docs ?? [];
    const results = docs
      .filter((d) => d.id)
      .map((d) => {
        const journalSlug = (d.journal ?? "plosone").toLowerCase().replace(/[^a-z]/g, "");
        return {
          id: d.id!,
          title: d.title_display ?? "(untitled)",
          journal: d.journal ?? null,
          date: d.publication_date ?? null,
          abstract: Array.isArray(d.abstract) ? d.abstract.join(" ").slice(0, 280) : null,
          url: `https://journals.plos.org/${journalSlug || "plosone"}/article?id=${encodeURIComponent(d.id!)}`,
        };
      });
    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("plos-search error", e);
    return new Response(JSON.stringify({ results: [], error: e instanceof Error ? e.message : "fetch failed" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
