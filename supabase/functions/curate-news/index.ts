// Edge function: curate-news
// Uses Anthropic Claude to retrieve real, current articles for the user's
// connected tiers of interest. Adapted from the user's Express server.
import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  tierIds?: number[];
  count?: number;
}

interface CuratedArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  tier_id: number;
  tier_name: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const tierIds = Array.isArray(body.tierIds) ? body.tierIds.filter((n) => Number.isFinite(n)) : [];
    const count = Math.min(Math.max(body.count ?? 6, 1), 12);

    if (tierIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "tierIds (non-empty array) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tiers, error: tiersError } = await supabase
      .from("tiers")
      .select("id, name, subcategories")
      .in("id", tierIds);

    if (tiersError || !tiers || tiers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No matching tiers found", details: tiersError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build the interest map for the prompt.
    const interestBlock = tiers
      .map((t: any) => {
        const subs = Array.isArray(t.subcategories) && t.subcategories.length
          ? ` (subtopics: ${t.subcategories.join(", ")})`
          : "";
        return `- Tier ${t.id} — ${t.name}${subs}`;
      })
      .join("\n");

    const prompt = `You are an expert content curator for AddLogic, a research-rewards platform.
Find ${count} real, recent, high-quality news articles or research updates that match these tiers of interest:

${interestBlock}

Strict requirements:
1. Each article MUST come from a real, reputable source (Nature, Science, Reuters, Bloomberg, MIT Tech Review, IEEE Spectrum, FT, WSJ, Ars Technica, The Verge, Wired, BBC, Guardian, etc.).
2. URLs MUST be real, complete, valid HTTPS links to the actual article — never placeholders, never made-up paths.
3. Spread coverage across the listed tiers — do not pile everything on one tier.
4. Prefer items from the last 12 months when possible.
5. Vary the sources — do not repeat the same outlet more than twice.
6. Summaries: 1–2 plain sentences, no marketing fluff.

Respond with ONLY a JSON array (no prose, no markdown, no code fences) of objects with this exact shape:
[
  {
    "title": "string",
    "summary": "string",
    "url": "https://...",
    "source": "string",
    "tier_id": number,
    "tier_name": "string"
  }
]`;

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b: any) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    const raw = textBlock?.text ?? "";

    // Extract the first JSON array from the response, tolerating stray prose.
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) {
      return new Response(
        JSON.stringify({ error: "Claude did not return a JSON array", raw }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: CuratedArticle[];
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse Claude response", details: String(e), raw }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tierMap = new Map(tiers.map((t: any) => [t.id, t.name]));
    const articles = parsed
      .filter((a) => a && typeof a.url === "string" && a.url.startsWith("https://"))
      .map((a) => ({
        title: String(a.title ?? "").trim(),
        summary: String(a.summary ?? "").trim(),
        url: a.url,
        source: String(a.source ?? "").trim() || new URL(a.url).hostname,
        tier_id: typeof a.tier_id === "number" ? a.tier_id : tierIds[0],
        tier_name: a.tier_name || (tierMap.get(a.tier_id) as string) || "",
      }))
      .filter((a) => a.title.length > 0);

    return new Response(
      JSON.stringify({ articles, count: articles.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("curate-news error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
