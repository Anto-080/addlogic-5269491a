import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClassifyResult = {
  tierId: number | null;
  tierName: string | null;
  confidence: number;
  /** Broader discipline inside the tier, e.g. "Microbiology". */
  subcategory: string | null;
  /** Narrower specialisation inside the subcategory, e.g. "Virology". */
  subinterest: string | null;
  /** Semantic clusters extracted from the query itself. */
  clusters: string[];
  /** Legacy flat list = [subcategory, subinterest]. */
  subcategories: string[];
  text: string;
};

export function normalizeClassifyResult(data: any, fallbackText: string): ClassifyResult {
  const subcategory = data?.subcategory ?? null;
  const subinterest = data?.subinterest ?? null;
  const clusters = Array.isArray(data?.clusters) ? data.clusters : [];
  const legacy = Array.isArray(data?.subcategories) ? data.subcategories : [];
  return {
    tierId: data?.tierId ?? null,
    tierName: data?.tierName ?? null,
    confidence: Number(data?.confidence) || 0,
    subcategory,
    subinterest,
    clusters: clusters.length ? clusters : legacy,
    subcategories: [subcategory, subinterest].filter(Boolean) as string[],
    text: data?.text ?? fallbackText,
  };
}

/**
 * Calls the classify-interest edge function (Mistral Agent).
 * Returns the main category (tier), its subcategory, the narrower
 * subinterest, and semantic clusters mined from the query.
 */
export function useClassifyInterest() {
  return useMutation({
    mutationFn: async (text: string): Promise<ClassifyResult | null> => {
      const trimmed = text.trim();
      if (trimmed.length < 2) return null;
      const { data, error } = await supabase.functions.invoke("classify-interest", {
        body: { text: trimmed },
      });
      if (error) throw error;
      if (!data) return null;
      return normalizeClassifyResult(data, trimmed);
    },
  });
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "into", "this", "that", "these", "those",
  "what", "when", "where", "why", "how", "who", "which", "is", "are", "was",
  "were", "been", "being", "have", "has", "had", "do", "does", "did", "of",
  "in", "on", "at", "to", "by", "as", "an", "a", "or", "but", "not", "no",
  "yes", "i", "you", "he", "she", "it", "we", "they", "my", "your", "their",
  "our", "his", "her", "its",
]);

export function extractKeywords(text: string, max = 5): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
    ),
  ).slice(0, max);
}

async function upsertTierKeyword(
  userId: string,
  tierId: number,
  keyword: string,
  kind: "keyword" | "subcategory",
) {
  const { data: existing } = await supabase
    .from("tier_keywords")
    .select("id, count")
    .eq("user_id", userId)
    .eq("tier_id", tierId)
    .eq("keyword", keyword)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("tier_keywords")
      .update({ count: existing.count + 1, last_seen: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("tier_keywords")
      .insert({ user_id: userId, tier_id: tierId, keyword, kind });
  }
}

/**
 * Upserts each extracted keyword into `tier_keywords` (kind='keyword').
 */
export async function persistKeywords(userId: string, tierId: number, keywords: string[]) {
  if (!keywords.length) return;
  for (const keyword of keywords) {
    await upsertTierKeyword(userId, tierId, keyword, "keyword");
  }
}

/**
 * Upserts AI-generated semantic subcategories (kind='subcategory').
 * These are the structured zero-party signal that powers per-user
 * personalised tier cards in the Interests Tiers section.
 */
export async function persistSubcategories(userId: string, tierId: number, subs: string[]) {
  if (!subs.length) return;
  for (const sub of subs) {
    await upsertTierKeyword(userId, tierId, sub, "subcategory");
  }
}
