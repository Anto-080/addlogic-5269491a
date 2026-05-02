// Zero-shot classification proxy for facebook/bart-large-mnli.
// Maps free-form research queries onto our 17 interest tiers.
// Uses HUGGINGFACE_API_KEY (Lovable Cloud secret).
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
  { id: 1, name: "Biological Systems" },
  { id: 2, name: "Astrophysics & Cosmology" },
  { id: 3, name: "Sustainable Energy" },
  { id: 4, name: "Technology & Computing" },
  { id: 5, name: "Tourism & Travel" },
  { id: 6, name: "Real Estate & Architecture" },
  { id: 7, name: "Finance & Economics" },
  { id: 8, name: "Health & Medicine" },
  { id: 9, name: "Education & Pedagogy" },
  { id: 10, name: "Arts & Culture" },
  { id: 11, name: "Sports & Athletics" },
  { id: 12, name: "Food & Agriculture" },
  { id: 13, name: "Fashion & Lifestyle" },
  { id: 14, name: "Entertainment & Media" },
  { id: 15, name: "Politics & Governance" },
  { id: 16, name: "Religion & Philosophy" },
  { id: 17, name: "Adult Content" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const token = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "HUGGINGFACE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const r = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            candidate_labels: TIER_LABELS.map((t) => t.name),
            multi_label: false,
          },
        }),
      },
    );

    if (!r.ok) {
      const body = await r.text();
      console.error("classify-interest: HF error", r.status, body.slice(0, 400));
      return new Response(
        JSON.stringify({ error: "Upstream classification error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = (await r.json()) as { labels?: string[]; scores?: number[] };
    const topLabel = data.labels?.[0] ?? null;
    const topScore = data.scores?.[0] ?? 0;
    const tier = TIER_LABELS.find((t) => t.name === topLabel);

    return new Response(
      JSON.stringify({
        tierId: tier?.id ?? null,
        tierName: tier?.name ?? null,
        confidence: topScore,
        text,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("classify-interest error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
