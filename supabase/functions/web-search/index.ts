// In-app web search powered by DuckDuckGo (HTML endpoint scraped server-side).
// No API key required. Returns the same shape <SearchResults /> already renders.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

// DDG wraps real URLs behind /l/?uddg=<encoded>
function unwrapDdgUrl(href: string): string {
  try {
    const u = href.startsWith("//") ? `https:${href}` : href;
    const parsed = new URL(u, "https://duckduckgo.com");
    const wrapped = parsed.searchParams.get("uddg");
    if (wrapped) return decodeURIComponent(wrapped);
    return parsed.toString();
  } catch {
    return href;
  }
}

function parseDdgHtml(html: string, limit: number): SearchResult[] {
  const out: SearchResult[] = [];
  // Each result is a div with class result__body / result. Match title anchor + snippet.
  const blockRe = /<div[^>]*class="[^"]*\bresult\b[^"]*"[\s\S]*?(?=<div[^>]*class="[^"]*\bresult\b|$)/g;
  const blocks = html.match(blockRe) ?? [];
  for (const block of blocks) {
    if (out.length >= limit) break;
    const aMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!aMatch) continue;
    const url = unwrapDdgUrl(aMatch[1]);
    const title = decodeEntities(stripTags(aMatch[2])).trim();
    const snipMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/);
    const snippet = snipMatch ? decodeEntities(stripTags(snipMatch[1])).trim() : "";
    let source = "web";
    try { source = new URL(url).hostname.replace(/^www\./, ""); } catch { /* noop */ }
    if (url && title) out.push({ title, url, snippet, source });
  }
  return out;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** DuckDuckGo HTML endpoints. DDG answers 202 + an anomaly page when it
 *  throttles datacenter IPs, so this can legitimately come back empty. */
async function searchDdg(query: string, limit: number): Promise<SearchResult[]> {
  const attempts: Array<() => Promise<Response>> = [
    () =>
      fetch("https://html.duckduckgo.com/html/", {
        method: "POST",
        headers: {
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://duckduckgo.com/",
        },
        body: new URLSearchParams({ q: query, kl: "wt-wt" }).toString(),
      }),
    () =>
      fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      }),
  ];
  for (const attempt of attempts) {
    try {
      const r = await attempt();
      if (!r.ok && r.status !== 202) continue;
      const html = await r.text();
      const parsed = parseDdgHtml(html, limit);
      if (parsed.length) return parsed;
      // The lite layout has no result__a classes — parse its table anchors.
      const lite = parseLiteHtml(html, limit);
      if (lite.length) return lite;
    } catch (e) {
      console.warn("ddg attempt failed:", (e as Error).message);
    }
  }
  return [];
}

function parseLiteHtml(html: string, limit: number): SearchResult[] {
  const out: SearchResult[] = [];
  const re = /<a[^>]*class="[^"]*result-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < limit) {
    const url = unwrapDdgUrl(m[1]);
    const title = decodeEntities(stripTags(m[2])).trim();
    let source = "web";
    try { source = new URL(url).hostname.replace(/^www\./, ""); } catch { /* noop */ }
    if (url && title) out.push({ title, url, snippet: "", source });
  }
  return out;
}

async function runSearch(query: string, limit: number): Promise<SearchResult[]> {
  return await searchDdg(query, limit);
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ---- Auth gate: require a valid signed-in user. ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
    if (query.length > 300) {
      return new Response(
        JSON.stringify({ error: "query must be 300 characters or fewer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = await runSearch(query, limit);


    return new Response(
      JSON.stringify({ query, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("web-search error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
