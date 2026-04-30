// In-app web search powered by DuckDuckGo (HTML endpoint scraped server-side).
// No API key required. Returns the same shape <SearchResults /> already renders.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const limit = Math.min(Math.max(Number(body?.limit) || 8, 1), 15);
    if (!query) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ddg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        // DDG returns a different (sparser) page without a real UA.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!ddg.ok) {
      return new Response(
        JSON.stringify({ error: "Search provider error", status: ddg.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = await ddg.text();
    const results = parseDdgHtml(html, limit);

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
