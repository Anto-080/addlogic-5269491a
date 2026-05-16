// Mistral Agent classifier — assigns a research query to one of the 18 tiers
// and generates 1-3 dynamic, semantic subcategories.
// Replaces the previous HuggingFace BART zero-shot classifier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Tier names — kept in sync with src/lib/mockData.ts (TIERS).
const TIER_LABELS: { id: number; name: string }[] = [
  { id: 1, name: "Biological Systems & Lifesaving Technologies" },
  { id: 2, name: "Biochemical Knowledge" },
  { id: 3, name: "Systematically Important Scientific Research" },
  { id: 4, name: "Ecology & Natural Biomes" },
  { id: 5, name: "Financial & Economic Services" },
  { id: 6, name: "Technological Advancements" },
  { id: 7, name: "Art & Culture / Humanism" },
  { id: 8, name: "Global News" },
  { id: 9, name: "Entertainment: Movies, Games, Books" },
  { id: 10, name: "Food: Recipes, Nutrition, Diets" },
  { id: 11, name: "Real Estate Services" },
  { id: 12, name: "Personal Shopping" },
  { id: 13, name: "Personal Care: Skin, Perfume, Makeup" },
  { id: 14, name: "Clothes & Accessories" },
  { id: 15, name: "Sports & eSports" },
  { id: 16, name: "Betting Services" },
  { id: 17, name: "Adult Entertainment" },
  { id: 18, name: "Tourism & Travel" },
];

const SYSTEM_PROMPT = `You are a strict research-query classifier. The user submits a free-form research query. You MUST:
1. Pick exactly ONE tier from the list (by id) that best captures the topic.
2. Generate 1 to 3 short, specific subcategories (2-4 words each) that describe sub-themes of the query, in the same language as the query when possible.
3. Estimate a confidence score in [0,1].

Tiers:
${TIER_LABELS.map((t) => `${t.id}. ${t.name}`).join("\n")}

Return ONLY a JSON object with this exact shape, nothing else:
{"tierId": <int>, "tierName": <string>, "confidence": <float 0..1>, "subcategories": [<string>, ...]}`;

async function callMistral(query: string): Promise<{
  tierId: number | null;
  tierName: string | null;
  confidence: number;
  subcategories: string[];
} | null> {
  const apiKey = Deno.env.get("MISTRAL_API_KEY");
  const agentId = Deno.env.get("MISTRAL_AGENT_ID");
  if (!apiKey) throw new Error("MISTRAL_API_KEY not configured");

  // Try Agents API first if agent id is provided.
  let body: Record<string, unknown>;
  let url: string;
  if (agentId) {
    url = "https://api.mistral.ai/v1/agents/completions";
    body = {
      agent_id: agentId,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
    };
  } else {
    url = "https://api.mistral.ai/v1/chat/completions";
    body = {
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    };
  }

  let r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Fallback: if Agents API rejects (e.g. 4xx), try chat completions.
  if (!r.ok && agentId) {
    console.warn("Agents API failed, falling back to chat completions:", r.status);
    r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
  }

  if (!r.ok) {
    const t = await r.text();
    console.error("Mistral error", r.status, t.slice(0, 400));
    if (r.status === 429) throw new Error("rate_limited");
    if (r.status === 402) throw new Error("payment_required");
    throw new Error(`mistral_${r.status}`);
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  let parsed: any;
  try { parsed = JSON.parse(content); } catch {
    // Try to recover JSON inside text.
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { parsed = JSON.parse(m[0]); } catch { return null; }
  }

  const tierId = Number.isFinite(parsed.tierId) ? Number(parsed.tierId) : null;
  const tier = TIER_LABELS.find((t) => t.id === tierId);
  const subs: string[] = Array.isArray(parsed.subcategories)
    ? parsed.subcategories
        .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
        .filter((s: string) => s.length >= 2 && s.length <= 60)
        .slice(0, 3)
    : [];
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

  return {
    tierId: tier?.id ?? null,
    tierName: tier?.name ?? null,
    confidence,
    subcategories: subs,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const { text } = (await req.json()) as { text?: string };
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Missing 'text'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (text.length > 500) {
      return new Response(
        JSON.stringify({ error: "'text' must be 500 characters or fewer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await callMistral(text.trim());
    if (!result) {
      return new Response(
        JSON.stringify({ error: "Classification failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Persist Mistral-derived multiplier on user_stats AND stamp a
    // 5-minute window during which the ExperienceBar accumulator ticks.
    // Base multiplier reads cookie/GPS toggles from profiles.preferences
    // (server-side source of truth) and the query weight multiplies it.
    try {
      const tierWeights: Record<number, number> = {
        1: 10, 2: 9.2, 3: 8.5, 4: 7.5, 5: 6.5, 6: 5.8, 7: 5.2,
        8: 4.5, 9: 4.0, 10: 3.5, 11: 3.0, 12: 2.5, 13: 2.2,
        14: 1.8, 15: 1.4, 16: 0.8, 17: 0.5, 18: 3.2,
      };
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (serviceKey) {
        const admin = createClient(SUPABASE_URL, serviceKey);
        const { data: prof } = await admin
          .from("profiles")
          .select("preferences")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        const prefs = (prof?.preferences ?? {}) as Record<string, unknown>;
        const cookies = !!prefs.cookies;
        const gps = !!prefs.gps;
        const base = 1 + (cookies ? 2 : 0) + (gps ? 5 : 0);
        const w = result.tierId ? tierWeights[result.tierId] ?? 1 : 1;
        const queryFactor = Math.max(1, w * (result.confidence || 0.5));
        const newMultiplier = Math.max(1, Math.min(20, base * queryFactor / 5));
        const lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await admin.from("user_stats")
          .update({
            current_multiplier: newMultiplier,
            locked_query: text.trim().slice(0, 200),
            locked_until: lockedUntil,
          })
          .eq("user_id", userData.user.id);
      }
    } catch (e) {
      console.warn("multiplier persist failed:", (e as Error).message);
    }

    return new Response(
      JSON.stringify({ ...result, text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    console.error("classify-interest error:", msg);
    const status = msg === "rate_limited" ? 429 : msg === "payment_required" ? 402 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
