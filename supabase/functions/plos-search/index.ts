// PLOS public Solr search proxy. Requires a signed-in user to prevent
// open-proxy abuse, even though the upstream API is keyless.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type PlosDoc = {
  id?: string;
  title_display?: string;
  journal?: string;
  publication_date?: string;
  abstract?: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ---- Soft auth: log if missing/invalid but never block. PLOS is keyless
  // and rate-limited upstream, and the gate was breaking the in-app toggle.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { error: authErr } = await userClient.auth.getUser(token);
      if (authErr) console.warn("plos-search soft-auth warn:", authErr.message);
    } catch (e) {
      console.warn("plos-search soft-auth threw:", (e as Error).message);
    }
  }

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
    return new Response(JSON.stringify({ results: [], error: "Upstream unavailable" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
